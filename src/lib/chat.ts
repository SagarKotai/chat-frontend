import type { Chat, User } from '@/types/entities';

export const getDirectChatPeer = (chat: Chat, currentUserId: string): User | undefined => {
  return chat.participants.find((participant) => participant._id !== currentUserId);
};

export const getChatTitle = (chat: Chat, currentUserId: string): string => {
  if (chat.isGroupChat) return chat.name || 'Untitled Group';
  return getDirectChatPeer(chat, currentUserId)?.name ?? 'Unknown User';
};

export const getChatAvatar = (chat: Chat, currentUserId: string): string => {
  if (chat.isGroupChat) return chat.avatar || '';
  return getDirectChatPeer(chat, currentUserId)?.avatar || '';
};
