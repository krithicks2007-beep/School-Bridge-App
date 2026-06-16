/**
 * chatData.js — Mock conversation data for Phase 1 (local).
 *
 * IMPORTANT: `lastMessage` and `lastMessageTime` are stored as top-level fields
 * on each conversation so we never have to derive them from the messages array
 * on every render. Always update these two fields whenever a new message is sent.
 */

export const conversations = [
  {
    id: 'teacher',
    name: 'Mrs. Lakshmi',
    role: 'Class Teacher',
    avatarColor: '#6366F1',
    initials: 'ML',
    isReadOnly: false,
    isGroup: false,
    unreadCount: 2,
    lastMessage: 'Please send a medical note tomorrow.',
    lastMessageTime: '9:16 AM',
    messages: [
      {
        id: '1',
        sender: 'them',
        text: 'Good morning! Rahul was absent yesterday. Is everything okay?',
        time: '9:10 AM',
        status: 'sent',
      },
      {
        id: '2',
        sender: 'me',
        text: "Yes ma'am, he had a fever. He is feeling much better now.",
        time: '9:15 AM',
        status: 'sent',
      },
      {
        id: '3',
        sender: 'them',
        text: 'Okay, please send a medical note tomorrow so I can update the attendance record.',
        time: '9:16 AM',
        status: 'sent',
      },
    ],
  },
  {
    id: 'announcement',
    name: 'School Announcements',
    role: 'Broadcast Channel',
    avatarColor: '#F59E0B',
    initials: 'SA',
    isReadOnly: true,
    isGroup: true,
    unreadCount: 1,
    lastMessage: 'Sports Day is on June 20th. All students must attend.',
    lastMessageTime: '8:00 AM',
    messages: [
      {
        id: '1',
        sender: 'them',
        text: '📢 Important: Term exams begin July 1st. Admit cards will be issued this Friday. Please collect them from the office.',
        time: 'Yesterday',
        status: 'sent',
      },
      {
        id: '2',
        sender: 'them',
        text: '🏅 Sports Day is on June 20th. All students must wear their house colour T-shirt and arrive by 8:00 AM sharp.',
        time: '8:00 AM',
        status: 'sent',
      },
    ],
  },
  {
    id: 'principal',
    name: 'Parent–Principal Group',
    role: 'Group · 24 members',
    avatarColor: '#10B981',
    initials: 'PP',
    isReadOnly: false,
    isGroup: true,
    unreadCount: 0,
    lastMessage: 'The PTA meeting is rescheduled to June 25th.',
    lastMessageTime: 'Mon',
    messages: [
      {
        id: '1',
        sender: 'them',
        text: 'Good morning parents! The PTA meeting originally scheduled for June 18th has been rescheduled to June 25th at 10:00 AM in the school auditorium.',
        time: '10:00 AM',
        status: 'sent',
      },
      {
        id: '2',
        sender: 'me',
        text: 'Thank you for informing us. We will be there.',
        time: '10:30 AM',
        status: 'sent',
      },
    ],
  },
  {
    id: 'maths',
    name: 'Mr. Rajan',
    role: 'Mathematics Teacher',
    avatarColor: '#EC4899',
    initials: 'MR',
    isReadOnly: false,
    isGroup: false,
    unreadCount: 0,
    lastMessage: 'Please ensure he revises chapters 5 and 6.',
    lastMessageTime: 'Fri',
    messages: [
      {
        id: '1',
        sender: 'them',
        text: 'Good afternoon! Rahul scored 92/100 in the unit test. Excellent performance — keep it up!',
        time: '2:30 PM',
        status: 'sent',
      },
      {
        id: '2',
        sender: 'me',
        text: 'Thank you sir! We are very happy and proud to hear that.',
        time: '3:00 PM',
        status: 'sent',
      },
      {
        id: '3',
        sender: 'them',
        text: 'Please ensure he revises chapters 5 and 6 thoroughly before the upcoming quarterly exam.',
        time: '3:05 PM',
        status: 'sent',
      },
    ],
  },
];
