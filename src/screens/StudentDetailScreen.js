import React from 'react';
import { SafeAreaView, ScrollView, Text, View, TouchableOpacity, Image, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function StudentDetailScreen({ onBack }) {
  const student = {
    name: 'Rahul Dominic',
    std: '10th Standard',
    dob: '12 May 2008',
    bloodGroup: 'O+',
    fatherName: 'Mr. Dominic',
    motherName: 'Mrs. Priya Dominic',
    address: '123 MG Road, Sathy 638401',
    contactName: 'Mr. Dominic',
    contactNumber: '+91 987456123',
    classTeacher: 'Mrs. Lakshmi',
    teacherPhone: '+91 123456789',
    principalEmail: 'principal@abcmatric.edu',
    officeNumber: '080-1234567',
    admissionId: 'ADM-2023-0142',
  };

  const InfoRow = ({ label, value, icon, actionUrl }) => (
    <TouchableOpacity 
      className="mb-4 flex-row items-center"
      disabled={!actionUrl}
      onPress={() => actionUrl && Linking.openURL(actionUrl)}
    >
      <View className="mr-3 h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50">
        <Ionicons name={icon} size={20} color="#4F46E5" />
      </View>
      <View className="flex-1">
        <Text className="mb-0.5 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</Text>
        <Text className={`text-[15px] font-bold ${actionUrl ? 'text-indigo-600' : 'text-slate-800'}`}>{value}</Text>
      </View>
      {actionUrl && <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="flex-row items-center justify-between rounded-b-[30px] bg-app-primary px-6 pb-6 pt-12 shadow-lg shadow-indigo-500/20">
        <TouchableOpacity className="h-10 w-10 items-center justify-center bg-white/20 rounded-full" onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text className="text-xl font-black text-white tracking-wide">Student Profile</Text>
        <View className="w-10" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="pb-12" showsVerticalScrollIndicator={false}>

        {/* Profile Hero Card */}
        <View className="mx-6 -mt-1">
          <View className="mt-6 overflow-hidden rounded-[28px] shadow-lg shadow-indigo-300/30">
            <LinearGradient
              colors={['#EEF2FF', '#E0E7FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="items-center py-8 px-6"
            >
              {/* Student Photo */}
              <View className="mb-5 relative">
                <Image
                  source={require('../../assets/pictures/student_pic.png')}
                  className="h-28 w-28 rounded-full border-4 border-white shadow-xl"
                  resizeMode="cover"
                />
                <View className="absolute bottom-0 right-0 h-8 w-8 bg-emerald-500 rounded-full border-2 border-white items-center justify-center shadow-md">
                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                </View>
              </View>

              <Text className="text-2xl font-black text-slate-800 mb-2">{student.name}</Text>
              <View className="flex-row items-center gap-2">
                <View className="bg-indigo-100 border border-indigo-200 px-3 py-1 rounded-full mr-2">
                  <Text className="text-sm font-bold text-indigo-700">{student.std}</Text>
                </View>
                <View className="bg-white border border-slate-200 px-3 py-1 rounded-full">
                  <Text className="text-sm font-bold text-slate-500">{student.admissionId}</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Personal Details */}
        <View className="mx-6 mt-6 mb-5 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200 border border-slate-100">
          <View className="flex-row items-center mb-4">
            <View className="h-7 w-1 bg-indigo-500 rounded-full mr-3" />
            <Text className="text-base font-black text-slate-800">Personal Details</Text>
          </View>
          <InfoRow label="Date of Birth" value={student.dob} icon="calendar-outline" />
          <InfoRow label="Blood Group" value={student.bloodGroup} icon="water-outline" />
          <InfoRow label="Father's Name" value={student.fatherName} icon="man-outline" />
          <InfoRow label="Mother's Name" value={student.motherName} icon="woman-outline" />
          <InfoRow label="Address" value={student.address} icon="location-outline" />
          <InfoRow label={`Contact (${student.contactName})`} value={student.contactNumber} icon="call-outline" actionUrl={`tel:${student.contactNumber}`} />
        </View>

        {/* School Directory */}
        <View className="mx-6 mb-6 rounded-[24px] bg-white p-5 shadow-sm shadow-slate-200 border border-slate-100">
          <View className="flex-row items-center mb-4">
            <View className="h-7 w-1 bg-blue-500 rounded-full mr-3" />
            <Text className="text-base font-black text-slate-800">School Directory</Text>
          </View>
          <InfoRow label="Class Teacher" value={student.classTeacher} icon="school-outline" />
          <InfoRow label="Teacher's Phone" value={student.teacherPhone} icon="call-outline" actionUrl={`tel:${student.teacherPhone}`} />
          <InfoRow label="Principal Email" value={student.principalEmail} icon="mail-outline" actionUrl={`mailto:${student.principalEmail}`} />
          <InfoRow label="Office Number" value={student.officeNumber} icon="business-outline" actionUrl={`tel:${student.officeNumber}`} />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}
