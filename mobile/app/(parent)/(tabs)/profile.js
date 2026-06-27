import React from 'react';
import { ScrollView, Text, View, TouchableOpacity, Linking, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../../src/store/authStore';

export default function ProfileScreen() {
  const { student, logoutUser } = useAuthStore();

  const studentName = student?.name || 'Student';
  const studentGrade = student?.grade || student?.class?.name || '';
  const studentInitial = student?.initial || studentName.charAt(0);
  const photoUrl = student?.photo_url || null;

  const dob = student?.date_of_birth || '—';
  const bloodGroup = student?.blood_group || '—';
  const fatherName = student?.father_name || '—';
  const motherName = student?.mother_name || '—';
  const address = student?.address || '—';
  const contactName = student?.father_name || 'Father';
  const contactNumber = student?.contact_phone || '—';

  const classTeacher = student?.class_teacher || student?.class?.teacher_name || 'Mrs. Lakshmi';
  const teacherPhone = student?.teacher_phone || '+91 123456789';
  const principalEmail = student?.principal_email || 'principal@abcmatric.edu';
  const officeNumber = student?.office_number || '080-1234567';
  const admissionId = student?.admission_number || `ADM-${student?.id?.slice(0,8)?.toUpperCase() || '—'}`;

  const InfoRow = ({ label, value, icon, actionUrl }) => (
    <TouchableOpacity
      className="mb-4 flex-row items-center"
      disabled={!actionUrl || value === '—'}
      onPress={() => actionUrl && value !== '—' && Linking.openURL(actionUrl)}
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
        <Ionicons name={icon} size={20} color="#4F46E5" />
      </View>
      <View className="flex-1">
        <Text className="mb-0.5 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</Text>
        <Text className={`text-[15px] font-bold ${actionUrl && value !== '—' ? 'text-indigo-600' : 'text-slate-800'}`}>{value}</Text>
      </View>
      {actionUrl && value !== '—' && <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between rounded-b-[30px] px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20"
        style={{ backgroundColor: '#4F46E5' }}
      >
        <View className="w-10" />
        <Text className="text-xl font-black text-white tracking-wide">Student Profile</Text>
        <TouchableOpacity
          className="h-10 w-10 items-center justify-center rounded-full bg-white/20"
          onPress={logoutUser}
        >
          <Ionicons name="log-out-outline" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {/* Profile Hero Card */}
        <View className="mx-6 mt-6 overflow-hidden rounded-[28px] shadow-lg shadow-indigo-300/30">
          <LinearGradient
            colors={['#EEF2FF', '#E0E7FF']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="items-center py-8 px-6"
          >
            {/* Student Avatar */}
            <View className="mb-5 relative">
              {photoUrl ? (
                <Image 
                  source={{ uri: photoUrl }}
                  className="h-28 w-28 rounded-full border-4 border-white shadow-xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="h-28 w-28 rounded-full border-4 border-white shadow-xl items-center justify-center" style={{ backgroundColor: '#4F46E5' }}>
                  <Text style={{ fontSize: 48, fontWeight: '900', color: '#FFFFFF' }}>
                    {studentName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View className="absolute bottom-0 right-0 h-8 w-8 bg-emerald-500 rounded-full border-2 border-white items-center justify-center shadow-md">
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
            </View>

            <Text className="text-2xl font-black text-slate-800 mb-2">{studentName}</Text>
            <View className="flex-row items-center">
              <View className="bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-full mr-2">
                <Text className="text-sm font-bold text-indigo-700">{studentGrade}</Text>
              </View>
              <View className="bg-white border border-slate-200 px-3 py-1 rounded-full">
                <Text className="text-sm font-bold text-slate-500">{admissionId}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Personal Details */}
        <View className="mx-6 mt-6 mb-5 rounded-[24px] bg-white p-5 shadow-sm border border-slate-100">
          <View className="flex-row items-center mb-4">
            <View className="h-7 w-1 bg-indigo-500 rounded-full mr-3" />
            <Text className="text-base font-black text-slate-800">Personal Details</Text>
          </View>
          <InfoRow label="Date of Birth" value={dob} icon="calendar-outline" />
          <InfoRow label="Blood Group" value={bloodGroup} icon="water-outline" />
          <InfoRow label="Father's Name" value={fatherName} icon="man-outline" />
          <InfoRow label="Mother's Name" value={motherName} icon="woman-outline" />
          <InfoRow label="Address" value={address} icon="location-outline" />
          <InfoRow label={`Contact (${contactName})`} value={contactNumber} icon="call-outline" actionUrl={contactNumber !== '—' ? `tel:${contactNumber}` : null} />
        </View>

        {/* School Directory */}
        <View className="mx-6 mb-6 rounded-[24px] bg-white p-5 shadow-sm border border-slate-100">
          <View className="flex-row items-center mb-4">
            <View className="h-7 w-1 bg-blue-500 rounded-full mr-3" />
            <Text className="text-base font-black text-slate-800">School Directory</Text>
          </View>
          <InfoRow label="Class Teacher" value={classTeacher} icon="school-outline" />
          <InfoRow label="Teacher's Phone" value={teacherPhone} icon="call-outline" actionUrl={teacherPhone !== '—' ? `tel:${teacherPhone}` : null} />
          <InfoRow label="Principal Email" value={principalEmail} icon="mail-outline" actionUrl={principalEmail !== '—' ? `mailto:${principalEmail}` : null} />
          <InfoRow label="Office Number" value={officeNumber} icon="business-outline" actionUrl={officeNumber !== '—' ? `tel:${officeNumber}` : null} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
