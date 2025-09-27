import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, Video, Star, MapPin, CheckCircle,
  User, Phone, Mail, Award, Filter, Search, X,
  CreditCard, Shield, Heart, ArrowLeft, ArrowRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { trackPayment, trackSessionStart } from '../utils/analyticsManager';

interface Therapist {
  id: string;
  name: string;
  title: string;
  specialization: string[];
  experience: number;
  rating: number;
  reviewCount: number;
  hourlyRate: number;
  location: string;
  avatar: string;
  verified: boolean;
  nextAvailable: string;
  bio: string;
  languages: string[];
}

interface BookingData {
  therapist: Therapist;
  date: string;
  time: string;
  sessionType: 'video' | 'phone' | 'in-person';
  duration: number;
  amount: string;
}

function BookingPage() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [sessionType, setSessionType] = useState<'video' | 'phone' | 'in-person'>('video');
  const [currentStep, setCurrentStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialization, setFilterSpecialization] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [pendingBookingData, setPendingBookingData] = useState<BookingData | null>(null);

  const defaultTherapists: Therapist[] = [
    {
      id: '2',
      name: 'Dr. Sarah Smith',
      title: 'Licensed Clinical Psychologist',
      specialization: ['Cognitive Behavioral Therapy', 'Sleep Disorders', 'OCD'],
      experience: 8,
      rating: 4.8,
      reviewCount: 127,
      hourlyRate: 120,
      location: 'Online',
      avatar: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=150',
      verified: true,
      nextAvailable: 'Today, 2:00 PM',
      bio: 'Experienced therapist specializing in CBT with a passion for helping patients overcome anxiety and depression.',
      languages: ['English', 'Spanish']
    }
  ];

  useEffect(() => {
    // Load therapists from localStorage
    const savedTherapists = localStorage.getItem('mindcare_therapists');
    if (savedTherapists) {
      const parsed = JSON.parse(savedTherapists);
      setTherapists(parsed);
    } else {
      setTherapists(defaultTherapists);
      localStorage.setItem('mindcare_therapists', JSON.stringify(defaultTherapists));
    }
  }, []);

  const availableTimeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  const specializations = [
    'All Specializations',
    'Anxiety Disorders',
    'Depression',
    'PTSD',
    'Cognitive Behavioral Therapy',
    'Family Therapy',
    'Addiction Recovery',
    'Sleep Disorders',
    'OCD'
  ];

  const filteredTherapists = therapists.filter(therapist => {
    const matchesSearch = therapist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         therapist.specialization.some(spec => 
                           spec.toLowerCase().includes(searchTerm.toLowerCase())
                         );
    const matchesSpecialization = !filterSpecialization || 
                                 filterSpecialization === 'All Specializations' ||
                                 therapist.specialization.includes(filterSpecialization);
    return matchesSearch && matchesSpecialization;
  });

  const handleTherapistSelect = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setCurrentStep(2);
  };

  const handleDateTimeSelect = () => {
    if (!selectedDate || !selectedTime) {
      toast.error('Please select both date and time');
      return;
    }
    setCurrentStep(3);
  };

  const handleProceedToPayment = () => {
    if (!selectedTherapist || !selectedDate || !selectedTime) {
      toast.error('Please complete all booking details');
      return;
    }

    // Store booking data temporarily for payment
    const bookingData: BookingData = {
      therapist: selectedTherapist,
      date: selectedDate,
      time: selectedTime,
      sessionType,
      duration: 60,
      amount: `$${selectedTherapist.hourlyRate}`
    };

    setPendingBookingData(bookingData);
    setShowPaymentModal(true);
  };

  const handlePayment = () => {
    if (!pendingBookingData || !user) {
      toast.error('Booking data not found');
      return;
    }

    // Create the booking only after payment is confirmed
    const newBooking = {
      id: Date.now().toString(),
      patientId: user.id,
      patientName: user.name,
      patientEmail: user.email,
      therapistId: pendingBookingData.therapist.id,
      therapistName: pendingBookingData.therapist.name,
      date: pendingBookingData.date,
      time: pendingBookingData.time,
      duration: pendingBookingData.duration,
      sessionType: pendingBookingData.sessionType,
      amount: pendingBookingData.amount,
      status: 'confirmed', // Directly set to confirmed after payment
      createdAt: new Date().toISOString(),
      notes: `${pendingBookingData.sessionType} session with ${pendingBookingData.therapist.name}`
    };

    // Save to localStorage
    const existingBookings = JSON.parse(localStorage.getItem('mindcare_bookings') || '[]');
    const updatedBookings = [...existingBookings, newBooking];
    localStorage.setItem('mindcare_bookings', JSON.stringify(updatedBookings));

    // Track payment and session start
    trackPayment({
      patientId: user.id,
      therapistId: pendingBookingData.therapist.id,
      amount: pendingBookingData.amount,
      sessionType: pendingBookingData.sessionType
    });

    trackSessionStart({
      patientId: user.id,
      therapistId: pendingBookingData.therapist.id,
      sessionType: pendingBookingData.sessionType,
      duration: pendingBookingData.duration
    });

    // Dispatch custom event for real-time updates
    window.dispatchEvent(new CustomEvent('mindcare-data-updated'));

    toast.success(`Session booked with ${pendingBookingData.therapist.name} for ${pendingBookingData.date} at ${pendingBookingData.time}!`);
    
    // Reset form and close modals
    setShowPaymentModal(false);
    setShowBookingModal(false);
    setPendingBookingData(null);
    setSelectedTherapist(null);
    setSelectedDate('');
    setSelectedTime('');
    setCurrentStep(1);
  };

  const handleCancelPayment = () => {
    setShowPaymentModal(false);
    setPendingBookingData(null);
    // Don't reset the booking form, just close payment modal
  };

  const resetBooking = () => {
    setSelectedTherapist(null);
    setSelectedDate('');
    setSelectedTime('');
    setCurrentStep(1);
    setShowBookingModal(false);
    setPendingBookingData(null);
  };

  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

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
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-2xl font-bold mb-2 ${
                theme === 'dark' ? 'text-white' : 'text-gray-800'
              }`}>
                Video Therapy Sessions
              </h1>
              <p className={`text-base ${
                theme === 'dark' ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Connect with licensed therapists through secure, encrypted video calls
              </p>
            </div>
          </div>
        </motion.div>

        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-4 p-1 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="flex space-x-1">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowBookingModal(true)}
              className="flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-all duration-200 bg-gradient-to-r from-purple-500 to-blue-500 text-white"
            >
              <Calendar className="w-4 h-4" />
              <span>Book Session</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 rounded-lg font-medium transition-all duration-200 ${
                theme === 'dark'
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>My Appointments</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Search and Filter */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`mb-4 p-4 rounded-xl shadow-lg ${
            theme === 'dark' ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search therapists by name or specialization..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>
            <div className="flex items-center space-x-4">
              <Filter className={`w-4 h-4 ${
                theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <select
                value={filterSpecialization}
                onChange={(e) => setFilterSpecialization(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${
                  theme === 'dark'
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              >
                {specializations.map(spec => (
                  <option key={spec} value={spec === 'All Specializations' ? '' : spec}>
                    {spec}
                  </option>
                ))}
              </select>
              <button className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300">
                <Filter className="w-4 h-4" />
                <span>Filter & Sort</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Available Therapists */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-4"
        >
          <h2 className={`text-xl font-semibold mb-4 ${
            theme === 'dark' ? 'text-white' : 'text-gray-800'
          }`}>
            Available Therapists
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTherapists.map((therapist, index) => (
              <motion.div
                key={therapist.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                whileHover={{ y: -5, scale: 1.02 }}
                className={`p-4 rounded-xl shadow-lg cursor-pointer transition-all duration-300 ${
                  theme === 'dark' ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:shadow-xl'
                }`}
                onClick={() => handleTherapistSelect(therapist)}
              >
                <div className="flex items-start space-x-4 mb-4">
                  <div className="relative">
                    <img
                      src={therapist.avatar}
                      alt={therapist.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                    {therapist.verified && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      {therapist.name}
                    </h3>
                    <p className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {therapist.title}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                        <span className={`text-sm font-medium ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                          {therapist.rating}
                        </span>
                        <span className={`text-sm ${
                          theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          ({therapist.reviewCount})
                        </span>
                      </div>
                      <span className={`text-sm ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                        • {therapist.experience} years exp
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex flex-wrap gap-1">
                    {therapist.specialization.slice(0, 3).map((spec, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          theme === 'dark' ? 'bg-purple-900/50 text-purple-300' : 'bg-purple-100 text-purple-700'
                        }`}
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <MapPin className={`w-4 h-4 ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <span className={`text-sm ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {therapist.location}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold text-green-600`}>
                      ${therapist.hourlyRate}/hour
                    </p>
                    <p className={`text-xs ${
                      theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {therapist.nextAvailable}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 py-2 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-lg hover:from-purple-600 hover:to-blue-600 transition-all duration-300 font-medium">
                    Book Session
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Booking Modal */}
        <AnimatePresence>
          {showBookingModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowBookingModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`max-w-2xl w-full rounded-2xl shadow-2xl ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <h2 className={`text-2xl font-bold ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      Book Session
                    </h2>
                    <button
                      onClick={() => setShowBookingModal(false)}
                      className={`p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                      }`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Progress Steps */}
                  <div className="flex items-center justify-center space-x-4 mb-8">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                          currentStep >= step
                            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                            : theme === 'dark'
                            ? 'bg-gray-700 text-gray-400'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {currentStep > step ? <CheckCircle className="w-4 h-4" /> : step}
                        </div>
                        {step < 3 && (
                          <div className={`w-8 h-1 mx-2 ${
                            currentStep > step
                              ? 'bg-gradient-to-r from-purple-500 to-blue-500'
                              : theme === 'dark'
                              ? 'bg-gray-700'
                              : 'bg-gray-200'
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Step Content */}
                  <AnimatePresence mode="wait">
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                      >
                        <h3 className={`text-xl font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                          Select Therapist
                        </h3>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {filteredTherapists.map((therapist) => (
                            <motion.div
                              key={therapist.id}
                              whileHover={{ scale: 1.01 }}
                              onClick={() => handleTherapistSelect(therapist)}
                              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                                selectedTherapist?.id === therapist.id
                                  ? 'bg-purple-100 dark:bg-purple-900/50 border border-purple-300 dark:border-purple-700'
                                  : theme === 'dark'
                                  ? 'bg-gray-700/50 hover:bg-gray-700'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <img
                                  src={therapist.avatar}
                                  alt={therapist.name}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                                <div className="flex-1">
                                  <h4 className={`font-semibold ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                                  }`}>
                                    {therapist.name}
                                  </h4>
                                  <p className={`text-sm ${
                                    theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                                  }`}>
                                    {therapist.specialization[0]} • ${therapist.hourlyRate}/hour
                                  </p>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <Star className="w-4 h-4 text-yellow-400 fill-current" />
                                  <span className={`text-sm ${
                                    theme === 'dark' ? 'text-white' : 'text-gray-800'
                                  }`}>
                                    {therapist.rating}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 2 && selectedTherapist && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                      >
                        <div className="flex items-center space-x-3 mb-4">
                          <img
                            src={selectedTherapist.avatar}
                            alt={selectedTherapist.name}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                          <div>
                            <h3 className={`text-xl font-semibold ${
                              theme === 'dark' ? 'text-white' : 'text-gray-800'
                            }`}>
                              {selectedTherapist.name}
                            </h3>
                            <p className={`text-sm ${
                              theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                              Select Date & Time
                            </p>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Preferred Date
                            </label>
                            <input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              min={getMinDate()}
                              max={getMaxDate()}
                              className={`w-full px-4 py-3 rounded-xl border ${
                                theme === 'dark'
                                  ? 'bg-gray-700 border-gray-600 text-white'
                                  : 'bg-white border-gray-300 text-gray-900'
                              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                            />
                          </div>

                          <div>
                            <label className={`block text-sm font-medium mb-2 ${
                              theme === 'dark' ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Available Time Slots
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {availableTimeSlots.map((time) => (
                                <motion.button
                                  key={time}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => setSelectedTime(time)}
                                  className={`py-2 px-3 rounded-lg font-medium transition-all duration-200 ${
                                    selectedTime === time
                                      ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                      : theme === 'dark'
                                      ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                  }`}
                                >
                                  {time}
                                </motion.button>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentStep(1)}
                            className={`flex-1 py-3 rounded-xl font-medium ${
                              theme === 'dark'
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Back
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleDateTimeSelect}
                            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                          >
                            Continue
                          </motion.button>
                        </div>
                      </motion.div>
                    )}

                    {currentStep === 3 && selectedTherapist && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 30 }}
                      >
                        <h3 className={`text-xl font-semibold mb-4 ${
                          theme === 'dark' ? 'text-white' : 'text-gray-800'
                        }`}>
                          Session Details
                        </h3>

                        <div className={`p-4 rounded-xl mb-4 ${
                          theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <h4 className={`font-semibold mb-3 ${
                            theme === 'dark' ? 'text-white' : 'text-gray-800'
                          }`}>
                            Booking Summary
                          </h4>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                Therapist:
                              </span>
                              <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                                {selectedTherapist.name}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                Date & Time:
                              </span>
                              <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                                {selectedDate} at {selectedTime}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                Duration:
                              </span>
                              <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                                60 minutes
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                Session Fee:
                              </span>
                              <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                                ${selectedTherapist.hourlyRate}
                              </span>
                            </div>
                            <div className="border-t border-gray-300 dark:border-gray-600 pt-2">
                              <div className="flex justify-between font-semibold">
                                <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                                  Total:
                                </span>
                                <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                                  ${selectedTherapist.hourlyRate}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => setCurrentStep(2)}
                            className={`flex-1 py-3 rounded-xl font-medium ${
                              theme === 'dark'
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                          >
                            Back
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleProceedToPayment}
                            className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white rounded-xl font-medium hover:from-purple-600 hover:to-blue-600 transition-all duration-300"
                          >
                            Proceed to Payment
                          </motion.button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && pendingBookingData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
              onClick={handleCancelPayment}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`max-w-md w-full rounded-2xl shadow-2xl ${
                  theme === 'dark' ? 'bg-gray-800' : 'bg-white'
                }`}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CreditCard className="w-8 h-8 text-white" />
                    </div>
                    <h3 className={`text-2xl font-bold mb-2 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      Payment
                    </h3>
                  </div>

                  <div className={`p-4 rounded-xl mb-6 ${
                    theme === 'dark' ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <h4 className={`font-semibold mb-3 ${
                      theme === 'dark' ? 'text-white' : 'text-gray-800'
                    }`}>
                      Session with {pendingBookingData.therapist.name}
                    </h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Date & Time:
                        </span>
                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-800'}>
                          {pendingBookingData.date} at {pendingBookingData.time}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                          Amount:
                        </span>
                        <span className="text-green-600 font-semibold">
                          {pendingBookingData.amount}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleCancelPayment}
                      className={`flex-1 py-3 rounded-xl font-medium ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePayment}
                      className="flex-1 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-xl font-medium hover:from-green-600 hover:to-teal-600 transition-all duration-300 flex items-center justify-center space-x-2"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Pay {pendingBookingData.amount}</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default BookingPage;