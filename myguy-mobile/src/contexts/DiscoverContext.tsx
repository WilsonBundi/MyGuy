import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  getDiscoverSuggestions,
  getTrending,
  joinCircle as apiJoinCircle,
  searchAll,
  sendConnectionRequest,
} from '../lib/api';

interface User {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
}

interface Circle {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
}

interface TrendingPing {
  id: string;
  content: string;
  authorName: string;
}

interface DiscoverContextType {
  suggestedUsers: User[];
  circles: Circle[];
  trendingPings: TrendingPing[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  search: (query: string) => Promise<{ users: User[]; pings: TrendingPing[]; circles: Circle[] }>;
  sendRequest: (userId: string) => Promise<void>;
  joinCircle: (circleId: string) => Promise<void>;
}

const DiscoverContext = createContext<DiscoverContextType>({} as DiscoverContextType);

export const DiscoverProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([]);
  const [circles, setCircles] = useState<Circle[]>([]);
  const [trendingPings, setTrendingPings] = useState<TrendingPing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [suggestionsResult, trendingResult] = await Promise.allSettled([
        getDiscoverSuggestions(),
        getTrending(),
      ]);
      const errors: string[] = [];
      if (suggestionsResult.status === 'fulfilled') {
        const suggestions = suggestionsResult.value;
        setSuggestedUsers(suggestions.users.map((user) => ({
          id: user.id,
          username: user.username,
          displayName: user.profile?.displayName || user.username,
          avatar: user.profile?.avatar || undefined,
        })));
        setCircles(suggestions.circles.map((circle) => ({
          id: circle.id,
          name: circle.name,
          description: circle.description || undefined,
          memberCount: circle._count?.members ?? circle.memberCount ?? 0,
        })));
      } else {
        errors.push(suggestionsResult.reason instanceof Error
          ? suggestionsResult.reason.message
          : 'Could not load people and circles.');
      }
      if (trendingResult.status === 'fulfilled') {
        setTrendingPings(trendingResult.value.trending.map((ping) => ({
          id: ping.id,
          content: ping.content,
          authorName: ping.author?.profile?.displayName || ping.author?.username || 'MyGuy member',
        })));
      } else {
        errors.push(trendingResult.reason instanceof Error
          ? trendingResult.reason.message
          : 'Could not load trending moments.');
      }
      setError(errors.length ? errors.join(' ') : null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load discovery.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const sendRequest = useCallback(async (userId: string) => {
    await sendConnectionRequest(userId);
    setSuggestedUsers((current) => current.filter((user) => user.id !== userId));
  }, []);

  const joinCircle = useCallback(async (circleId: string) => {
    await apiJoinCircle(circleId);
    setCircles((current) => current.filter((circle) => circle.id !== circleId));
  }, []);

  const search = useCallback(async (query: string) => {
    if (!query.trim()) return { users: [], pings: [], circles: [] };
    const results = await searchAll(query.trim());
    return {
      users: results.users.map((user) => {
        const profile = user.profile;
        return {
          id: String(user.id),
          username: String(user.username),
          displayName: profile?.displayName || String(user.username),
          avatar: profile?.avatar || undefined,
        };
      }),
      pings: results.pings.map((ping) => {
        const author = ping.author;
        return {
          id: String(ping.id),
          content: String(ping.content),
          authorName: author?.profile?.displayName || author?.username || 'MyGuy member',
        };
      }),
      circles: results.circles.map((circle) => ({
        id: String(circle.id),
        name: String(circle.name),
        description: typeof circle.description === 'string' ? circle.description : undefined,
        memberCount: typeof circle.memberCount === 'number' ? circle.memberCount : 0,
      })),
    };
  }, []);

  return (
    <DiscoverContext.Provider value={{
      suggestedUsers,
      circles,
      trendingPings,
      loading,
      error,
      refresh,
      search,
      sendRequest,
      joinCircle,
    }}>
      {children}
    </DiscoverContext.Provider>
  );
};

export const useDiscover = () => useContext(DiscoverContext);
