/**
 * chatService.js — Phase 1: Local in-memory mock implementation.
 *
 * PHASE 2 MIGRATION NOTE:
 * Every function signature here will remain IDENTICAL when you switch to Firebase.
 * Only the internals change. To migrate:
 *   1. Install firebase: `npx expo install firebase`
 *   2. Create src/services/firebaseConfig.js with your Firebase credentials
 *   3. Replace each function body below with the commented Firestore equivalent
 *   4. Zero changes needed in ChatListScreen.js or ChatScreen.js
 */

import { conversations as seedData } from '../data/chatData';

// In-memory store (simulates a local DB in Phase 1)
let _store = seedData.map(c => ({ ...c, messages: [...c.messages] }));

export const chatService = {
  /**
   * Get all conversations for the current user.
   *
   * Phase 2 (Firebase):
   *   const snapshot = await firestore()
   *     .collection('conversations')
   *     .where('participants', 'array-contains', auth().currentUser.uid)
   *     .orderBy('lastMessageTime', 'desc')
   *     .get();
   *   return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
   */
  getConversations: async () => {
    return [..._store];
  },

  /**
   * Get messages for a specific conversation.
   *
   * Phase 2 (Firebase):
   *   const snapshot = await firestore()
   *     .collection('messages')
   *     .where('conversationId', '==', conversationId)
   *     .orderBy('createdAt', 'asc')
   *     .get();
   *   return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
   */
  getMessages: async (conversationId) => {
    const conv = _store.find(c => c.id === conversationId);
    return conv ? [...conv.messages] : [];
  },

  /**
   * Send a new message in a conversation.
   * Returns the created message object.
   *
   * Phase 2 (Firebase):
   *   const msg = { conversationId, text, sender: auth().currentUser.uid, createdAt: firestore.FieldValue.serverTimestamp(), status: 'sent' };
   *   const ref = await firestore().collection('messages').add(msg);
   *   await firestore().collection('conversations').doc(conversationId).update({
   *     lastMessage: text, lastMessageTime: msg.createdAt, unreadCount: firestore.FieldValue.increment(1)
   *   });
   *   return { id: ref.id, ...msg };
   */
  sendMessage: async (conversationId, text) => {
    const newMsg = {
      id: Date.now().toString(),
      sender: 'me',
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    _store = _store.map(c => {
      if (c.id !== conversationId) return c;
      return {
        ...c,
        messages: [...c.messages, newMsg],
        lastMessage: text,
        lastMessageTime: newMsg.time,
        unreadCount: 0, // sender's own conversation is always read
      };
    });

    return newMsg;
  },

  /**
   * Mark a specific conversation as read (clears unread badge).
   *
   * Phase 2 (Firebase):
   *   await firestore().collection('conversations').doc(conversationId).update({ unreadCount: 0 });
   */
  markAsRead: async (conversationId) => {
    _store = _store.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    );
  },

  /**
   * Mark ALL conversations as read.
   *
   * Phase 2 (Firebase):
   *   const batch = firestore().batch();
   *   const snap = await firestore().collection('conversations')
   *     .where('participants', 'array-contains', uid).get();
   *   snap.docs.forEach(d => batch.update(d.ref, { unreadCount: 0 }));
   *   await batch.commit();
   */
  markAllAsRead: async () => {
    _store = _store.map(c => ({ ...c, unreadCount: 0 }));
  },

  /**
   * Helper to access the current in-memory state directly (Phase 1 only).
   * Remove this in Phase 2 — use Firestore listeners instead.
   */
  _getState: () => _store,
};
