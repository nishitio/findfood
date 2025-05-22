import React from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

interface CalorieProgressProps {
  intake: number;
  goal: number;
}

const CalorieProgress: React.FC<CalorieProgressProps> = ({ intake, goal }) => {
  const percentage = Math.min((intake / goal) * 100, 100);
  const remaining = Math.max(goal - intake, 0);

  return (
    <div className="bg-white rounded-xl p-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-indigo-600">{intake}</div>
          <div className="text-sm text-gray-500">Calories Consumed</div>
        </div>
        
        <div className="w-32 h-32 mx-auto">
          <CircularProgressbar
            value={percentage}
            text={`${Math.round(percentage)}%`}
            styles={buildStyles({
              rotation: 0.25,
              strokeLinecap: 'round',
              textSize: '16px',
              pathTransitionDuration: 0.5,
              pathColor: `rgba(99, 102, 241, ${percentage / 100})`,
              textColor: '#4F46E5',
              trailColor: '#E0E7FF',
              backgroundColor: '#3e98c7',
            })}
          />
        </div>

        <div className="flex flex-col items-center">
          <div className="text-2xl font-bold text-green-600">{remaining}</div>
          <div className="text-sm text-gray-500">Calories Remaining</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-2 w-full bg-indigo-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
        <div className="mt-2 flex justify-between text-sm text-gray-500">
          <span>0</span>
          <span>{goal} kcal goal</span>
        </div>
      </div>
    </div>
  );
};

export default CalorieProgress;