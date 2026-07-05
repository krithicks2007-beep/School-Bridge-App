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
  Alert,
  useWindowDimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';

export default function Login() {
  const [logoError, setLogoError] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { width } = useWindowDimensions();
  
  const [regId, setRegId] = useState('');
  const [password, setPassword] = useState('');
  
  const router = useRouter();
  const { loginUser, loading, error, clearError } = useAuthStore();
  const isWideLayout = width >= 768;
  const logoSize = isWideLayout ? 96 : 90;

  const handleLogin = async () => {
    if (!regId || !password) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    await loginUser(regId.trim(), password.trim());
  };

  return (
    <ImageBackground 
      source={require('../../assets/pictures/login_bg.png')}
      className="flex-1 bg-school-bg"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 items-center justify-center px-5 pb-[150px] pt-10"
        style={{
          paddingBottom: isWideLayout ? 32 : 150,
          paddingTop: isWideLayout ? 28 : 40,
        }}
      >
        <View className="mb-[30px] w-full max-w-[420px] items-center" style={{ marginBottom: isWideLayout ? 24 : 30 }}>
          {!logoError && (
            <Image 
              source={require('../../assets/pictures/school_logo.png')} 
              className="mb-2.5"
              style={{ height: logoSize, width: logoSize }}
              resizeMode="contain"
              onError={() => setLogoError(true)}
            />
          )}

          <Text className="mb-0.5 text-center text-[28px] font-black uppercase tracking-[6px] text-[#1A1B4B]">EINSTEIN</Text>
          <Text className="mb-3 text-center text-sm font-semibold uppercase tracking-[2px] text-[#3B4A72]">Higher Secondary School</Text>

          <View className="mb-3 h-0.5 w-[60px] rounded-sm bg-school-gold" />

          <View className="rounded-full bg-blue-700 px-[18px] py-1.5 shadow-md shadow-blue-700/30">
            <Text className="text-[13px] font-semibold tracking-[1px] text-white">Portal Login</Text>
          </View>
        </View>

        <View className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-md shadow-black/5">
          
          {error && (
            <Text className="mb-4 text-center font-semibold text-red-500">{error}</Text>
          )}

          {/* Reg ID */}
          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-bold text-[#1A1B4B]">Registration ID</Text>
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Ionicons name="card-outline" size={22} color="#4338CA" />
              </View>
              <View className="h-12 flex-1 flex-row items-center rounded-lg border border-gray-200 bg-white">
                <TextInput
                  value={regId}
                  onChangeText={(text) => { setRegId(text); clearError(); }}
                  autoCapitalize="none"
                  className="h-full flex-1 px-3 text-sm text-gray-800"
                  placeholder="Enter Reg ID"
                />
              </View>
            </View>
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text className="mb-1.5 text-sm font-bold text-[#1A1B4B]">Password / PIN</Text>
            <View className="flex-row items-center">
              <View className="mr-3 h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                <Ionicons name="lock-closed-outline" size={22} color="#4338CA" />
              </View>
              <View className="h-12 flex-1 flex-row items-center rounded-lg border border-gray-200 bg-white">
                <TextInput
                  value={password}
                  onChangeText={(text) => { setPassword(text); clearError(); }}
                  secureTextEntry={!showPassword}
                  className="h-full flex-1 px-3 text-sm text-gray-800"
                  placeholder="Enter Password"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} className="px-3">
                  <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Login Button */}
          <TouchableOpacity 
            className="h-12 items-center justify-center rounded-lg bg-brand-500" 
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

        </View>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
