// Data exports for the app
export { default as chatsData } from './chats.json';
export { default as notificationsData } from './notifications.json';
export { default as postsData } from './posts.json';
export { default as usersData } from './users.json';

// Type definitions
export interface Post {
  id: string;
  username: string;
  userDescription: string;
  timeAgo: string;
  content: string;
  profile?: string;
  image?: string;
  comments?: Comment[];
}

export interface Comment {
  id: string;
  username: string;
  userDescription: string;
  timeAgo: string;
  content: string;
  profile?: string;
}

export interface Chat {
  id: string;
  name: string;
  description: string;
  lastMessage: string;
  timeAgo: string;
  unreadCount: number;
  color: string;
  profile: string;
  messages: Message[];
}

export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isOwn: boolean;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  description: string;
  profile: string;
  followers: number;
  following: number;
  posts: number;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: string;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'share';
  username: string;
  userProfile: string;
  content: string;
  timeAgo: string;
  isRead: boolean;
  postId: string | null;
}
