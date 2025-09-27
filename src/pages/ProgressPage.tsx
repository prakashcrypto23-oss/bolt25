import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Heart, Moon, Brain, Target, Smile, Meh, Frown, Award, 
  Filter, Download, CheckCircle, PieChart as PieChartIcon,
  TrendingUp, Calendar, Clock, Star, Users, Activity
} from 'lucide-react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

function ProgressPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [selectedMetric, setSelectedMetric] = useState('mood');
  const [userProgress, setUserProgress] = useState<any>(null);
  const [moodData, setMoodData] = useState<any[]>([]);
  const [therapyProgress, setTherapyProgress] = useState<any[]>([]);
  const [moodDistribution, setMoodDistribution] = useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = useState<any[]>([]);


  const achievements = [
    { title: '7-Day Streak', description: 'Completed daily check-ins for 7 days', earned: true, date: '2024-01-07' },
    { title: 'Mindfulness Master', description: 'Completed 10 meditation sessions', earned: true, date: '2024-01-05' },
    { title: 'Sleep Champion', description: 'Maintained 8+ hours sleep for 5 days', earned: false, progress: 60 },
    { title: 'Therapy Graduate', description: 'Complete 3 therapy modules', earned: false, progress: 66 }
  ];

  const timeframes = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '3 Months' },
    { value: '1y', label: '1 Year' }
  ];

  useEffect(() => {
    const saved = localStorage.getItem('mindcare_user_progress');
    if (saved) {
      setUserProgress(JSON.parse(saved));
    }
    
    loadProgressData();
  }, []);

  // Listen for storage changes to update data in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      const saved = localStorage.getItem('mindcare_user_progress');
      if (saved) {
        setUserProgress(JSON.parse(saved));
      }
      loadProgressData();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('mindcare-data-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mindcare-data-updated', handleStorageChange);
    };
  }, []);

  const loadProgressData = () => {
    // Load mood data from mood tracker entries
    const moodEntries = JSON.parse(localStorage.getItem('mindcare_mood_entries') || '[]');
    if (moodEntries.length > 0) {
      const last7Days = moodEntries.slice(-7).map((entry: any) => ({
        date: entry.date,
        mood: entry.moodIntensity || 3,
        sleep: entry.sleepHours || 7,
        anxiety: 10 - (entry.stressLevel === 'Low' ? 8 : entry.stressLevel === 'Medium' ? 5 : 2),
        energy: entry.energyLevel === 'High' ? 8 : entry.energyLevel === 'Medium' ? 5 : 2
      }));
      setMoodData(last7Days);

      // Calculate mood distribution
      const moodCounts = { excellent: 0, good: 0, neutral: 0, sad: 0, verySad: 0 };
      moodEntries.forEach((entry: any) => {
        const mood = entry.moodIntensity || 3;
        if (mood >= 9) moodCounts.excellent++;
        else if (mood >= 7) moodCounts.good++;
        else if (mood >= 5) moodCounts.neutral++;
        else if (mood >= 3) moodCounts.sad++;
        else moodCounts.verySad++;
      });

      const total = moodEntries.length;
      if (total > 0) {
        setMoodDistribution([
          { name: 'Excellent', value: Math.round((moodCounts.excellent / total) * 100), color: '#10B981' },
          { name: 'Good', value: Math.round((moodCounts.good / total) * 100), color: '#3B82F6' },
          { name: 'Neutral', value: Math.round((moodCounts.neutral / total) * 100), color: '#F59E0B' },
          { name: 'Sad', value: Math.round((moodCounts.sad / total) * 100), color: '#EF4444' },
          { name: 'Very Sad', value: Math.round((moodCounts.verySad / total) * 100), color: '#DC2626' }
        ]);
      }
    } else {
      // Default data if no entries
      setMoodData([
        { date: new Date().toISOString().split('T')[0], mood: 3, sleep: 7, anxiety: 4, energy: 6 }
      ]);
      setMoodDistribution([
        { name: 'Excellent', value: 20, color: '#10B981' },
        { name: 'Good', value: 30, color: '#3B82F6' },
        { name: 'Neutral', value: 30, color: '#F59E0B' },
        { name: 'Sad', value: 15, color: '#EF4444' },
        { name: 'Very Sad', value: 5, color: '#DC2626' }
      ]);
    }

    // Load therapy progress
    const progress = JSON.parse(localStorage.getItem('mindcare_user_progress') || '{}');
    const completedTherapies = progress.completedTherapies || [];
    
    const therapyModules = [
      { id: 'cbt', name: 'CBT Journaling', total: 12 },
      { id: 'mindfulness', name: 'Mindfulness', total: 15 },
      { id: 'sleep', name: 'Sleep Therapy', total: 10 },
      { id: 'stress', name: 'Stress Management', total: 8 },
      { id: 'gratitude', name: 'Gratitude Journal', total: 21 },
      { id: 'addiction', name: 'Addiction Support', total: 16 },
      { id: 'music', name: 'Relaxation Music', total: 20 },
      { id: 'tetris', name: 'Tetris Therapy', total: 12 },
      { id: 'art', name: 'Art Therapy', total: 10 },
      { id: 'exposure', name: 'Exposure Therapy', total: 12 },
      { id: 'video', name: 'Video Therapy', total: 16 },
      { id: 'act', name: 'ACT', total: 14 }
    ];

    const therapyProgressData = therapyModules.map(module => {
      const completed = completedTherapies.filter((id: string) => id === module.id).length;
      return {
        module: module.name,
        completed: Math.min(completed, module.total),
        total: module.total,
        progress: Math.round((Math.min(completed, module.total) / module.total) * 100)
      };
    });
    setTherapyProgress(therapyProgressData);

    // Generate weekly stats based on recent activity
    const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const weeklyData = weekDays.map((day, index) => {
      const sessions = Math.floor(Math.random() * 3) + 1; // Simulate sessions
      const mood = 3 + Math.floor(Math.random() * 3); // Random mood 3-5
      const sleep = 6 + Math.floor(Math.random() * 4); // Random sleep 6-9
      return { name: day, sessions, mood, sleep };
    });
    setWeeklyStats(weeklyData);
  };

  const calculateTherapyProgress = () => {
    if (!userProgress?.currentPlan) return { completed: 0, total: 0, percentage: 0 };
    const total = userProgress.currentPlan.recommendations?.length || 0;
    const completed = userProgress.completedTherapies?.length || 0;
    return { completed, total, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  };

  const getMoodIcon = (mood: number) => {
    if (mood >= 4.5) return Smile;
    if (mood >= 3.5) return Meh;
    return Frown;
  };

  const getMoodColor = (mood: number) => {
    if (mood >= 4.5) return 'text-green-500';
    if (mood >= 3.5) return 'text-yellow-500';
    return 'text-red-500';
  };

  const currentMood = moodData[moodData.length - 1]?.mood || 3;
  const MoodIcon = getMoodIcon(currentMood);

  return (
    <div className={`h-screen flex flex-col ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50'
    }`}>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Progress Tracking
          </h1>
          <p className={`text-base ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Monitor your mental health journey and celebrate your achievements
          </p>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-4 p-4 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className={`w-4 h-4 ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-white' : 'text-gray-700'
                }`}>
                  Timeframe:
                </span>
              </div>
              <div className="flex space-x-2">
                {timeframes.map((timeframe) => (
                  <button
                    key={timeframe.value}
                    onClick={() => setSelectedTimeframe(timeframe.value)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 ${
                      selectedTimeframe === timeframe.value
                        ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                        : theme === 'dark'
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {timeframe.label}
                  </button>
                ))}
              </div>
            </div>
            <button className="flex items-center space-x-2 px-3 py-1 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 text-sm">
              <Download className="w-3 h-3" />
              <span>Export Data</span>
            </button>
          </div>
        </motion.div>

        {/* AI-Generated Therapy Plan Progress */}
        {userProgress?.currentPlan && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`mb-4 p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 flex items-center ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              <Target className="w-5 h-5 mr-2 text-purple-500" />
              Your Personalized {userProgress.currentPlan.issue || 'Therapy'} Plan
            </h3>
            
            <div className="grid md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <p className={`text-2xl font-bold text-purple-500`}>
                  {(() => {
                    const startDate = new Date(userProgress.startDate || Date.now());
                    const currentDate = new Date();
                    return Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                  })()}
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Current Day
                </p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold text-blue-500`}>
                  {userProgress.currentPlan.planDuration}
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Total Days
                </p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold text-green-500`}>
                  {calculateTherapyProgress().completed}/{calculateTherapyProgress().total}
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Therapies Done
                </p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold text-teal-500`}>
                  {calculateTherapyProgress().percentage}%
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  Complete
                </p>
              </div>
            </div>

            <div className={`w-full h-3 rounded-full mb-4 ${
              theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
            }`}>
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                style={{ width: `${calculateTherapyProgress().percentage}%` }}
              />
            </div>

            <div className="space-y-2">
              <h4 className={`font-semibold ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Recommended Therapies:
              </h4>
              <div className="grid md:grid-cols-2 gap-2">
                {userProgress.currentPlan.recommendations?.map((rec: any) => {
                  const isCompleted = userProgress.completedTherapies?.includes(rec.moduleId);
                  return (
                    <div
                      key={rec.moduleId}
                      className={`flex items-center space-x-2 p-2 rounded-lg ${
                        isCompleted
                          ? 'bg-green-100 dark:bg-green-900/50 border border-green-300 dark:border-green-700'
                          : theme === 'dark'
                          ? 'bg-gray-700/50 border border-gray-600'
                          : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-r ${rec.color} flex items-center justify-center`}>
                        <Target className="w-3 h-3 text-white" />
                      </div>
                      <span className={`text-sm font-medium flex-1 ${
                        theme === 'dark' ? 'text-white' : 'text-gray-800'
                      }`}>
                        {rec.title}
                      </span>
                      {isCompleted && (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Key Metrics */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[
            { title: 'Current Mood', value: currentMood, max: 5, icon: MoodIcon, color: getMoodColor(currentMood) },
            { title: 'Sleep Quality', value: 7.5, max: 10, icon: Moon, color: 'text-blue-500' },
            { title: 'Therapy Sessions', value: 12, max: null, icon: Target, color: 'text-purple-500' },
            { title: 'Streak Days', value: 7, max: null, icon: Award, color: 'text-green-500' }
          ].map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className={`p-4 rounded-xl shadow-lg ${
                theme === 'dark' ? 'bg-gray-800' : 'bg-white'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className={`text-sm font-medium ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {metric.title}
                  </h3>
                  <p className={`text-xl font-bold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {metric.value}{metric.max && `/${metric.max}`}
                  </p>
                </div>
                <metric.icon className={`w-6 h-6 ${metric.color}`} />
              </div>
              {metric.max && (
                <div className={`w-full h-2 rounded-full ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div
                    className={`h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500`}
                    style={{ width: `${(metric.value / metric.max) * 100}%` }}
                  />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {/* Mood Trend Chart */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Mood Trends
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="date" 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                  domain={[1, 5]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="mood" 
                  stroke="#8B5CF6" 
                  strokeWidth={2}
                  dot={{ fill: '#8B5CF6', strokeWidth: 1, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8B5CF6', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Sleep Quality Chart */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Sleep Quality
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={moodData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="date" 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                  domain={[0, 10]}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sleep" 
                  stroke="#3B82F6" 
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Weekly Activity & Mood Distribution */}
        <div className="grid lg:grid-cols-2 gap-4 mb-4">
          {/* Weekly Activity */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Weekly Activity
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="name" 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000'
                  }}
                />
                <Bar dataKey="sessions" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Mood Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <h3 className={`text-lg font-semibold mb-4 ${
              theme === 'dark' ? 'text-white' : 'text-gray-800'
            }`}>
              Mood Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={moodDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {moodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    color: theme === 'dark' ? '#FFFFFF' : '#000000'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        {/* Therapy Progress */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className={`mb-4 p-4 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Therapy Module Progress
          </h3>
          <div className="space-y-3">
            {therapyProgress.map((module, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-medium ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {module.module}
                  </h4>
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {module.completed}/{module.total} sessions
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${
                  theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                }`}>
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500"
                    style={{ width: `${module.progress}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {module.progress}% complete
                  </span>
                  {module.progress === 100 && (
                    <div className="flex items-center space-x-1 text-green-500">
                      <Award className="w-4 h-4" />
                      <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          className={`p-4 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Achievements & Milestones
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {achievements.map((achievement, index) => (
              <div
                key={index}
                className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                  achievement.earned
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700/50'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    achievement.earned
                      ? 'bg-green-100 dark:bg-green-800'
                      : 'bg-gray-100 dark:bg-gray-600'
                  }`}>
                    <Award className={`w-5 h-5 ${
                      achievement.earned
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-500 dark:text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {achievement.title}
                    </h4>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {achievement.description}
                    </p>
                    {achievement.earned ? (
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        Earned on {achievement.date}
                      </p>
                    ) : (
                      <div className="mt-2">
                        <div className={`w-full h-2 rounded-full ${
                          theme === 'dark' ? 'bg-gray-600' : 'bg-gray-200'
                        }`}>
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-blue-500"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                        <p className={`text-xs mt-1 ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          {achievement.progress}% complete
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ProgressPage;