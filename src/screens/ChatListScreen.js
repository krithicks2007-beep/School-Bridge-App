import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../services/chatService';

export default function ChatListScreen({ onOpenChat }) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState([]);

  const loadConversations = useCallback(async () => {
    const data = await chatService.getConversations();
    setConversations(data);
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const handleMarkAllRead = async () => {
    await chatService.markAllAsRead();
    setConversations(prev => prev.map(c => ({ ...c, unreadCount: 0 })));
  };

  const handleOpenChat = async (id) => {
    await chatService.markAsRead(id);
    setConversations(prev =>
      prev.map(c => c.id === id ? { ...c, unreadCount: 0 } : c)
    );
    onOpenChat(id);
  };

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  // ── Empty State ────────────────────────────────────────────────────────────
  if (conversations.length === 0) {
    return (
      <View className="flex-1 bg-slate-50">
        <LinearGradient
          colors={['#3B82F6', '#1D4ED8']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ paddingTop: insets.top || StatusBar.currentHeight || 44 }}
        >
          <View className="px-5 pb-4 pt-3">
            <Text className="text-xl font-black text-white">Messages</Text>
          </View>
        </LinearGradient>

        <View className="flex-1 items-center justify-center px-10">
          <View className="mb-5 h-24 w-24 items-center justify-center rounded-full bg-blue-50">
            <Ionicons name="chatbubbles-outline" size={48} color="#93C5FD" />
          </View>
          <Text className="text-center text-xl font-black text-slate-700">No Messages Yet</Text>
          <Text className="mt-2 text-center text-sm leading-5 text-slate-400">
            Your conversations with teachers and school staff will appear here.
          </Text>
        </View>
      </View>
    );
  }

  // ── Main List ──────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <LinearGradient
        colors={['#3B82F6', '#1D4ED8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ paddingTop: insets.top || StatusBar.currentHeight || 44 }}
      >
        <View className="flex-row items-center justify-between px-5 pb-4 pt-3">
          <View>
            <Text className="text-xl font-black text-white">Messages</Text>
            {totalUnread > 0 ? (
              <Text className="mt-0.5 text-xs text-white/70">
                {totalUnread} unread message{totalUnread > 1 ? 's' : ''}
              </Text>
            ) : (
              <Text className="mt-0.5 text-xs text-white/60">All caught up ✓</Text>
            )}
          </View>

          {totalUnread > 0 && (
            <TouchableOpacity
              onPress={handleMarkAllRead}
              activeOpacity={0.75}
              className="flex-row items-center rounded-full bg-white/20 px-3 py-1.5"
            >
              <Ionicons name="checkmark-done" size={14} color="white" />
              <Text className="ml-1.5 text-xs font-bold text-white">Mark all read</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>

      {/* Conversation Rows */}
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="overflow-hidden rounded-b-[0px] bg-white">
          {conversations.map((conv, index) => (
            <TouchableOpacity
              key={conv.id}
              onPress={() => handleOpenChat(conv.id)}
              activeOpacity={0.7}
              className={`flex-row items-center px-4 py-3.5 ${
                index < conversations.length - 1 ? 'border-b border-slate-100' : ''
              } ${conv.unreadCount > 0 ? 'bg-blue-50/40' : 'bg-white'}`}
            >
              {/* Avatar */}
              <View
                className="mr-3.5 h-14 w-14 shrink-0 items-center justify-center rounded-full shadow-sm"
                style={{ backgroundColor: conv.avatarColor }}
              >
                {conv.isReadOnly ? (
                  <Ionicons name="megaphone" size={22} color="white" />
                ) : (
                  <Text className="text-[17px] font-black text-white">{conv.initials}</Text>
                )}
              </View>

              {/* Text content */}
              <View className="flex-1">
                {/* Row 1: Name + time */}
                <View className="mb-0.5 flex-row items-center justify-between">
                  <View className="flex-1 flex-row items-center gap-x-2">
                    <Text
                      className={`mr-1.5 flex-shrink text-[15px] ${
                        conv.unreadCount > 0 ? 'font-black text-slate-900' : 'font-bold text-slate-700'
                      }`}
                      numberOfLines={1}
                    >
                      {conv.name}
                    </Text>

                    {/* Broadcast badge */}
                    {conv.isReadOnly && (
                      <View className="flex-row items-center rounded-full bg-amber-100 px-1.5 py-0.5">
                        <Ionicons name="megaphone-outline" size={9} color="#B45309" />
                        <Text className="ml-0.5 text-[9px] font-bold text-amber-700">
                          Broadcast
                        </Text>
                      </View>
                    )}

                    {/* Group icon */}
                    {conv.isGroup && !conv.isReadOnly && (
                      <Ionicons name="people-outline" size={13} color="#94A3B8" />
                    )}
                  </View>
                  <Text className="ml-2 shrink-0 text-[11px] text-slate-400">
                    {conv.lastMessageTime}
                  </Text>
                </View>

                {/* Row 2: Last message + unread badge */}
                <View className="flex-row items-center justify-between">
                  <Text
                    className={`flex-1 text-[13px] ${
                      conv.unreadCount > 0
                        ? 'font-semibold text-slate-700'
                        : 'font-normal text-slate-400'
                    }`}
                    numberOfLines={1}
                  >
                    {conv.lastMessage}
                  </Text>

                  {conv.unreadCount > 0 && (
                    <View className="ml-2 h-5 min-w-[20px] items-center justify-center rounded-full bg-blue-600 px-1.5">
                      <Text className="text-[10px] font-black text-white">
                        {conv.unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Footer note */}
        <View className="items-center py-6">
          <Text className="text-xs text-slate-400">
            Messages are end-to-end encrypted 
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
