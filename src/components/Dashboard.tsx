import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Upload, LogOut, Utensils, Edit, List, Trash2, Clock, ChevronDown, ChevronUp, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import ImageUploader from './ImageUploader';
import ResultDisplay from './ResultDisplay';
import { identifyDishAndNutrition } from '../services/geminiService';
import CalorieProgress from './CalorieProgress';
import CalorieCalendar from './CalorieCalendar';
import { motion, AnimatePresence } from 'framer-motion';

interface FoodItem {
  _id: string;
  name: string;
  calories: number;
  timestamp: string;
  quantity: number;
}

const Dashboard = () => {
  const [image, setImage] = useState<File | null>(null);
  const [result, setResult] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const [calorieIntake, setCalorieIntake] = useState(0);
  const [calorieGoal, setCalorieGoal] = useState(2000);

  const [notification, setNotification] = useState<string | null>(null);
  const [editGoal, setEditGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(calorieGoal);

  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);

  const [quantity, setQuantity] = useState<number>(1);

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [isTodaysFoodHistoryExpanded, setIsTodaysFoodHistoryExpanded] = useState(true);
  const [isPastFoodHistoryExpanded, setIsPastFoodHistoryExpanded] = useState(true);

  const [selectedDate, setSelectedDate] = useState(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });

  const [historicalDate, setHistoricalDate] = useState<Date | null>(() => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  });

  const [historicalFoodItems, setHistoricalFoodItems] = useState<FoodItem[]>([]);
  const [historicalCalorieIntake, setHistoricalCalorieIntake] = useState(0);

  const toggleItemExpansion = (itemId: string) => {
    setExpandedItems(prevExpanded => {
      const newExpanded = new Set(prevExpanded);
      if (newExpanded.has(itemId)) {
        newExpanded.delete(itemId);
      } else {
        newExpanded.add(itemId);
      }
      return newExpanded;
    });
  };

  const toggleTodaysFoodHistoryExpansion = () => {
    setIsTodaysFoodHistoryExpanded(!isTodaysFoodHistoryExpanded);
  };

  const togglePastFoodHistoryExpansion = () => {
    setIsPastFoodHistoryExpanded(!isPastFoodHistoryExpanded);
  };

  useEffect(() => {
    fetchCalorieData();
    fetchCalorieDataForDate(selectedDate);
  }, []);

  const fetchCalorieData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/calorie-intake`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (response.ok) {
        setCalorieIntake(data.calories);
        setCalorieGoal(data.goal);
        setFoodItems(data.foodItems);
      } else {
        console.error('Failed to fetch calorie data:', data.error);
      }
    } catch (error) {
      console.error('Error fetching calorie data:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    setImage(file);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const identificationResult = await identifyDishAndNutrition(file);
      setResult(identificationResult);
    } catch (error) {
      console.error('Error identifying dish:', error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleEatenClick = async () => {
    setResult(null);
    if (result) {
      const caloriesPerServing = parseInt(result.nutrition.calories);
      const totalCalories = Math.round(caloriesPerServing * quantity);
      const timestamp = new Date().toISOString();
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/add-calories`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ 
            calories: totalCalories, 
            foodName: result.dish, 
            timestamp, 
            quantity 
          }),
        });
        if (response.ok) {
          setNotification(`Great job! You've added ${result.dish} (${totalCalories} calories) to your food diary.`);
          setTimeout(() => setNotification(null), 5000);
          await fetchCalorieData();
          setQuantity(1);
          setImage(null);
        } else {
          console.error('Failed to add calories');
          setNotification('Oops! We couldn\'t add your food. Please try again.');
          setTimeout(() => setNotification(null), 5000);
        }
      } catch (error) {
        console.error('Error adding calories:', error);
        setNotification('Something went wrong. Please check your connection and try again.');
        setTimeout(() => setNotification(null), 5000);
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleEditGoalClick = () => {
    setNewGoal(calorieGoal);
    setEditGoal(true);
  };

  const handleGoalChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNewGoal(parseInt(event.target.value));
  };

  const handleGoalSubmit = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/update-calorie-goal`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ goal: newGoal }),
      });

      if (response.ok) {
        setCalorieGoal(newGoal);
        setEditGoal(false);
        setNotification('Calorie goal updated successfully');
        setTimeout(() => setNotification(null), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to update calorie goal');
      }
    } catch (error) {
      console.error('Error updating calorie goal:', error);
      setError('An unexpected error occurred');
    }
  };

  const handleDeleteFoodItem = async (itemId: string, calories: number, foodName: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/delete-food-item`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ itemId }),
      });

      if (response.ok) {
        const data = await response.json();
        setNotification(`${foodName} (${data.removedCalories} calories) has been removed from your food diary.`);
        setTimeout(() => setNotification(null), 5000);
        await fetchCalorieData();
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete food item');
        setNotification('We couldn\'t remove that food item. Please try again.');
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('Error deleting food item:', error);
      setError('An unexpected error occurred');
      setNotification('Something went wrong while removing the food item. Please try again later.');
      setTimeout(() => setNotification(null), 5000);
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setHistoricalDate(date);
    await fetchCalorieDataForDate(date);
  };

  const fetchCalorieDataForDate = async (date: Date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/calorie-intake/${formattedDate}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }
      const data = await response.json();
      setHistoricalCalorieIntake(data.calories);
      setHistoricalFoodItems(data.foodItems);
      setHistoricalDate(new Date(data.date));
    } catch (error) {
      console.error('Error fetching calorie data:', error);
      setHistoricalCalorieIntake(0);
      setHistoricalFoodItems([]);
      setError('Failed to fetch calorie data for the selected date. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    if (historicalDate) {
      const newDate = new Date(historicalDate);
      newDate.setDate(newDate.getDate() + (direction === 'prev' ? -1 : 1));
      handleDateSelect(newDate);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <header className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8 bg-white p-6 rounded-2xl shadow-lg backdrop-blur-lg bg-opacity-90">
          <div className="flex items-center">
            <Utensils className="h-8 w-8 text-indigo-600 mr-3" />
            <h1 className="text-3xl font-bold text-indigo-700">Calorie Tracker</h1>
          </div>
          <button
            onClick={handleLogout}
            className="w-full sm:w-auto bg-red-100 hover:bg-red-200 text-red-700 font-semibold py-2.5 px-6 rounded-full focus:outline-none focus:ring-2 focus:ring-red-400 focus:ring-opacity-50 flex items-center justify-center transition-all duration-300 ease-in-out"
          >
            <LogOut className="mr-2" size={20} />
            Logout
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white p-6 rounded-2xl shadow-lg backdrop-blur-lg bg-opacity-90"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h2 className="text-2xl font-semibold text-indigo-600">Daily Progress</h2>
                {editGoal ? (
                  <div className="flex items-center w-full sm:w-auto">
                    <input
                      type="number"
                      value={newGoal}
                      onChange={handleGoalChange}
                      className="w-full sm:w-24 border rounded-l px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                    <button
                      onClick={handleGoalSubmit}
                      className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-2 px-4 rounded-r transition-colors duration-300"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleEditGoalClick}
                    className="w-full sm:w-auto bg-indigo-100 hover:bg-indigo-200 text-indigo-700 font-semibold py-2.5 px-6 rounded-full flex items-center justify-center transition-colors duration-300"
                  >
                    <Edit className="mr-2" size={16} />
                    Edit Goal
                  </button>
                )}
              </div>
              <CalorieProgress intake={calorieIntake} goal={calorieGoal} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white p-6 rounded-2xl shadow-lg backdrop-blur-lg bg-opacity-90"
            >
              <h2 className="text-2xl font-semibold text-indigo-600 mb-6">Add Food</h2>
              <ImageUploader onImageUpload={handleImageUpload} />

              {loading && (
                <div className="mt-8 flex flex-col items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
                  <p className="mt-4 text-indigo-600">Analyzing your dish...</p>
                </div>
              )}

              {error && (
                <div className="mt-6 p-4 bg-red-50 rounded-lg text-red-600 text-center">
                  <p>{error}</p>
                </div>
              )}

              {result && image && (
                <div className="mt-8">
                  <ResultDisplay result={result} image={image} />
                  <div className="mt-6 bg-gray-50 p-6 rounded-xl">
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      Serving Size
                    </label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value))}
                      className="w-full border rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                      min="0.1"
                      step="0.1"
                      placeholder="Enter number of servings"
                    />
                    <p className="mt-2 text-sm text-gray-500">
                      Specify the number of servings (e.g., 1.5 for one and a half servings)
                    </p>
                  </div>
                  <button
                    onClick={handleEatenClick}
                    className="mt-6 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-3.5 px-6 rounded-xl flex items-center justify-center transition-colors duration-300"
                  >
                    <Utensils className="mr-2" size={20} />
                    I've Eaten This
                  </button>
                </div>
              )}
            </motion.div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white p-6 rounded-2xl shadow-lg backdrop-blur-lg bg-opacity-90"
            >
              <div 
                className="flex justify-between items-center cursor-pointer" 
                onClick={toggleTodaysFoodHistoryExpansion}
              >
                <h2 className="text-2xl font-semibold text-indigo-600">Today's Food</h2>
                <motion.div
                  animate={{ rotate: isTodaysFoodHistoryExpanded ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown size={24} className="text-indigo-500" />
                </motion.div>
              </div>

              <AnimatePresence>
                {isTodaysFoodHistoryExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4"
                  >
                    {foodItems.length > 0 ? (
                      <ul className="divide-y divide-gray-100">
                        {foodItems.map((item) => (
                          <li key={item._id} className="py-4">
                            <div 
                              className="flex justify-between items-center cursor-pointer"
                              onClick={() => toggleItemExpansion(item._id)}
                            >
                              <div>
                                <span className="font-medium text-gray-900">{item.name}</span>
                                <span className="ml-2 text-sm text-gray-500">({item.calories} cal)</span>
                              </div>
                              <motion.div
                                animate={{ rotate: expandedItems.has(item._id) ? 180 : 0 }}
                                transition={{ duration: 0.3 }}
                              >
                                <ChevronDown size={20} className="text-gray-400" />
                              </motion.div>
                            </div>

                            {expandedItems.has(item._id) && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-2 pl-4 space-y-2"
                              >
                                <div className="flex items-center text-sm text-gray-600">
                                  <Clock size={14} className="mr-1.5" />
                                  {formatTime(item.timestamp)}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {item.quantity} {item.quantity === 1 ? 'serving' : 'servings'}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteFoodItem(item._id, item.calories, item.name);
                                  }}
                                  className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center"
                                >
                                  <Trash2 size={14} className="mr-1.5" />
                                  Remove
                                </button>
                              </motion.div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No food items recorded today</p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white p-6 rounded-2xl shadow-lg backdrop-blur-lg bg-opacity-90"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-indigo-600">History</h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => navigateDate('prev')}
                    className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => navigateDate('next')}
                    className="p-2 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200 transition-colors"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
              
              <CalorieCalendar onDateSelect={handleDateSelect} selectedDate={selectedDate} />
              
              {historicalDate && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mt-6 bg-indigo-50 p-4 rounded-xl"
                >
                  <h3 className="text-lg font-semibold text-indigo-800 mb-3">
                    {formatDate(historicalDate)}
                  </h3>
                  <div className="flex justify-between items-center mb-4 text-sm">
                    <span className="text-indigo-600">{historicalCalorieIntake} cal</span>
                    <span className="text-indigo-600">Goal: {calorieGoal} cal</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-2 mb-4">
                    <div 
                      className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((historicalCalorieIntake / calorieGoal) * 100, 100)}%` }}
                    ></div>
                  </div>
                  {historicalFoodItems.length > 0 ? (
                    <ul className="divide-y divide-indigo-100">
                      {historicalFoodItems.map((item) => (
                        <li key={item._id} className="py-3 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="text-sm text-gray-500">
                              {item.quantity} {item.quantity === 1 ? 'serving' : 'servings'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className="text-indigo-600 font-medium mr-2">{item.calories} cal</span>
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-sm text-gray-500 ml-1">{formatTime(item.timestamp)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500 text-center py-4">No food items recorded</p>
                  )}
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-4 right-4 max-w-md bg-green-100 text-green-800 px-6 py-3 rounded-xl shadow-lg"
          >
            {notification}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;