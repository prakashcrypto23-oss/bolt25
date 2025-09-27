import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { 
  MessageCircle, Brain, Video, BarChart3, Heart, 
  Calendar, Clock, Smile, Frown, Meh, Target,
  Book, Music, Palette, Camera
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { getStreakData } from '../utils/streakManager';

function PatientDashboard() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [currentMood, setCurrentMood] = useState<number>(3);
  const [streak, setStreak] = useState(0);
  const [modulesCompleted, setModulesCompleted] = useState(0);
  const [upcomingAppointments, setUpcomingAppointments] = useState<any[]>([]);
  const [nextAppointment, setNextAppointment] = useState<any>(null);

  useEffect(() => {
    // Load streak data
    const streakData = getStreakData();
    setStreak(streakData.currentStreak);

    // Load current mood
    const savedMood = localStorage.getItem('mindcare_current_mood');
    if (savedMood) {
      setCurrentMood(parseInt(savedMood));
    }

    // Load modules completed count
    const userProgress = localStorage.getItem('mindcare_user_progress');
    if (userProgress) {
      const progress = JSON.parse(userProgress);
      const completedCount = progress.completedTherapies?.length || 0;
      setModulesCompleted(completedCount);
    }
    
    // Load upcoming appointments
    const savedAppointments = localStorage.getItem('mindcare_appointments');
    if (savedAppointments) {
      const appointments = JSON.parse(savedAppointments);
      const upcoming = appointments.filter((apt: any) => 
        apt.patientId === user?.id && 
        apt.status === 'confirmed' &&
        new Date(apt.date + ' ' + apt.time) > new Date()
      );
      setUpcomingAppointments(upcoming);
      
      // Set next appointment
      if (upcoming.length > 0) {
        const sortedUpcoming = upcoming.sort((a: any, b: any) => 
          new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
        );
        setNextAppointment(sortedUpcoming[0]);
      } else {
        setNextAppointment(null);
      }
    }
  }, [user]);

  // Listen for storage changes to update data in real-time
  useEffect(() => {
    const handleStorageChange = () => {
      // Update streak
      const streakData = getStreakData();
      setStreak(streakData.currentStreak);

      // Update mood
      const savedMood = localStorage.getItem('mindcare_current_mood');
      if (savedMood) {
        setCurrentMood(parseInt(savedMood));
      }

      // Update modules completed
      const userProgress = localStorage.getItem('mindcare_user_progress');
      if (userProgress) {
        const progress = JSON.parse(userProgress);
        const completedCount = progress.completedTherapies?.length || 0;
        setModulesCompleted(completedCount);
      }

      // Update appointments
      const savedAppointments = localStorage.getItem('mindcare_bookings');
      if (savedAppointments) {
        const appointments = JSON.parse(savedAppointments);
        const upcoming = appointments.filter((apt: any) => 
          apt.patientId === user?.id && 
          apt.status === 'confirmed' &&
          new Date(apt.date + ' ' + apt.time) > new Date()
        );
        setUpcomingAppointments(upcoming);
        
        if (upcoming.length > 0) {
          const sortedUpcoming = upcoming.sort((a: any, b: any) => 
            new Date(a.date + ' ' + a.time).getTime() - new Date(b.date + ' ' + b.time).getTime()
          );
          setNextAppointment(sortedUpcoming[0]);
        } else {
          setNextAppointment(null);
        }
      }
    };

    // Listen for storage events
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events for same-tab updates
    window.addEventListener('mindcare-data-updated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('mindcare-data-updated', handleStorageChange);
    };
  }, [user]);

  const quickActions = [
    {
      icon: MessageCircle,
      title: 'AI Assistant',
      description: 'Chat with our intelligent mental health bot',
      link: '/chatbot',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Brain,
      title: 'Therapy Modules',
      description: 'Access 12 evidence-based therapy programs',
      link: '/therapy-modules',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Video,
      title: 'Book Session',
      description: 'Schedule a video call with licensed therapists',
      link: '/booking',
      color: 'from-teal-500 to-green-500'
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Monitor your mental health journey',
      link: '/progress',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const recentActivities = [
    { module: 'Mindfulness Meditation', time: '2 hours ago', duration: '15 min' },
    { module: 'CBT Journaling', time: '1 day ago', duration: '20 min' },
    { module: 'Gratitude Practice', time: '2 days ago', duration: '10 min' },
    { module: 'Sleep Therapy', time: '3 days ago', duration: '30 min' }
  ];

  const moodOptions = [
    { value: 1, icon: Frown, label: 'Very Sad', color: 'text-red-500' },
    { value: 2, icon: Frown, label: 'Sad', color: 'text-orange-500' },
    { value: 3, icon: Meh, label: 'Neutral', color: 'text-yellow-500' },
    { value: 4, icon: Smile, label: 'Good', color: 'text-green-500' },
    { value: 5, icon: Smile, label: 'Excellent', color: 'text-blue-500' }
  ];

  const handleMoodUpdate = (mood: number) => {
    setCurrentMood(mood);
    // Save to localStorage
    localStorage.setItem('mindcare_current_mood', mood.toString());
    
    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('mindcare-data-updated'));
  };

  return (
    <div className={`h-screen flex flex-col ${
      theme === 'dark' ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 via-blue-50 to-teal-50'
    }`}>
      <div className="flex-1 overflow-y-auto p-4">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4"
        >
          <h1 className={`text-2xl font-bold mb-2 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Welcome back, {user?.name}!
          </h1>
          <p className={`text-base ${
            theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
          }`}>
            Continue your mental wellness journey today
          </p>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className={`text-base font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Current Streak
                </h3>
                <p className={`text-2xl font-bold text-purple-500`}>
                  {streak} days
                </p>
              </div>
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Target className="w-5 h-5 text-purple-600" />
              </div>
            </div>
            <p className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              Keep up the great work!
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className={`text-base font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Modules Completed
                </h3>
                <p className={`text-2xl font-bold text-blue-500`}>
                  {modulesCompleted}
                </p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Book className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {modulesCompleted > 0 ? `+${Math.min(modulesCompleted, 3)} this week` : 'Start your first therapy'}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className={`p-4 rounded-xl shadow-lg ${
              theme === 'dark' ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className={`text-base font-semibold ${
                  theme === 'dark' ? 'text-white' : 'text-gray-800'
                }`}>
                  Next Appointment
                </h3>
                <p className={`text-base font-bold ${
                  nextAppointment ? 'text-teal-500' : 'text-gray-500'
                }`}>
                  {nextAppointment ? 'Scheduled' : 'None'}
                </p>
              </div>
              <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-teal-600" />
              </div>
            </div>
            <p className={`text-xs ${
              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {nextAppointment 
                ? `${nextAppointment.date} at ${nextAppointment.time}`
                : 'Book your first session'
              }
            </p>
          </motion.div>
        </div>

        {/* Mood Check-in */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`mb-6 p-4 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-3 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            How are you feeling today?
          </h3>
          <div className="flex justify-between items-center">
            {moodOptions.map((option) => (
              <motion.button
                key={option.value}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleMoodUpdate(option.value)}
                className={`flex flex-col items-center p-2 rounded-lg transition-all duration-200 ${
                  currentMood === option.value
                    ? 'bg-purple-100 dark:bg-purple-900/50'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <option.icon className={`w-6 h-6 mb-1 ${option.color}`} />
                <span className={`text-sm font-medium ${
                  theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  {option.label}
                </span>
              </motion.button>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-6"
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Quick Actions
          </h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link key={index} to={action.link}>
                <motion.div
                  whileHover={{ y: -5, scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`p-4 rounded-xl shadow-lg transition-all duration-300 cursor-pointer ${
                    theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:shadow-xl'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center mb-3`}>
                    <action.icon className="w-5 h-5 text-white" />
                  </div>
                  <h4 className={`text-base font-semibold mb-2 ${
                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                  }`}>
                    {action.title}
                  </h4>
                  <p className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {action.description}
                  </p>
                </motion.div>
              </Link>
            ))}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className={`p-4 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <h3 className={`text-lg font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivities.map((activity, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 + index * 0.1 }}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <Heart className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className={`font-medium ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {activity.module}
                    </p>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {activity.time}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className={`w-3 h-3 ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <span className={`text-sm ${
                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {activity.duration}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default PatientDashboard;