import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { createChat as apiCreateChat, createCrew as apiCreateCrew, getChats, getCrew as apiGetCrew, getCrews, getMessages, sendMessage, type ApiChat, type ApiMessage } from '../lib/api';
import { useAuth } from './AuthContext';

export interface Chat {
  id: string;
  name: string;
  username: string;
  avatar?: string;
  isOnline: boolean;
  lastActiveAt?: string | null;
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  isGroup: boolean;
  memberCount: number;
  onlineMemberCount: number;
  role: string;
  description?: string | null;
  isPrivate: boolean;
  inviteCode?: string | null;
}

interface ChatContextType {
  chats: Chat[];
  crews: Chat[];
  activeChat: Chat | null;
  messages: ApiMessage[];
  loading: boolean;
  messagesLoading: boolean;
  error: string | null;
  messagesError: string | null;
  refresh: () => Promise<void>;
  selectChat: (chat: Chat) => Promise<void>;
  selectCrew: (crewId: string) => Promise<void>;
  startChat: (userId: string) => Promise<void>;
  startCrew: (crewName: string, userIds: string[], options?: {
    description?: string;
    isPrivate?: boolean;
    requiresApproval?: boolean;
  }) => Promise<Chat>;
  send: (data: {
    content: string;
    messageType?: 'text' | 'image' | 'video' | 'file';
    mediaUrl?: string;
    attachmentName?: string;
    isAnnouncement?: boolean;
  }) => Promise<void>;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

function normalizeChat(raw: ApiChat, userId: string): Chat {
  const otherMember = raw.members?.find((member) => member.userId !== userId);
  const otherUser = otherMember?.user;
  const lastMessage = raw.messages?.[0];
  const isGroup = raw.isGroup ?? false;
  const onlineMembers = raw.members?.filter((member) => member.user?.isOnline).length ?? 0;
  const currentMembership = raw.members?.find((member) => member.userId === userId);
  return {
    id: raw.id,
    name: isGroup ? raw.groupName || 'Crew' : otherUser?.profile?.displayName || otherUser?.username || 'MyGuy member',
    username: isGroup ? '' : otherUser?.username || '',
    avatar: isGroup ? raw.groupImage || undefined : otherUser?.profile?.avatar || undefined,
    isOnline: isGroup ? onlineMembers > 0 : otherUser?.isOnline ?? false,
    lastActiveAt: isGroup ? null : otherUser?.lastActiveAt,
    lastMessage: lastMessage?.content,
    lastMessageAt: lastMessage?.createdAt,
    unreadCount: raw.unreadCount ?? 0,
    isGroup,
    memberCount: raw.members?.length ?? (isGroup ? 0 : 2),
    onlineMemberCount: onlineMembers,
    role: currentMembership?.role || (isGroup ? 'member' : 'member'),
    description: raw.description,
    isPrivate: raw.isPrivate ?? false,
    inviteCode: raw.inviteCode,
  };
}

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [crews, setCrews] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadChats = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      setError(null);
      const [{ chats: chatData }, { crews: crewData }] = await Promise.all([getChats(), getCrews()]);
      const normalizedChats = chatData.map((chat) => normalizeChat(chat, user.id));
      const normalizedCrews = crewData.map((chat) => normalizeChat(chat, user.id));
      setChats(normalizedChats);
      setCrews(normalizedCrews);
      setActiveChat((current) => current
        ? [...normalizedChats, ...normalizedCrews].find((chat) => chat.id === current.id) || current
        : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load chats.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void loadChats();
    }, 12000);
    return () => clearInterval(interval);
  }, [user, loadChats]);

  useEffect(() => {
    if (!activeChat) return;
    let mounted = true;
    const refreshMessages = async () => {
      if (AppState.currentState !== 'active') return;
      try {
        const { messages: latest } = await getMessages(activeChat.id);
        if (mounted) {
          setMessages(latest);
          setMessagesError(null);
        }
      } catch (loadError) {
        if (mounted) {
          setMessagesError(loadError instanceof Error ? loadError.message : 'Could not refresh messages.');
        }
      }
    };
    const interval = setInterval(() => void refreshMessages(), 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [activeChat?.id]);

  useEffect(() => {
    if (user) {
      void loadChats();
    } else {
      setChats([]);
      setCrews([]);
      setActiveChat(null);
      setMessages([]);
      setError(null);
      setLoading(false);
    }
  }, [user, loadChats]);

  const selectChat = async (chat: Chat) => {
    setActiveChat(chat);
    try {
      setMessagesLoading(true);
      setMessagesError(null);
      const { messages: data } = await getMessages(chat.id);
      setMessages(data);
    } catch (loadError) {
      setMessages([]);
      setMessagesError(loadError instanceof Error ? loadError.message : 'Could not load messages.');
    } finally {
      setMessagesLoading(false);
    }
  };

  const startChat = async (userId: string) => {
    if (!user) return;
    const { chat: rawChat } = await apiCreateChat(userId);
    const chat = normalizeChat(rawChat, user.id);
    setActiveChat(chat);
    await selectChat(chat);
    await loadChats();
  };

  const startCrew = async (crewName: string, userIds: string[], options?: {
    description?: string;
    isPrivate?: boolean;
    requiresApproval?: boolean;
  }) => {
    if (!user) throw new Error('Sign in to create a Crew.');
    const { crew: rawCrew } = await apiCreateCrew(crewName, userIds, options);
    const crew = normalizeChat(rawCrew, user.id);
    setActiveChat(crew);
    await loadChats();
    await selectChat(crew);
    return crew;
  };

  const selectCrew = async (crewId: string) => {
    if (!user) throw new Error('Sign in to open this Crew.');
    const { crew: rawCrew } = await apiGetCrew(crewId);
    await selectChat(normalizeChat(rawCrew, user.id));
    await loadChats();
  };

  const send = async (data: {
    content: string;
    messageType?: 'text' | 'image' | 'video' | 'file';
    mediaUrl?: string;
    attachmentName?: string;
    isAnnouncement?: boolean;
  }) => {
    if (!activeChat || (!data.content.trim() && !data.mediaUrl)) return;
    try {
      setMessagesError(null);
      const { message } = await sendMessage(activeChat.id, { ...data, content: data.content.trim() });
      setMessages((current) => [...current, message]);
      await loadChats();
    } catch (sendError) {
      const message = sendError instanceof Error ? sendError.message : 'Could not send message.';
      setMessagesError(message);
      throw sendError;
    }
  };

  return (
    <ChatContext.Provider value={{
      chats,
      crews,
      activeChat,
      messages,
      loading,
      messagesLoading,
      error,
      messagesError,
      refresh: loadChats,
      selectChat,
      selectCrew,
      startChat,
      startCrew,
      send,
    }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChats = () => useContext(ChatContext);
