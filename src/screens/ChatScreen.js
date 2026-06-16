import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { chatService } from '../services/chatService';

export default function ChatScreen({ conversationId, onBack }) {
  const insets = useSafeAreaInsets();
  const flatListRef = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [inputHeight, setInputHeight] = useState(40);
  const [isSending, setIsSending] = useState(false);

  // ── Load conversation ──────────────────────────────────────────────────────
  const loadConversation = useCallback(async () => {
    const all = await chatService.getConversations();
    const conv = all.find(c => c.id === conversationId);
    if (conv) {
      setConversation(conv);
      setMessages(conv.messages);
    }
  }, [conversationId]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }, []);

  // ── Send message ───────────────────────────────────────────────────────────
  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;

    setInputText('');
    setInputHeight(40);
    setIsSending(true);

    // Optimistic: show message immediately with 'sending' status
    const tempId = 'temp-' + Date.now();
    const tempMsg = {
      id: tempId,
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sending',
    };

    setMessages(prev => [...prev, tempMsg]);
    scrollToBottom();

    try {
      const saved = await chatService.sendMessage(conversationId, text);
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...saved, status: 'sent' } : m)
      );
    } catch (_err) {
      // Mark as failed so user can retry
      setMessages(prev =>
        prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m)
      );
    } finally {
      setIsSending(false);
    }
  };

  // Retry: put the failed message text back in the input box
  const handleRetry = (failedMsg) => {
    setMessages(prev => prev.filter(m => m.id !== failedMsg.id));
    setInputText(failedMsg.text);
  };

  // ── Render a single bubble ─────────────────────────────────────────────────
  const renderMessage = ({ item: msg, index }) => {
    const isMe = msg.sender === 'me';
    const isFailed = msg.status === 'failed';
    const isSendingNow = msg.status === 'sending';

    // Date separator above the first message
    const showDateSeparator = index === 0;

    return (
      <View>
        {showDateSeparator && (
          <View className="my-3 items-center">
            <View className="rounded-full bg-slate-200/70 px-3 py-1">
              <Text className="text-[11px] font-semibold text-slate-500">Today</Text>
            </View>
          </View>
        )}

        <View className={`mb-2 px-4 ${isMe ? 'items-end' : 'items-start'}`}>
          {/* Bubble */}
          <View
            className={`max-w-[78%] rounded-[18px] px-4 py-2.5 shadow-sm ${
              isMe
                ? isFailed
                  ? 'rounded-tr-[4px] bg-rose-500'
                  : 'rounded-tr-[4px] bg-blue-600'
                : 'rounded-tl-[4px] border border-slate-100 bg-white'
            }`}
          >
            <Text
              className={`text-[14px] leading-[21px] ${
                isMe ? 'text-white' : 'text-slate-800'
              }`}
            >
              {msg.text}
            </Text>
          </View>

          {/* Timestamp + status icons */}
          <View
            className={`mt-1 flex-row items-center gap-x-1 ${isMe ? 'flex-row-reverse' : ''}`}
          >
            <Text className="text-[10px] text-slate-400">{msg.time}</Text>

            {isMe && !isFailed && !isSendingNow && (
              <Ionicons name="checkmark-done" size={12} color="#60A5FA" />
            )}
            {isMe && isSendingNow && (
              <Ionicons name="time-outline" size={11} color="#94A3B8" />
            )}
            {isMe && isFailed && (
              <TouchableOpacity
                onPress={() => handleRetry(msg)}
                className="flex-row items-center"
                activeOpacity={0.7}
              >
                <Ionicons name="alert-circle" size={13} color="#EF4444" />
                <Text className="ml-0.5 text-[10px] font-bold text-rose-500">
                  Tap to retry
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  // ── Empty messages state ───────────────────────────────────────────────────
  const EmptyMessages = () => (
    <View className="flex-1 items-center justify-center py-24">
      <Ionicons name="chatbubble-ellipses-outline" size={52} color="#CBD5E1" />
      <Text className="mt-3 text-sm font-semibold text-slate-400">No messages yet</Text>
      <Text className="mt-1 text-xs text-slate-300">Start the conversation below 👇</Text>
    </View>
  );

  if (!conversation) return null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View
        className="flex-row items-center bg-blue-600 px-4 pb-3.5"
        style={{ paddingTop: insets.top || StatusBar.currentHeight || 44 }}
      >
        <TouchableOpacity
          onPress={onBack}
          activeOpacity={0.75}
          className="mr-3 h-9 w-9 items-center justify-center rounded-full bg-white/20"
        >
          <Ionicons name="arrow-back" size={20} color="white" />
        </TouchableOpacity>

        <View
          className="mr-3 h-11 w-11 items-center justify-center rounded-full shadow-md"
          style={{ backgroundColor: conversation.avatarColor }}
        >
          {conversation.isReadOnly ? (
            <Ionicons name="megaphone" size={18} color="white" />
          ) : (
            <Text className="text-[13px] font-black text-white">{conversation.initials}</Text>
          )}
        </View>

        <View className="flex-1">
          <Text className="text-[15px] font-black text-white" numberOfLines={1}>
            {conversation.name}
          </Text>
          <Text className="text-[11px] text-white/70">{conversation.role}</Text>
        </View>

        {/* Online indicator (cosmetic for non-broadcast chats) */}
        {!conversation.isReadOnly && (
          <View className="flex-row items-center rounded-full bg-white/15 px-2.5 py-1">
            <View className="mr-1.5 h-2 w-2 rounded-full bg-emerald-400" />
            <Text className="text-[10px] font-semibold text-white/80">Online</Text>
          </View>
        )}
      </View>

      {/* Read-only broadcast banner */}
      {conversation.isReadOnly && (
        <View className="flex-row items-center justify-center border-b border-amber-100 bg-amber-50 px-5 py-2.5">
          <Ionicons name="lock-closed-outline" size={12} color="#B45309" />
          <Text className="ml-1.5 text-xs font-semibold text-amber-700">
            Broadcast channel — only admins can send messages
          </Text>
        </View>
      )}

      {/* Messages list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: 8,
          paddingBottom: 12,
        }}
        onContentSizeChange={scrollToBottom}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<EmptyMessages />}
      />

      {/* Input bar — hidden for read-only broadcast channels */}
      {!conversation.isReadOnly && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={0}
        >
          <View
            className="flex-row items-end border-t border-slate-100 bg-white px-3 py-2"
            style={{ paddingBottom: insets.bottom > 0 ? insets.bottom : 12 }}
          >
            <TextInput
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              style={{
                flex: 1,
                height: Math.min(inputHeight, 96),
                maxHeight: 96,
                borderWidth: 1,
                borderColor: '#E2E8F0',
                borderRadius: 20,
                backgroundColor: '#F8FAFC',
                paddingHorizontal: 16,
                paddingTop: 10,
                paddingBottom: 10,
                fontSize: 14,
                color: '#1E293B',
                marginRight: 8,
              }}
              onContentSizeChange={(e) => {
                const h = e.nativeEvent.contentSize.height;
                setInputHeight(Math.min(Math.max(40, h), 96));
              }}
              blurOnSubmit={false}
            />

            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim() || isSending}
              activeOpacity={0.8}
              className={`h-11 w-11 items-center justify-center rounded-full shadow-md ${
                inputText.trim() ? 'bg-blue-600 shadow-blue-600/30' : 'bg-slate-200'
              }`}
            >
              <Ionicons
                name="send"
                size={18}
                color={inputText.trim() ? 'white' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}
    </View>
  );
}
