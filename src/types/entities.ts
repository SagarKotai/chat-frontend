export interface User {
  _id: string;
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  isOnline: boolean;
  lastSeen?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Chat {
  _id: string;
  isGroupChat: boolean;
  name?: string;
  description?: string;
  avatar?: string;
  participants: User[];
  admin?: User;
  groupAdmins?: User[];
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}

export type MessageContentType = 'text' | 'image' | 'video' | 'audio' | 'document';

export interface Message {
  _id: string;
  chat: string;
  sender: User;
  content: string;
  contentType: MessageContentType;
  fileUrl?: string;
  filePublicId?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  status: 'sent' | 'delivered' | 'read';
  readBy: Array<{ user: string; readAt: string }>;
  deliveredTo: string[];
  replyTo?: Message;
  isDeleted: boolean;
  isEdited: boolean;
  editedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  recipient: string;
  sender: User;
  type: 'new_message' | 'group_invite' | 'added_to_group' | 'removed_from_group' | 'group_admin_promoted';
  chat?: Pick<Chat, '_id' | 'name' | 'isGroupChat'>;
  message?: Message;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface AuthPayload {
  user: User;
  accessToken: string;
}
