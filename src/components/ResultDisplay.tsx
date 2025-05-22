import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Leaf, Drumstick, Carrot, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NutritionInfo {
  servingSize: string;
  calories: string;
  protein: string;
  carbohydrates: string;
  fat: string;
  fiber: string;
  sugar: string;
  minerals: string;
}

interface ResultDisplayProps {
  result: {
    dish: string;
    nutrition: NutritionInfo;
    benefits: string[];
    category: string;
    avoidWhen: string[];
  };
  image: File;
}

const ResultDisplay: React.FC<ResultDisplayProps> = ({ result, image }) => {
  const [showNutrition, setShowNutrition] = useState(true);
  const [showBenefits, setShowBenefits] = useState(true);
  const [showAvoidWhen, setShowAvoidWhen] = useState(false);
  const imageUrl = URL.createObjectURL(image);

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vegetarian':
        return <Leaf className="text-green-500" />;
      case 'non-vegetarian':
        return <Drumstick className="text-red-500" />;
      case 'vegan':
        return <Carrot className="text-orange-500" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'vegetarian':
        return 'bg-green-100 text-green-800';
      case 'non-vegetarian':
        return 'bg-red-100 text-red-800';
      case 'vegan':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-lg overflow-hidden"
      >
        <div className="relative">
          <img 
            src={imageUrl} 
            alt={result.dish} 
            className="w-full h-64 object-cover"
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
            <h2 className="text-2xl font-bold text-white mb-2">{result.dish}</h2>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(result.category)}`}>
              {getCategoryIcon(result.category)}
              <span className="ml-2">{result.category}</span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowNutrition(!showNutrition)}
        >
          <div className="flex items-center">
            <Info className="text-indigo-500 mr-2" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Nutrition Facts</h3>
          </div>
          {showNutrition ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
        
        <AnimatePresence>
          {showNutrition && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-600">Serving Size: {result.nutrition.servingSize}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(result.nutrition).map(([key, value]) => {
                  if (key !== 'servingSize' && value) {
                    return (
                      <div key={key} className="bg-indigo-50 rounded-lg p-4">
                        <div className="text-sm text-gray-500 capitalize">{key}</div>
                        <div className="text-lg font-semibold text-indigo-700">{value}</div>
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowBenefits(!showBenefits)}
        >
          <div className="flex items-center">
            <Leaf className="text-green-500 mr-2" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Health Benefits</h3>
          </div>
          {showBenefits ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
        
        <AnimatePresence>
          {showBenefits && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 grid gap-3"
            >
              {result.benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center bg-green-50 rounded-lg p-4"
                >
                  <div className="h-2 w-2 bg-green-500 rounded-full mr-3"></div>
                  <p className="text-gray-700">{benefit}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-2xl shadow-lg p-6"
      >
        <div 
          className="flex justify-between items-center cursor-pointer"
          onClick={() => setShowAvoidWhen(!showAvoidWhen)}
        >
          <div className="flex items-center">
            <AlertTriangle className="text-amber-500 mr-2" size={24} />
            <h3 className="text-xl font-bold text-gray-800">Precautions</h3>
          </div>
          {showAvoidWhen ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
        </div>
        
        <AnimatePresence>
          {showAvoidWhen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="mt-4 space-y-3"
            >
              {result.avoidWhen.map((situation, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center bg-amber-50 rounded-lg p-4"
                >
                  <AlertTriangle className="text-amber-500 mr-3" size={16} />
                  <p className="text-gray-700">{situation}</p>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default ResultDisplay;