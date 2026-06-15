import React, { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/HomeScreen';
import LoginScreen from '../screens/LoginScreen';
import StudentDetailScreen from '../screens/StudentDetailScreen';
import HomeworkScreen from '../screens/HomeworkScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import TestMarkScreen from '../screens/TestMarkScreen';
import TransportScreen from '../screens/TransportScreen';
import AnnouncementScreen from '../screens/AnnouncementScreen';
import TimetableScreen from '../screens/TimetableScreen';

export default function AppNavigator() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('Home');
  const insets = useSafeAreaInsets();

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  const bottomPad = insets.bottom > 0 ? insets.bottom : 14;

  return (
    <View className="flex-1 bg-school-bg">
      <View className="flex-1">
        {currentScreen === 'Home' && <HomeScreen onNavigate={setCurrentScreen} />}
        {currentScreen === 'StudentDetail' && (
          <StudentDetailScreen onBack={() => setCurrentScreen('Home')} />
        )}
        {currentScreen === 'homework' && <HomeworkScreen onBack={() => setCurrentScreen('Home')} />}
        {currentScreen === 'attendance' && <AttendanceScreen onBack={() => setCurrentScreen('Home')} />}
        {currentScreen === 'test' && <TestMarkScreen onBack={() => setCurrentScreen('Home')} />}
        {currentScreen === 'transport' && <TransportScreen onBack={() => setCurrentScreen('Home')} />}
        {currentScreen === 'announcement' && <AnnouncementScreen onBack={() => setCurrentScreen('Home')} />}
        {currentScreen === 'timetable' && <TimetableScreen onBack={() => setCurrentScreen('Home')} />}
        {currentScreen === 'Chat' && (
          <View className="flex-1 items-center justify-center">
            <Ionicons name="chatbubbles" size={60} color="#6B7280" />
            <Text className="mt-4 text-gray-500">Chat coming soon...</Text>
          </View>
        )}
      </View>

      <View className="flex-row items-start justify-around border-t border-gray-200 bg-white pt-2.5" style={{ paddingBottom: bottomPad }}>
        <TouchableOpacity className="relative flex-1 items-center justify-center pb-2 pt-1" onPress={() => setCurrentScreen('Home')}>
          <Ionicons
            name={currentScreen === 'Home' ? 'home' : 'home-outline'}
            size={24}
            color={currentScreen === 'Home' ? '#4338CA' : '#6B7280'}
          />
          <Text className={`mt-1 text-xs ${currentScreen === 'Home' ? 'font-bold text-brand-500' : 'font-medium text-gray-500'}`}>Home</Text>
          {currentScreen === 'Home' && <View className="absolute -bottom-1 h-[3px] w-5 rounded-sm bg-brand-500" />}
        </TouchableOpacity>

        <TouchableOpacity className="relative flex-1 items-center justify-center pb-2 pt-1" onPress={() => setCurrentScreen('Chat')}>
          <Ionicons
            name={currentScreen === 'Chat' ? 'chatbubbles' : 'chatbubbles-outline'}
            size={24}
            color={currentScreen === 'Chat' ? '#4338CA' : '#6B7280'}
          />
          <Text className={`mt-1 text-xs ${currentScreen === 'Chat' ? 'font-bold text-brand-500' : 'font-medium text-gray-500'}`}>Chat</Text>
          {currentScreen === 'Chat' && <View className="absolute -bottom-1 h-[3px] w-5 rounded-sm bg-brand-500" />}
        </TouchableOpacity>

        <TouchableOpacity className="relative flex-1 items-center justify-center pb-2 pt-1" onPress={() => setCurrentScreen('StudentDetail')}>
          <Ionicons
            name={currentScreen === 'StudentDetail' ? 'person' : 'person-outline'}
            size={24}
            color={currentScreen === 'StudentDetail' ? '#4338CA' : '#6B7280'}
          />
          <Text className={`mt-1 text-xs ${currentScreen === 'StudentDetail' ? 'font-bold text-brand-500' : 'font-medium text-gray-500'}`}>Profile</Text>
          {currentScreen === 'StudentDetail' && <View className="absolute -bottom-1 h-[3px] w-5 rounded-sm bg-brand-500" />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
