import React, { useState, useEffect } from 'react';

import { Trophy, Lock, TrendingUp } from 'lucide-react';
import { achievementsAPI } from '../../services/api';

function AchievementsComponent() {
  const [achievements, setAchievements] = useState([]);
  const [summary, setSummary] = useState({
    total_achievements: 0,
    unlocked_achievements: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAchievements();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const data = await achievementsAPI.getMyAchievements();
      
      // Convert achievements object to array
      const achievementsArray = Object.values(data.achievements);
      setAchievements(achievementsArray);
      setSummary(data.summary);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressColor = (progress, goal) => {
    const percentage = (progress / goal) * 100;
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 50) return 'bg-blue-500';
    return 'bg-gray-400';
  };

  const getProgressPercentage = (progress, goal) => {
    return Math.min((progress / goal) * 100, 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Card */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Your Achievements</h2>
            <p className="text-green-100">
              You've unlocked {summary.unlocked_achievements} out of {summary.total_achievements} achievements!
            </p>
          </div>
          <Trophy className="w-16 h-16 text-yellow-300" />
        </div>
        
        {/* Overall Progress */}
        <div className="mt-4">
          <div className="flex justify-between text-sm mb-1">
            <span>Overall Progress</span>
            <span>{Math.round((summary.unlocked_achievements / summary.total_achievements) * 100)}%</span>
          </div>
          <div className="w-full bg-green-700 rounded-full h-3">
            <div 
              className="bg-yellow-300 h-3 rounded-full transition-all duration-500"
              style={{ width: `${(summary.unlocked_achievements / summary.total_achievements) * 100}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {achievements.map((achievement, index) => (
          <div
            key={index}
            className={`rounded-lg shadow-md p-6 transition-all duration-300 ${
              achievement.unlocked
                ? 'bg-white hover:shadow-xl border-2 border-green-500'
                : 'bg-gray-100 opacity-75'
            }`}
          >
            {/* Achievement Icon */}
            <div className="relative mb-4">
              <div className="text-6xl text-center">
                {achievement.icon}
              </div>
              {!achievement.unlocked && (
                <div className="absolute top-0 right-0">
                  <Lock className="w-6 h-6 text-gray-400" />
                </div>
              )}
              {achievement.unlocked && (
                <div className="absolute top-0 right-0">
                  <Trophy className="w-6 h-6 text-yellow-500" />
                </div>
              )}
            </div>

            {/* Achievement Info */}
            <h3 className="text-xl font-bold text-gray-800 mb-2 text-center">
              {achievement.title}
            </h3>
            <p className="text-gray-600 text-sm text-center mb-4">
              {achievement.description}
            </p>

            {/* Progress */}
            <div className="mb-3">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-gray-700">
                  {achievement.count} {achievement.unit || ''}
                </span>
                <span className="text-gray-500">
                  Goal: {achievement.goal} {achievement.unit || ''}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className={`${getProgressColor(achievement.progress, achievement.goal)} h-2.5 rounded-full transition-all duration-500`}
                  style={{ width: `${getProgressPercentage(achievement.progress, achievement.goal)}%` }}
                ></div>
              </div>
            </div>

            {/* Level Badge */}
            <div className="flex items-center justify-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                achievement.nextLevel === 'Expert' 
                  ? 'bg-purple-100 text-purple-700'
                  : achievement.nextLevel === 'Advanced'
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {achievement.nextLevel}
              </span>
            </div>

            {/* Status */}
            {achievement.unlocked ? (
              <div className="mt-4 text-center">
                <span className="inline-flex items-center gap-1 text-green-600 font-semibold text-sm">
                  <Trophy className="w-4 h-4" />
                  Unlocked!
                </span>
              </div>
            ) : (
              <div className="mt-4 text-center">
                <span className="text-gray-500 text-sm">
                  {achievement.goal - achievement.progress} more to unlock
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default AchievementsComponent;