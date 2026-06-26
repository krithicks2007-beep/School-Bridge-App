import React, { useState } from 'react';
import { 
  KeyboardAvoidingView, 
  Platform, 
  Text, 
  TextInput, 
  View, 
  Image, 
  TouchableOpacity, 
  ImageBackground,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function ParentLogin() {
  const [logoError, setLogoError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [name, setName] = useState('');
  const [initial, setInitial] = useState('');
  const [pin, setPin] = useState('');
  
  const router = useRouter();
  const { loginAsParent, loading, error, clearError } = useAuthStore();

  const handleLogin = async () => {
    if (!name || !initial || !pin) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    if (pin.length !== 6) {
      Alert.alert('Error', 'PIN must be 6 digits');
      return;
    }
    await loginAsParent(name.trim(), initial.trim(), pin.trim());
  };

  return (
    <ImageBackground 
      source={require('../../assets/pictures/login_bg.png')}
      className="flex-1 bg-school-bg"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 items-center justify-center px-5 pb-[150px] pt-10"
      >
        <View className="mb-[30px] w-full max-w-[420px] items-center">
          {!logoError && (
            <Image 
              source={require('../../assets/pictures/school_logo.png')} 
              className="mb-2.5 h-[90px] w-[90px]"
              resizeMode="contain"
              onError={() => setLogoError(true)}
            />
          )}

          <Text className="mb-0.5 text-center text-[28px] font-black uppercase tracking-[6px] text-[#1A1B4B]">EINSTEIN</Text>
          <Text className="mb-3 text-center text-sm font-semibold uppercase tracking-[2px] text-[#3B4A72]">Higher Secondary School</Text>

          <View className="mb-3 h-0.5 w-[60px] rounded-sm bg-school-gold" />

          <View className="rounded-full bg-blue-700 px-[18px] py-1.5 shadow-md shadow-blue-700/30">
            <Text className="text-[13px] font-semibold tracking-[1px] text-white">Student & Parent Portal</Text>
          </View>
        </View>

        <View className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-md shadow-black/5">
          
          {error && (
            <Text className="mb-4 text-center font-semibold text-red-500">{error}</Text>
          )}

          {/* Student Full Name */}
          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-bold text-[#1A1B4B]">Student Full Name</Text>
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Ionicons name="person-outline" size={22} color="#4338CA" />
              </View>
              <View className="h-12 flex-1 flex-row items-center rounded-lg border border-gray-200 bg-white">
                <TextInput
                  value={name}
                  onChangeText={(text) => { setName(text); clearError(); }}
                  autoCapitalize="words"
                  placeholder="e.g. John Doe"
                  className="h-full flex-1 px-3 text-sm text-gray-800"
                />
              </View>
            </View>
          </View>

          {/* Initial */}
          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-bold text-[#1A1B4B]">Initial</Text>
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Ionicons name="text-outline" size={22} color="#4338CA" />
              </View>
              <View className="h-12 flex-1 flex-row items-center rounded-lg border border-gray-200 bg-white">
                <TextInput
                  value={initial}
                  onChangeText={(text) => { setInitial(text); clearError(); }}
                  autoCapitalize="characters"
                  maxLength={3}
                  placeholder="e.g. A"
                  className="h-full flex-1 px-3 text-sm text-gray-800"
                />
              </View>
            </View>
          </View>

          {/* 6-Digit PIN */}
          <View className="mb-6">
            <Text className="mb-1.5 text-sm font-bold text-[#1A1B4B]">6-Digit PIN</Text>
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Ionicons name="lock-closed-outline" size={22} color="#4338CA" />
              </View>
              <View className="h-12 flex-1 flex-row items-center rounded-lg border border-gray-200 bg-white">
                <TextInput
                  value={pin}
                  onChangeText={(text) => { setPin(text); clearError(); }}
                  keyboardType="numeric"
                  maxLength={6}
                  secureTextEntry={!showPassword}
                  placeholder="******"
                  className="h-full flex-1 px-3 text-sm text-gray-800"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-3">
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            className="mb-6 h-12 items-center justify-center rounded-lg bg-brand-500" 
            onPress={handleLogin}
            disabled={loading}
            style={{ backgroundColor: '#4338CA' }} // fallback color if tailwind not loaded fully
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-base font-bold text-white">Login</Text>
            )}
          </TouchableOpacity>

          <View className="mb-5 flex-row items-center">
            <View className="h-px flex-1 bg-gray-200" />
            <Text className="px-2.5 text-[13px] text-gray-400">OR</Text>
            <View className="h-px flex-1 bg-gray-200" />
          </View>

          <TouchableOpacity 
            className="flex-row items-center justify-center"
            onPress={() => router.push('/(auth)/staff-login')}
          >
            <Ionicons name="school-outline" size={20} color="#4338CA" />
            <Text className="ml-1.5 text-[13px] text-gray-600">
              <Text className="font-bold text-[#4338CA]">Staff & Teacher Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}