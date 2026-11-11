import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { AppState } from 'react-native';
import { getPings, createPing as apiCreatePing, togglePingLike } from '../lib/api';
import { useAuth } from './AuthContext';

const PING_REFRESH_INTERVAL_MS = 3000;

interface Ping {
  id: string;
  content: string;
  mediaUrls: string[];
  author: {
    id: string;
    username: string;
    displayName: string;
    avatar?: string;
  };
  createdAt: string;
  likes: number;
  comments: number;
  isLiked: boolean;
}

interface PingContextType {
  pings: Ping[];
  loading: boolean;
  error: string | null;
  createPing: (content: string, mediaUrls?: string[]) => Promise<void>;
  toggleLike: (pingId: string) => Promise<void>;
  refreshPings: () => Promise<void>;
}

const PingContext = createContext<PingContextType>({} as PingContextType);

export const PingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pings, setPings] = useState<Ping[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const requestInFlight = useRef(false);
  const activeUserId = useRef(user?.id);
  activeUserId.current = user?.id;

  const loadPings = useCallback(async (silent = false) => {
    const requestedUserId = user?.id;
    if (!requestedUserId || requestInFlight.current) return;

    requestInFlight.current = true;
    if (!silent) {
      setLoading(true);
      setError(null);
    }

    try {
      const { pings: data } = await getPings();
      if (activeUserId.current !== requestedUserId) return;
      setPings(data.map((ping) => ({
        id: ping.id,
        content: ping.content,
        mediaUrls: ping.mediaUrls || [],
        author: {
          id: ping.author.id,
          username: ping.author.username,
          displayName: ping.author.profile?.displayName || ping.author.username,
          avatar: ping.author.profile?.avatar || undefined,
        },
        createdAt: ping.createdAt,
        likes: ping.likes.length,
        comments: ping.comments.length,
        isLiked: ping.likes.some((like) => like.userId === requestedUserId),
      })));
      setError(null);
    } catch (loadError) {
      if (activeUserId.current !== requestedUserId) return;
      if (!silent) console.error('Error loading pings:', loadError);
      const message = loadError instanceof Error ? loadError.message : '';
      setError(
        /network|fetch|cors/i.test(message)
          ? "We couldn't connect to MyGuy. Check your connection and try again."
          : message || 'Could not load your feed. Please try again.'
      );
    } finally {
      requestInFlight.current = false;
      if (!silent && activeUserId.current === requestedUserId) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (user) {
      void loadPings();
    } else {
      setPings([]);
      setError(null);
      setLoading(false);
    }
  }, [user?.id, loadPings]);

  useEffect(() => {
    if (!user?.id) return;

    const refreshIfForeground = () => {
      if (AppState.currentState === 'active') void loadPings(true);
    };
    const interval = setInterval(refreshIfForeground, PING_REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void loadPings(true);
    });

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [user?.id, loadPings]);

  const toggleLike = async (pingId: string) => {
    const { liked } = await togglePingLike(pingId);
    setPings((current) => current.map((ping) => ping.id === pingId
      ? { ...ping, isLiked: liked, likes: Math.max(0, ping.likes + (liked ? 1 : -1)) }
      : ping
    ));
  };

  const createPing = async (content: string, mediaUrls: string[] = []) => {
    try {
      await apiCreatePing({ content, mediaUrls });
      await loadPings();
    } catch (error) {
      console.error('Error creating ping:', error);
      throw error;
    }
  };

  const refreshPings = useCallback(() => loadPings(), [loadPings]);

  return (
    <PingContext.Provider value={{ pings, loading, error, createPing, toggleLike, refreshPings }}>
      {children}
    </PingContext.Provider>
  );
};

export const usePings = () => useContext(PingContext);
