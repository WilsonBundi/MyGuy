import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const configuredApiBase =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  process.env.MYGUY_API_BASE_URL;

function resolveApiBase() {
  if (configuredApiBase) return configuredApiBase.replace(/\/+$/, '');

  if (typeof window !== 'undefined' && window.location?.hostname) {
    const { hostname, protocol } = window.location;
    const isLocalHost = hostname === 'localhost' || hostname === '127.0.0.1';
    const isPrivateHost =
      /^10\./.test(hostname) ||
      /^192\.168\./.test(hostname) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(hostname);
    return isLocalHost || isPrivateHost
      ? `${protocol}//${hostname}:3000/api`
      : `${protocol}//${hostname}/api`;
  }

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return `http://${host}:3000/api`;
    }
  }

  return Platform.OS === 'android' ? 'http://10.0.2.2:3000/api' : 'http://localhost:3000/api';
}

const API_BASE = resolveApiBase();
const AUTH_TOKEN_KEY = 'authToken';

export interface ApiResult<T> {
  [key: string]: unknown;
  data?: T;
}

export interface ApiUser {
  id: string;
  username: string;
  isOnline?: boolean;
  lastActiveAt?: string | null;
  profile?: {
    displayName?: string | null;
    avatar?: string | null;
    bio?: string | null;
  } | null;
}

export interface ApiAuthUser {
  id: string;
  email: string;
  username: string;
  displayName?: string;
  avatar?: string;
  coverImage?: string;
  phone?: string | null;
}

export interface ApiProfile {
  displayName: string;
  avatar?: string | null;
  coverImage?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  country?: string | null;
}

export interface ApiMessage {
  id: string;
  senderId: string;
  sender?: ApiUser;
  content: string;
  messageType: 'text' | 'image' | 'video' | 'file' | string;
  mediaUrl?: string | null;
  attachmentName?: string | null;
  isAnnouncement?: boolean;
  createdAt: string;
  isRead?: boolean;
}

export interface ApiPing {
  id: string;
  content: string;
  mediaUrls: string[];
  createdAt: string;
  author: ApiUser;
  likes: Array<{ userId: string }>;
  comments: Array<{ id: string }>;
  shares?: Array<{ id: string }>;
}

export interface ApiComment {
  id: string;
  content: string;
  createdAt: string;
  parentCommentId?: string | null;
  user: ApiUser;
  replies?: ApiComment[];
}

export interface ApiMoment {
  id: string;
  mediaUrl: string | null;
  mediaType: 'image' | 'video' | null;
  caption?: string | null;
  expiresAt: string;
  createdAt: string;
  authorId: string;
  author: ApiUser;
  reactions: Array<{ userId: string; type: string }>;
  _count: { reactions: number; replies: number };
}

export interface ApiMomentReply {
  id: string;
  content: string;
  createdAt: string;
  user: ApiUser;
}

export interface ApiNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export interface ApiChat {
  id: string;
  isGroup?: boolean;
  groupName?: string | null;
  groupImage?: string | null;
  description?: string | null;
  isPrivate?: boolean;
  requiresApproval?: boolean;
  inviteCode?: string | null;
  unreadCount?: number;
  _count?: { members: number };
  members?: Array<{
    userId: string;
    role?: string;
    joinedAt?: string;
    lastReadAt?: string | null;
    user?: ApiUser;
  }>;
  messages?: ApiMessage[];
}

export interface ApiChatCall {
  id: string;
  chatId: string;
  callerId: string;
  calleeId: string;
  type: 'audio' | 'video';
  status: 'ringing' | 'active' | 'declined' | 'ended';
  offer: { type: 'offer'; sdp: string };
  answer: { type: 'answer'; sdp: string } | null;
  createdAt: string;
  caller: ApiUser;
  callee: ApiUser;
}

export interface ApiChatCallSignal {
  id: string;
  payload: {
    candidate: string;
    sdpMid?: string | null;
    sdpMLineIndex?: number | null;
    usernameFragment?: string;
  };
  createdAt: string;
}

export interface ApiIncomingCall {
  id: string;
  chatId: string;
  type: 'audio' | 'video';
  createdAt: string;
  caller: ApiUser;
}

export interface ApiCrewJoinRequest {
  id: string;
  createdAt: string;
  user: ApiUser;
}

export interface ApiCrewPoll {
  id: string;
  question: string;
  allowsMultiple: boolean;
  endsAt: string | null;
  createdAt: string;
  options: Array<{ id: string; text: string; voteCount: number; votedByMe: boolean }>;
}

export interface ApiCrewEvent {
  id: string;
  name: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string | null;
  attendeeCount: number;
  myStatus: 'going' | 'interested' | 'not_going' | null;
}

export interface ApiLiveRoom {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: 'audio' | 'video';
  isLive: boolean;
  hostId: string;
  host: ApiUser;
  viewerCount: number;
  createdAt: string;
}

export interface ApiLiveRoomMessage {
  id: string;
  content: string;
  createdAt: string;
  user: ApiUser;
}

export interface ApiLiveGuestRequest {
  id: string;
  status: 'pending' | 'invited' | 'accepted' | 'declined';
  userId?: string;
  user?: ApiUser;
}

export interface ApiLiveStageParticipant {
  id: string;
  role: string;
  publishingMuted: boolean;
  chatMutedUntil: string | null;
  user: ApiUser;
}

export interface ApiLiveReplay {
  id: string;
  status: 'starting' | 'recording' | 'ready' | 'failed' | 'deleted';
  expiresAt: string;
  durationSeconds: number | null;
  error?: string | null;
  playbackUrl?: string | null;
}

export async function apiRequest<T = Record<string, unknown>>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_BASE}${normalizedEndpoint}`;
  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (error) {
    console.error('API network error:', error);
    throw new Error(
      `Could not reach the MyGuy API at ${API_BASE}. Check that the backend is running and reachable from this device.`
    );
  }

  const responseText = await response.text();
  let data: unknown = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`The MyGuy API returned an invalid response (HTTP ${response.status}).`);
    }
  }

  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Request failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  return data as T;
}

export function resolveMediaUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const apiRoot = API_BASE.replace(/\/api\/?$/, '');
  return `${apiRoot}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function uploadMedia(
  asset: { uri: string; fileName?: string | null; mimeType?: string | null; type?: string },
  purpose: 'ping' | 'status' | 'chat' | 'avatar' | 'cover' | 'crew'
) {
  const extension = asset.mimeType?.split('/')[1] || (asset.type === 'video' ? 'mp4' : 'jpg');
  const form = new FormData();
  form.append('purpose', purpose);
  const fileName = asset.fileName || `myguy-${purpose}.${extension}`;
  const mimeType = asset.mimeType || (asset.type === 'video' ? 'video/mp4' : 'image/jpeg');
  if (Platform.OS === 'web') {
    const localFile = await fetch(asset.uri);
    if (!localFile.ok) throw new Error('Could not read the selected media file.');
    const blob = await localFile.blob();
    form.append('file', blob, fileName);
  } else {
    form.append('file', {
      uri: asset.uri,
      name: fileName,
      type: mimeType,
    } as unknown as Blob);
  }

  const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
  const headers = new Headers();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${API_BASE}/upload`, { method: 'POST', headers, body: form });
  } catch {
    throw new Error(`Could not upload media to ${API_BASE}. Check that the backend is reachable from this device.`);
  }

  const responseText = await response.text();
  let data: unknown = {};
  if (responseText) {
    try {
      data = JSON.parse(responseText);
    } catch {
      throw new Error(`The media upload returned an invalid response (HTTP ${response.status}).`);
    }
  }
  if (!response.ok) {
    const message =
      data && typeof data === 'object' && 'error' in data && typeof data.error === 'string'
        ? data.error
        : `Media upload failed (HTTP ${response.status}).`;
    throw new Error(message);
  }
  if (!data || typeof data !== 'object' || !('url' in data) || typeof data.url !== 'string') {
    throw new Error('The media upload did not return a usable URL.');
  }
  if (!('mediaType' in data) || !['image', 'video', 'file'].includes(String(data.mediaType))) {
    throw new Error('The media upload did not return a supported media type.');
  }
  return {
    ...data,
    url: data.url,
    mediaType: data.mediaType as 'image' | 'video' | 'file',
    filename: 'filename' in data && typeof data.filename === 'string' ? data.filename : fileName,
  };
}

export const testConnection = () => apiRequest('/test');

export const signup = (data: Record<string, unknown>) =>
  apiRequest<{ user: ApiAuthUser; token: string }>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const signin = (identifier: string, password: string) =>
  apiRequest<{ user: ApiAuthUser; token: string }>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify({ identifier, password }),
  });

export const sendPhoneVerificationCode = (phone: string) =>
  apiRequest<{ success: boolean; message: string }>('/auth/send-verification-code', {
    method: 'POST',
    body: JSON.stringify({ phone }),
  });

export const verifyPhoneCode = (phone: string, code: string) =>
  apiRequest<{ success: boolean; verificationToken: string }>('/auth/verify-phone-code', {
    method: 'POST',
    body: JSON.stringify({ phone, code }),
  });

export const signout = () => apiRequest('/auth/signout', { method: 'POST' });

export const getUserProfile = (username: string) =>
  apiRequest(`/users/${encodeURIComponent(username)}`);

export const getMyProfile = () => apiRequest<{ profile: ApiProfile }>('/profile');

export const updateUserProfile = (data: Record<string, unknown>) =>
  apiRequest<{ profile: ApiProfile }>('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });

export const getPings = () => apiRequest<{ pings: ApiPing[] }>('/pings');

export const createPing = (data: { content: string; mediaUrls?: string[] }) =>
  apiRequest<{ ping: ApiPing }>('/pings', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const togglePingLike = (pingId: string) =>
  apiRequest<{ liked: boolean }>(`/pings/${encodeURIComponent(pingId)}/like`, {
    method: 'POST',
  });

export const getPingComments = (pingId: string) =>
  apiRequest<{ comments: ApiComment[] }>(`/pings/${encodeURIComponent(pingId)}/comments`);

export const addPingComment = (pingId: string, content: string, parentCommentId?: string) =>
  apiRequest<{ comment: ApiComment }>(`/pings/${encodeURIComponent(pingId)}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content, parentCommentId }),
  });

export const getMoments = () => apiRequest<{ moments: ApiMoment[] }>('/moments');

export const getNotifications = () =>
  apiRequest<{ notifications: ApiNotification[]; unreadCount: number }>('/notifications');

export const markNotificationsRead = (notificationId?: string) =>
  apiRequest<{ success: boolean }>('/notifications', {
    method: 'PATCH',
    body: JSON.stringify(notificationId ? { notificationId } : { markAll: true }),
  });

export const createMoment = (data: {
  caption?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
  duration?: '6h' | '12h' | '24h';
}) => apiRequest<{ moment: ApiMoment }>('/moments', {
  method: 'POST',
  body: JSON.stringify(data),
});

export const reactToMoment = (momentId: string, type: string) =>
  apiRequest<{ success: boolean }>(`/moments/${encodeURIComponent(momentId)}/react`, {
    method: 'POST',
    body: JSON.stringify({ type }),
  });

export const removeMomentReaction = (momentId: string) =>
  apiRequest<{ success: boolean }>(`/moments/${encodeURIComponent(momentId)}/react`, {
    method: 'DELETE',
  });

export const getMomentReplies = (momentId: string) =>
  apiRequest<{ replies: ApiMomentReply[] }>(`/moments/${encodeURIComponent(momentId)}/replies`);

export const addMomentReply = (momentId: string, content: string) =>
  apiRequest<{ reply: ApiMomentReply }>(`/moments/${encodeURIComponent(momentId)}/replies`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });

export const getConnections = () =>
  apiRequest<{ connections: Record<string, unknown>[] }>('/connections');

export const sendConnectionRequest = (userId: string) =>
  apiRequest('/connections', {
    method: 'POST',
    body: JSON.stringify({ connectedId: userId }),
  });

export const getDiscoverSuggestions = () =>
  apiRequest<{
    users: ApiUser[];
    circles: Array<{
      id: string;
      name: string;
      description?: string | null;
      memberCount?: number;
      _count?: { members: number };
    }>;
  }>('/discover/suggestions');

export const getTrending = () =>
  apiRequest<{ trending: Array<{
    id: string;
    content: string;
    createdAt: string;
    author?: ApiUser;
    engagementScore?: number;
  }> }>('/discover/trending');

export const joinCircle = (circleId: string) =>
  apiRequest<{ circle: { id: string; name: string; memberCount: number } }>(
    `/circles/${encodeURIComponent(circleId)}/join`,
    { method: 'POST' }
  );

export const searchAll = (query: string) =>
  apiRequest<{
    users: Array<ApiUser & { profile?: { displayName?: string | null; avatar?: string | null } | null }>;
    pings: Array<ApiPing & { author: ApiUser & { profile?: { displayName?: string | null } | null } }>;
    circles: Array<{ id: string; name: string; description?: string | null; memberCount?: number }>;
  }>(`/search?q=${encodeURIComponent(query)}`);

export const searchUsers = (query: string) =>
  apiRequest<{ users: ApiUser[] }>(`/search?q=${encodeURIComponent(query)}&type=users`);

export const getChats = () => apiRequest<{ chats: ApiChat[] }>('/chats');

export const createChat = (userId: string) =>
  apiRequest<{ chat: ApiChat }>('/chats', {
    method: 'POST',
    body: JSON.stringify({ userId }),
  });

export const getCrews = () => apiRequest<{ crews: ApiChat[] }>('/crews');

export interface ApiDiscoverableCrew {
  id: string;
  groupName: string;
  groupImage?: string | null;
  description?: string | null;
  requiresApproval?: boolean;
  createdAt: string;
  _count: { members: number };
  createdBy?: {
    username: string;
    profile?: { displayName?: string | null; avatar?: string | null } | null;
  } | null;
}

export const getDiscoverableCrews = () =>
  apiRequest<{ crews: ApiDiscoverableCrew[] }>('/crews/discover');

export const getCrew = (crewId: string) =>
  apiRequest<{ crew: ApiChat; role: string }>(`/crews/${encodeURIComponent(crewId)}`);

export const createCrew = (name: string, userIds: string[], options: {
  description?: string;
  isPrivate?: boolean;
  requiresApproval?: boolean;
} = {}) =>
  apiRequest<{ crew: ApiChat }>('/crews', {
    method: 'POST',
    body: JSON.stringify({ name, userIds, ...options }),
  });

export const updateCrew = (crewId: string, data: {
  name?: string;
  description?: string;
  isPrivate?: boolean;
  requiresApproval?: boolean;
  groupImage?: string | null;
  rotateInvite?: boolean;
}) =>
  apiRequest<{ crew: ApiChat }>(`/crews/${encodeURIComponent(crewId)}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

export const leaveCrew = (crewId: string) =>
  apiRequest<{ success: boolean; transferredTo: string | null }>(`/crews/${encodeURIComponent(crewId)}`, {
    method: 'DELETE',
  });

export const getCrewMembers = (crewId: string) =>
  apiRequest<{ members: NonNullable<ApiChat['members']> }>(`/crews/${encodeURIComponent(crewId)}/members`);

export const addCrewMembers = (crewId: string, userIds: string[]) =>
  apiRequest<{ added: number }>(`/crews/${encodeURIComponent(crewId)}/members`, {
    method: 'POST',
    body: JSON.stringify({ userIds }),
  });

export const updateCrewMemberRole = (crewId: string, userId: string, role: 'admin' | 'member') =>
  apiRequest<{ member: { userId: string; role: string } }>(`/crews/${encodeURIComponent(crewId)}/members`, {
    method: 'PATCH',
    body: JSON.stringify({ userId, role }),
  });

export const removeCrewMember = (crewId: string, userId: string) =>
  apiRequest<{ success: boolean }>(`/crews/${encodeURIComponent(crewId)}/members?userId=${encodeURIComponent(userId)}`, {
    method: 'DELETE',
  });

export const joinCrew = (data: { inviteCode: string } | { crewId: string }) =>
  apiRequest<{ crewId: string; pending: boolean }>('/crews/join', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getCrewJoinRequests = (crewId: string) =>
  apiRequest<{ requests: ApiCrewJoinRequest[] }>(`/crews/${encodeURIComponent(crewId)}/requests`);

export const reviewCrewJoinRequest = (crewId: string, requestId: string, decision: 'approve' | 'decline') =>
  apiRequest<{ success: boolean }>(`/crews/${encodeURIComponent(crewId)}/requests`, {
    method: 'PATCH',
    body: JSON.stringify({ requestId, decision }),
  });

export const getCrewPolls = (crewId: string) =>
  apiRequest<{ polls: ApiCrewPoll[] }>(`/crews/${encodeURIComponent(crewId)}/polls`);

export const createCrewPoll = (crewId: string, data: {
  question: string;
  options: string[];
  allowsMultiple: boolean;
}) =>
  apiRequest<{ poll: ApiCrewPoll }>(`/crews/${encodeURIComponent(crewId)}/polls`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const voteCrewPoll = (crewId: string, pollId: string, optionIds: string[]) =>
  apiRequest<{ success: boolean }>(`/crews/${encodeURIComponent(crewId)}/polls/${encodeURIComponent(pollId)}/vote`, {
    method: 'PUT',
    body: JSON.stringify({ optionIds }),
  });

export const getCrewEvents = (crewId: string) =>
  apiRequest<{ events: ApiCrewEvent[] }>(`/crews/${encodeURIComponent(crewId)}/events`);

export const createCrewEvent = (crewId: string, data: {
  name: string;
  description?: string;
  location?: string;
  startTime: string;
  endTime?: string;
}) =>
  apiRequest<{ event: ApiCrewEvent }>(`/crews/${encodeURIComponent(crewId)}/events`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const respondToCrewEvent = (crewId: string, eventId: string, status: 'going' | 'interested' | 'not_going') =>
  apiRequest<{ attendance: { status: string } }>(
    `/crews/${encodeURIComponent(crewId)}/events/${encodeURIComponent(eventId)}/attend`,
    { method: 'PUT', body: JSON.stringify({ status }) }
  );

export const getMessages = (chatId: string) =>
  apiRequest<{ messages: ApiMessage[] }>(`/chats/${encodeURIComponent(chatId)}/messages`);

export const sendMessage = (
  chatId: string,
  data: {
    content: string;
    messageType?: 'text' | 'image' | 'video' | 'file';
    mediaUrl?: string;
    attachmentName?: string;
    isAnnouncement?: boolean;
  }
) =>
  apiRequest<{ message: ApiMessage }>(`/chats/${encodeURIComponent(chatId)}/messages`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const getChatCall = (chatId: string) =>
  apiRequest<{ call: ApiChatCall | null }>(`/chats/${encodeURIComponent(chatId)}/calls`);

export const getChatCallDetails = (chatId: string, callId: string) =>
  apiRequest<{ call: ApiChatCall; signals: ApiChatCallSignal[] }>(
    `/chats/${encodeURIComponent(chatId)}/calls/${encodeURIComponent(callId)}`
  );

export const getIncomingCalls = () =>
  apiRequest<{ calls: ApiIncomingCall[] }>('/calls/incoming');

export const startChatCall = (chatId: string, type: 'audio' | 'video', offer: { type: 'offer'; sdp: string }) =>
  apiRequest<{ call: ApiChatCall }>(`/chats/${encodeURIComponent(chatId)}/calls`, {
    method: 'POST',
    body: JSON.stringify({ type, offer }),
  });

export const answerChatCall = (chatId: string, callId: string, answer: { type: 'answer'; sdp: string }) =>
  apiRequest<{ call: Pick<ApiChatCall, 'id' | 'status'> }>(
    `/chats/${encodeURIComponent(chatId)}/calls/${encodeURIComponent(callId)}`,
    { method: 'PATCH', body: JSON.stringify({ action: 'accept', answer }) }
  );

export const finishChatCall = (chatId: string, callId: string, action: 'decline' | 'end') =>
  apiRequest<{ call: Pick<ApiChatCall, 'id' | 'status'> }>(
    `/chats/${encodeURIComponent(chatId)}/calls/${encodeURIComponent(callId)}`,
    { method: 'PATCH', body: JSON.stringify({ action }) }
  );

export const sendChatCallSignal = (chatId: string, callId: string, candidate: ApiChatCallSignal['payload']) =>
  apiRequest<{ signalId: string }>(
    `/chats/${encodeURIComponent(chatId)}/calls/${encodeURIComponent(callId)}/signals`,
    { method: 'POST', body: JSON.stringify(candidate) }
  );

export const getLiveRooms = () =>
  apiRequest<{ rooms: ApiLiveRoom[] }>('/rooms?live=true');

export const startLiveRoom = (data: { name: string; description?: string; category?: string; type: 'audio' | 'video' }) =>
  apiRequest<{ room: ApiLiveRoom; token: string; serverUrl: string }>('/rooms', {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const joinLiveRoom = (roomId: string) =>
  apiRequest<{
    room: ApiLiveRoom;
    token: string;
    serverUrl: string;
  }>(`/rooms/${encodeURIComponent(roomId)}/token`, { method: 'POST' });

export const getLiveRoomMessages = (roomId: string) =>
  apiRequest<{ messages: ApiLiveRoomMessage[] }>(
    `/rooms/${encodeURIComponent(roomId)}/messages`
  );

export const sendLiveRoomMessage = (roomId: string, content: string) =>
  apiRequest<{ message: ApiLiveRoomMessage }>(
    `/rooms/${encodeURIComponent(roomId)}/messages`,
    { method: 'POST', body: JSON.stringify({ content }) }
  );

export const endLiveRoom = (roomId: string) =>
  apiRequest<{ success: boolean }>(`/rooms/${encodeURIComponent(roomId)}/end`, { method: 'POST' });

export const leaveLiveRoom = (roomId: string) =>
  apiRequest<{ success: boolean }>(`/rooms/${encodeURIComponent(roomId)}/leave`, { method: 'POST' });

export const getLiveGuests = (roomId: string) =>
  apiRequest<{
    requests: ApiLiveGuestRequest[];
    speakers: ApiLiveStageParticipant[];
    myRequest: ApiLiveGuestRequest | null;
  }>(`/rooms/${encodeURIComponent(roomId)}/guests`);

export const updateLiveGuests = (
  roomId: string,
  data:
    | { action: 'request' }
    | { action: 'invite'; username: string }
    | { action: 'accept' | 'decline'; requestId: string }
    | { action: 'remove'; userId: string }
) =>
  apiRequest<{ success?: boolean; request?: ApiLiveGuestRequest }>(
    `/rooms/${encodeURIComponent(roomId)}/guests`,
    { method: 'POST', body: JSON.stringify(data) }
  );

export const getLiveModerationState = (roomId: string) =>
  apiRequest<{
    chatEnabled: boolean;
    participants: ApiLiveStageParticipant[];
    bannedParticipants: ApiLiveStageParticipant[];
  }>(`/rooms/${encodeURIComponent(roomId)}/moderation`);

export const moderateLiveRoom = (
  roomId: string,
  data: {
    action:
      | 'mute_audio'
      | 'unmute_audio'
      | 'kick'
      | 'ban'
      | 'unban'
      | 'mute_chat'
      | 'unmute_chat'
      | 'delete_message'
      | 'chat_on'
      | 'chat_off';
    targetId?: string;
    messageId?: string;
  }
) =>
  apiRequest<{ success: boolean }>(`/rooms/${encodeURIComponent(roomId)}/moderation`, {
    method: 'POST',
    body: JSON.stringify(data),
  });

export const reportLiveParticipant = (
  roomId: string,
  targetId: string,
  reason: 'harassment' | 'hate' | 'spam' | 'unsafe' | 'other'
) =>
  apiRequest<{ success: boolean }>(`/rooms/${encodeURIComponent(roomId)}/report`, {
    method: 'POST',
    body: JSON.stringify({ targetId, reason }),
  });

export const getLiveCoinWallet = () =>
  apiRequest<{
    balance: number;
    products: Array<{ productId: string; coins: number }>;
  }>('/live/coins');

export const sendLiveGift = (roomId: string, giftType: 'heart' | 'spark' | 'star') =>
  apiRequest<{
    gift: { id: string; giftType: string; coins: number };
    message: ApiLiveRoomMessage;
    balance: number;
  }>(
    `/rooms/${encodeURIComponent(roomId)}/gifts`,
    { method: 'POST', body: JSON.stringify({ giftType }) }
  );

export const getLiveReplay = (roomId: string) =>
  apiRequest<{ replay: ApiLiveReplay | null; live?: boolean }>(
    `/rooms/${encodeURIComponent(roomId)}/replay`
  );

export const startLiveReplay = (roomId: string) =>
  apiRequest<{ replay: ApiLiveReplay }>(
    `/rooms/${encodeURIComponent(roomId)}/replay`,
    { method: 'POST' }
  );

export const deleteLiveReplay = (roomId: string) =>
  apiRequest<{ success: boolean }>(`/rooms/${encodeURIComponent(roomId)}/replay`, {
    method: 'DELETE',
  });

export const updatePresence = (isOnline: boolean) =>
  apiRequest<{ success: boolean }>('/user/status', {
    method: 'PATCH',
    body: JSON.stringify({ isOnline }),
  });
