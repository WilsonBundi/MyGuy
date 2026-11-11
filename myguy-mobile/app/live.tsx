import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';

// Conditionally import LiveKit only on native platforms
let AudioSession: any, LiveKitRoom: any, useDataChannel: any, useLocalParticipant: any, useParticipants: any, useTracks: any, VideoTrack: any, Track: any;
let PurchasesStoreProduct: any;

if (Platform.OS !== 'web') {
  try {
    const livekitRuntime = require('../src/lib/livekit-runtime');
    AudioSession = livekitRuntime.AudioSession;
    LiveKitRoom = livekitRuntime.LiveKitRoom;
    useDataChannel = livekitRuntime.useDataChannel;
    useLocalParticipant = livekitRuntime.useLocalParticipant;
    useParticipants = livekitRuntime.useParticipants;
    useTracks = livekitRuntime.useTracks;
    VideoTrack = livekitRuntime.VideoTrack;
    Track = require('livekit-client').Track;
  } catch (e) {
    console.warn('LiveKit not available:', e);
  }
  try {
    PurchasesStoreProduct = require('react-native-purchases').PurchasesStoreProduct;
  } catch (e) {
    console.warn('Purchases not available:', e);
  }
}

import {
  getLiveCoinWallet,
  getLiveGuests,
  getLiveModerationState,
  getLiveRoomMessages,
  joinLiveRoom,
  leaveLiveRoom,
  moderateLiveRoom,
  reportLiveParticipant,
  sendLiveGift,
  sendLiveRoomMessage,
  startLiveReplay,
  startLiveRoom,
  updateLiveGuests,
  endLiveRoom,
  type ApiLiveRoom,
  type ApiLiveGuestRequest,
  type ApiLiveRoomMessage,
  type ApiLiveStageParticipant,
} from '../src/lib/api';

let buyLiveCoinProduct: any, getLiveCoinStoreProducts: any;
if (Platform.OS !== 'web') {
  try {
    const purchases = require('../src/lib/live-purchases');
    buyLiveCoinProduct = purchases.buyLiveCoinProduct;
    getLiveCoinStoreProducts = purchases.getLiveCoinStoreProducts;
  } catch (e) {
    console.warn('Live purchases not available:', e);
  }
}

type LiveSession = {
  room: ApiLiveRoom;
  token: string;
  serverUrl: string;
  isHost: boolean;
};

type LiveFilterPreset = 'none' | 'warm' | 'soft' | 'mono';

const categories = ['Community', 'Music', 'Learning', 'Everyday'];
const liveFilterPresets: { id: LiveFilterPreset; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'warm', label: 'Warm' },
  { id: 'soft', label: 'Soft' },
  { id: 'mono', label: 'Mono' },
];

export default function LiveScreen() {
  // Live streaming only works on native platforms (not web)
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.webMessageScreen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.webMessageContent}>
          <Ionicons name="radio" size={48} color="#b6f0dd" />
          <Text style={styles.webMessageTitle}>Live Streaming</Text>
          <Text style={styles.webMessageText}>
            Live streaming requires a development build. Please build the app to use this feature.
          </Text>
          <TouchableOpacity
            style={styles.webMessageButton}
            onPress={() => router.back()}
          >
            <Text style={styles.webMessageButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const params = useLocalSearchParams<{ roomId?: string }>();
  const roomId = typeof params.roomId === 'string' ? params.roomId : '';
  const { user } = useAuth();
  const [session, setSession] = useState<LiveSession | null>(null);
  const [audioReady, setAudioReady] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [streamType, setStreamType] = useState<'video' | 'audio'>('video');
  const [loading, setLoading] = useState(Boolean(roomId));
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [replayStarted, setReplayStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    let active = true;
    setLoading(true);
    joinLiveRoom(roomId)
      .then((result) => {
        if (active) setSession({ ...result, isHost: result.room.hostId === user?.id });
      })
      .catch((joinError) => {
        if (active) setError(joinError instanceof Error ? joinError.message : 'Could not join this live.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [roomId, user?.id]);

  useEffect(() => {
    if (!session) return;
    let mounted = true;
    setAudioReady(false);
    AudioSession.startAudioSession()
      .then(() => { if (mounted) setAudioReady(true); })
      .catch((audioError) => {
        if (mounted) setError(audioError instanceof Error ? audioError.message : 'Could not start the audio session.');
      });
    return () => {
      mounted = false;
      setAudioReady(false);
      void AudioSession.stopAudioSession();
    };
  }, [session?.room.id]);

  const startStream = async () => {
    const cleanTitle = title.trim();
    if (!cleanTitle || starting) {
      if (!cleanTitle) setError('Add a title so people know what this live is about.');
      return;
    }
    setStarting(true);
    setError(null);
    try {
      setReplayStarted(false);
      const result = await startLiveRoom({
        name: cleanTitle,
        category,
        type: streamType,
      });
      setSession({ ...result, isHost: true });
    } catch (startError) {
      setError(startError instanceof Error ? startError.message : 'Could not start your live.');
    } finally {
      setStarting(false);
    }
  };

  const exitStream = () => {
    if (!session || ending) return;
    Alert.alert(
      session.isHost ? 'End your live?' : 'Leave this live?',
      session.isHost
        ? 'Everyone watching will be disconnected.'
        : 'You can join again while the host is still live.',
      [
        { text: 'Keep watching', style: 'cancel' },
        {
          text: session.isHost ? 'End live' : 'Leave',
          style: 'destructive',
          onPress: () => { void closeSession(); },
        },
      ]
    );
  };

  const closeSession = async () => {
    if (!session || ending) return;
    const currentRoomId = session.room.id;
    const shouldOpenReplay = session.isHost && replayStarted;
    setEnding(true);
    setError(null);
    try {
      if (session.isHost) await endLiveRoom(session.room.id);
      else await leaveLiveRoom(session.room.id);
      setSession(null);
      if (shouldOpenReplay) {
        router.replace({ pathname: '/live-replay', params: { roomId: currentRoomId } });
      } else {
        router.back();
      }
    } catch (closeError) {
      setError(closeError instanceof Error ? closeError.message : 'Could not leave the live.');
    } finally {
      setEnding(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingScreen}>
        <StatusBar barStyle="light-content" />
        <ActivityIndicator size="large" color="#80d3bd" />
        <Text style={styles.loadingText}>Joining the live…</Text>
      </SafeAreaView>
    );
  }

  if (session) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar barStyle="light-content" />
        <LiveKitRoom
          serverUrl={session.serverUrl}
          token={session.token}
          connect={audioReady}
          audio={session.isHost}
          video={session.isHost && session.room.type === 'video'}
          options={{ adaptiveStream: true, dynacast: true }}
          onConnected={() => setError(null)}
          onError={(roomError) => setError(roomError.message)}
          onDisconnected={() => setError('The connection to this live has ended.')}
        >
          <LiveRoomContent
            session={session}
            userId={user?.id || ''}
            error={error}
            onError={setError}
            onExit={exitStream}
            ending={ending}
            onReplayStarted={() => setReplayStarted(true)}
          />
        </LiveKitRoom>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.setupScreen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.setupHeader}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={22} color="#f6f1ed" />
        </TouchableOpacity>
        <Text style={styles.setupHeading}>Start a live</Text>
        <View style={styles.closeButton} />
      </View>
      <KeyboardAvoidingView style={styles.setupBody} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.setupIcon}><Ionicons name="radio" size={27} color="#b6f0dd" /></View>
        <Text style={styles.setupTitle}>Bring your people together</Text>
        <Text style={styles.setupSubtitle}>Share a moment in real time. Your audience can join the conversation while you’re live.</Text>

        <Text style={styles.fieldLabel}>LIVE TITLE</Text>
        <TextInput
          accessibilityLabel="Live title"
          value={title}
          onChangeText={setTitle}
          placeholder="What would you like to talk about?"
          placeholderTextColor="#988f89"
          maxLength={100}
          style={styles.titleInput}
        />
        <Text style={styles.characterCount}>{title.length}/100</Text>

        <Text style={styles.fieldLabel}>CHOOSE A TOPIC</Text>
        <View style={styles.categoryList}>
          {categories.map((item) => (
            <TouchableOpacity
              key={item}
              accessibilityRole="button"
              accessibilityState={{ selected: category === item }}
              onPress={() => setCategory(item)}
              style={[styles.categoryChip, category === item && styles.categorySelected]}
            >
              <Text style={[styles.categoryText, category === item && styles.categoryTextSelected]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.fieldLabel}>BROADCAST STYLE</Text>
        <View style={styles.typeList}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: streamType === 'video' }}
            onPress={() => setStreamType('video')}
            style={[styles.typeCard, streamType === 'video' && styles.typeSelected]}
          >
            <Ionicons name="videocam-outline" size={21} color={streamType === 'video' ? '#b6f0dd' : '#c2b8b1'} />
            <Text style={[styles.typeTitle, streamType === 'video' && styles.typeTextSelected]}>Camera</Text>
            <Text style={styles.typeDescription}>Video and audio</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityState={{ selected: streamType === 'audio' }}
            onPress={() => setStreamType('audio')}
            style={[styles.typeCard, streamType === 'audio' && styles.typeSelected]}
          >
            <Ionicons name="mic-outline" size={21} color={streamType === 'audio' ? '#b6f0dd' : '#c2b8b1'} />
            <Text style={[styles.typeTitle, streamType === 'audio' && styles.typeTextSelected]}>Audio</Text>
            <Text style={styles.typeDescription}>Voice conversation</Text>
          </TouchableOpacity>
        </View>

        {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
        <View style={styles.safetyNote}>
          <Ionicons name="shield-checkmark-outline" size={17} color="#80d3bd" />
          <Text style={styles.safetyText}>Be respectful. You can end the live at any time.</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityState={{ disabled: starting || !title.trim() }}
          disabled={starting || !title.trim()}
          onPress={() => void startStream()}
          style={[styles.startButton, (!title.trim() || starting) && styles.disabledButton]}
        >
          {starting ? <ActivityIndicator color="#10221e" /> : <><Ionicons name="radio" size={18} color="#10221e" /><Text style={styles.startButtonText}>Start broadcasting</Text></>}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function LiveRoomContent({
  session,
  userId,
  error,
  onError,
  onExit,
  ending,
  onReplayStarted,
}: {
  session: LiveSession;
  userId: string;
  error: string | null;
  onError: (message: string | null) => void;
  onExit: () => void;
  ending: boolean;
  onReplayStarted: () => void;
}) {
  const tracks = useTracks([Track.Source.Camera]);
  const participants = useParticipants();
  const { localParticipant, isMicrophoneEnabled, isCameraEnabled } = useLocalParticipant();
  const [messages, setMessages] = useState<ApiLiveRoomMessage[]>([]);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [reaction, setReaction] = useState('');
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageList = useRef<FlatList<ApiLiveRoomMessage>>(null);
  const videoTrack = tracks.find((track) => track.participant.identity === session.room.hostId);
  const localCameraTrack = localParticipant.getTrackPublication(Track.Source.Camera)?.track;
  const [stageRequests, setStageRequests] = useState<ApiLiveGuestRequest[]>([]);
  const [stageSpeakers, setStageSpeakers] = useState<ApiLiveStageParticipant[]>([]);
  const [myStageRequest, setMyStageRequest] = useState<ApiLiveGuestRequest | null>(null);
  const [stageModalVisible, setStageModalVisible] = useState(false);
  const [inviteUsername, setInviteUsername] = useState('');
  const [guestActionPending, setGuestActionPending] = useState(false);
  const [moderationModalVisible, setModerationModalVisible] = useState(false);
  const [moderationTarget, setModerationTarget] = useState<ApiLiveStageParticipant | null>(null);
  const [moderationParticipants, setModerationParticipants] = useState<ApiLiveStageParticipant[]>([]);
  const [bannedParticipants, setBannedParticipants] = useState<ApiLiveStageParticipant[]>([]);
  const [chatEnabled, setChatEnabled] = useState(true);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [coinBalance, setCoinBalance] = useState(0);
  const [coinProducts, setCoinProducts] = useState<PurchasesStoreProduct[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [coinError, setCoinError] = useState<string | null>(null);
  const [buyingProductId, setBuyingProductId] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordingPending, setRecordingPending] = useState(false);
  const [activeFilter, setActiveFilter] = useState<LiveFilterPreset>('none');

  useEffect(() => {
    if (!session.isHost || session.room.type !== 'video') return;
    if (!localCameraTrack || localCameraTrack.kind !== Track.Kind.Video) return;

    const nativeTrack = localCameraTrack.mediaStreamTrack;
    const setNativeVideoEffect: unknown = Reflect.get(nativeTrack, '_setVideoEffect');
    if (typeof setNativeVideoEffect !== 'function') {
      onError('Live filters need the latest MyGuy development build. Rebuild the native app to enable them.');
      return;
    }

    try {
      setNativeVideoEffect.call(nativeTrack, activeFilter === 'none' ? null : activeFilter);
      onError(null);
    } catch (filterError) {
      onError(filterError instanceof Error ? filterError.message : 'Could not apply this live filter.');
    }

    return () => setNativeVideoEffect.call(nativeTrack, null);
  }, [activeFilter, isCameraEnabled, localCameraTrack, onError, session.isHost, session.room.type]);

  const receiveReaction = useCallback((message: { payload: Uint8Array }) => {
    const value = new TextDecoder().decode(message.payload);
    if (!['💚', '👏', '✨'].includes(value)) return;
    setReaction(value);
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    reactionTimer.current = setTimeout(() => setReaction(''), 1100);
  }, []);
  const { send: sendReaction } = useDataChannel('reaction', receiveReaction);

  const refreshGuests = useCallback(async () => {
    try {
      const result = await getLiveGuests(session.room.id);
      setStageRequests(result.requests);
      setStageSpeakers(result.speakers);
      setMyStageRequest(result.myRequest);
    } catch (loadError) {
      onError(loadError instanceof Error ? loadError.message : 'Could not load stage requests.');
    }
  }, [onError, session.room.id]);

  useEffect(() => {
    void refreshGuests();
    const timer = setInterval(() => { void refreshGuests(); }, 4000);
    return () => clearInterval(timer);
  }, [refreshGuests]);

  useEffect(() => {
    let mounted = true;
    let pending = false;
    const loadMessages = async () => {
      if (pending || !mounted) return;
      pending = true;
      try {
        const response = await getLiveRoomMessages(session.room.id);
        if (mounted) setMessages(response.messages);
      } catch (loadError) {
        if (mounted) onError(loadError instanceof Error ? loadError.message : 'Live chat is unavailable.');
      } finally {
        pending = false;
      }
    };
    void loadMessages();
    const timer = setInterval(() => { void loadMessages(); }, 2500);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [session.room.id, onError]);

  useEffect(() => () => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
  }, []);

  const sendMessage = async () => {
    const content = messageText.trim();
    if (!content || sending) return;
    setSending(true);
    onError(null);
    try {
      const response = await sendLiveRoomMessage(session.room.id, content);
      setMessages((current) => current.some((item) => item.id === response.message.id)
        ? current
        : [...current, response.message]);
      setMessageText('');
    } catch (sendError) {
      onError(sendError instanceof Error ? sendError.message : 'Could not send your message.');
    } finally {
      setSending(false);
    }
  };

  const react = async (emoji: string) => {
    try {
      await sendReaction(new TextEncoder().encode(emoji), { topic: 'reaction', reliable: false });
    } catch (reactionError) {
      onError(reactionError instanceof Error ? reactionError.message : 'Could not send your reaction.');
    }
  };

  const guestAction = async (
    action:
      | { action: 'request' }
      | { action: 'invite'; username: string }
      | { action: 'accept' | 'decline'; requestId: string }
      | { action: 'remove'; userId: string }
  ) => {
    if (guestActionPending) return;
    setGuestActionPending(true);
    try {
      await updateLiveGuests(session.room.id, action);
      setInviteUsername('');
      await refreshGuests();
    } catch (guestError) {
      onError(guestError instanceof Error ? guestError.message : 'Could not update the stage.');
    } finally {
      setGuestActionPending(false);
    }
  };

  const openModeration = async () => {
    try {
      const state = await getLiveModerationState(session.room.id);
      setModerationParticipants(state.participants);
      setBannedParticipants(state.bannedParticipants);
      setChatEnabled(state.chatEnabled);
      setModerationTarget(null);
      setModerationModalVisible(true);
    } catch (moderationError) {
      onError(moderationError instanceof Error ? moderationError.message : 'Could not open moderation tools.');
    }
  };

  const applyModeration = async (
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
      | 'chat_off',
    targetId?: string,
    messageId?: string
  ) => {
    try {
      await moderateLiveRoom(session.room.id, { action, targetId, messageId });
      if (action === 'chat_on' || action === 'chat_off') setChatEnabled(action === 'chat_on');
      if (action === 'delete_message' && messageId) {
        setMessages((current) => current.filter((message) => message.id !== messageId));
      }
      const state = await getLiveModerationState(session.room.id);
      setModerationParticipants(state.participants);
      setBannedParticipants(state.bannedParticipants);
      setChatEnabled(state.chatEnabled);
      setModerationTarget(null);
    } catch (moderationError) {
      onError(moderationError instanceof Error ? moderationError.message : 'Could not apply moderation action.');
    }
  };

  const openWallet = async () => {
    setWalletModalVisible(true);
    setWalletLoading(true);
    setCoinError(null);
    try {
      const wallet = await getLiveCoinWallet();
      setCoinBalance(wallet.balance);
    } catch (walletError) {
      setCoinError(walletError instanceof Error ? walletError.message : 'Could not load your coin balance.');
    }
    try {
      setCoinProducts(await getLiveCoinStoreProducts(userId));
    } catch (storeError) {
      setCoinError(storeError instanceof Error ? storeError.message : 'Coin packages are not available.');
      setCoinProducts([]);
    } finally {
      setWalletLoading(false);
    }
  };

  const purchaseCoins = async (product: PurchasesStoreProduct) => {
    if (buyingProductId) return;
    setBuyingProductId(product.identifier);
    setCoinError(null);
    try {
      await buyLiveCoinProduct(userId, product.identifier);
      setCoinError('Purchase complete. Coins will appear after the store confirms it.');
      setTimeout(() => {
        void getLiveCoinWallet()
          .then((wallet) => setCoinBalance(wallet.balance))
          .catch((refreshError) => {
            setCoinError(refreshError instanceof Error ? refreshError.message : 'Could not refresh your coin balance.');
          });
      }, 2500);
    } catch (purchaseError) {
      setCoinError(purchaseError instanceof Error ? purchaseError.message : 'Purchase could not be completed.');
    } finally {
      setBuyingProductId(null);
    }
  };

  const sendGift = async (giftType: 'heart' | 'spark' | 'star') => {
    try {
      const result = await sendLiveGift(session.room.id, giftType);
      setCoinBalance(result.balance);
      setMessages((current) => current.some((message) => message.id === result.message.id)
        ? current
        : [...current, result.message]);
      setWalletModalVisible(false);
    } catch (giftError) {
      setCoinError(giftError instanceof Error ? giftError.message : 'Could not send this gift.');
    }
  };

  const requestRecording = () => {
    if (recording || recordingPending) return;
    Alert.alert(
      'Save a private replay?',
      'This records the host and co-hosts. The replay is private to you and is automatically removed after 30 days.',
      [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Start recording',
          onPress: () => {
            setRecordingPending(true);
            void startLiveReplay(session.room.id)
              .then(() => {
                setRecording(true);
                onReplayStarted();
              })
              .catch((recordingError) => {
                onError(recordingError instanceof Error ? recordingError.message : 'Could not start replay recording.');
              })
              .finally(() => {
                setRecordingPending(false);
              });
          },
        },
      ]
    );
  };

  const toggleMicrophone = async () => {
    try {
      await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
      onError(null);
    } catch (toggleError) {
      onError(toggleError instanceof Error ? toggleError.message : 'Could not change microphone settings.');
    }
  };

  const toggleCamera = async () => {
    try {
      await localParticipant.setCameraEnabled(!isCameraEnabled);
      onError(null);
    } catch (toggleError) {
      onError(toggleError instanceof Error ? toggleError.message : 'Could not change camera settings.');
    }
  };

  const viewerCount = Math.max(0, participants.length - 1);
  const hostName = session.room.host.profile?.displayName || session.room.host.username;
  const myPendingRequest = myStageRequest?.status === 'pending';
  const myInvitation = myStageRequest?.status === 'invited';
  const showLiveFilters = session.isHost && session.room.type === 'video' && isCameraEnabled;

  return (
    <KeyboardAvoidingView style={styles.liveRoom} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.broadcast}>
        {videoTrack ? (
          <VideoTrack trackRef={videoTrack} style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} objectFit="cover" />
        ) : (
          <View style={styles.audioStage}>
            <View style={styles.hostAvatar}><Ionicons name={session.room.type === 'audio' ? 'mic' : 'person'} size={34} color="#b6f0dd" /></View>
            <Text style={styles.audioHostName}>{hostName}</Text>
            <Text style={styles.audioStatus}>{session.room.type === 'audio' ? 'VOICE LIVE' : 'Connecting camera…'}</Text>
          </View>
        )}
        <View style={styles.broadcastShade} />
        <View style={styles.liveTop}>
          <View style={styles.liveNowPill}><View style={styles.liveBadgeDot} /><Text style={styles.liveNowText}>LIVE</Text></View>
          <View style={styles.viewersPill}><Ionicons name="eye-outline" size={16} color="#ffffff" /><Text style={styles.viewersText}>{viewerCount}</Text></View>
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Leave live" onPress={onExit} style={styles.leaveButton} disabled={ending}>
            {ending ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name="close" size={21} color="#ffffff" />}
          </TouchableOpacity>
        </View>
        <View style={[styles.broadcastTitle, showLiveFilters && styles.broadcastTitleWithFilters]}>
          <Text style={styles.broadcastName} numberOfLines={2}>{session.room.name}</Text>
          <Text style={styles.broadcastHost}>with {hostName}{session.room.category ? ` · ${session.room.category}` : ''}</Text>
        </View>
        {!!reaction && (
          <Text
            accessibilityLabel="Live reaction"
            style={[styles.reactionFloat, showLiveFilters && styles.reactionFloatWithFilters]}
          >
            {reaction}
          </Text>
        )}
        {showLiveFilters && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.liveFilterScroll}>
            <View style={styles.liveFilterRow}>
              {liveFilterPresets.map((preset) => (
                <TouchableOpacity
                  key={preset.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: activeFilter === preset.id }}
                  onPress={() => setActiveFilter(preset.id)}
                  style={[styles.liveFilterChip, activeFilter === preset.id && styles.liveFilterChipSelected]}
                >
                  <Text style={[styles.liveFilterText, activeFilter === preset.id && styles.liveFilterTextSelected]}>
                    {preset.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        )}
        {session.isHost && (
          <View style={styles.hostControls}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel={isMicrophoneEnabled ? 'Mute microphone' : 'Unmute microphone'} style={styles.controlButton} onPress={() => void toggleMicrophone()}>
              <Ionicons name={isMicrophoneEnabled ? 'mic' : 'mic-off'} size={20} color="#ffffff" />
            </TouchableOpacity>
            {session.room.type === 'video' && (
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'} style={styles.controlButton} onPress={() => void toggleCamera()}>
                <Ionicons name={isCameraEnabled ? 'videocam' : 'videocam-off'} size={20} color="#ffffff" />
              </TouchableOpacity>
            )}
              <TouchableOpacity accessibilityRole="button" accessibilityLabel={recording ? 'Recording replay' : 'Record replay'} style={[styles.controlButton, recording && styles.recordingButton]} onPress={requestRecording} disabled={recordingPending || recording}>
                {recordingPending ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name={recording ? 'radio-button-on' : 'recording-outline'} size={19} color="#ffffff" />}
            </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="End live" style={styles.endLiveButton} onPress={onExit}>
                <Ionicons name="stop-circle-outline" size={17} color="#ffffff" /><Text style={styles.endLiveText}>End live</Text>
              </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.chatArea}>
        <View style={styles.chatHeading}>
          <View>
            <Text style={styles.chatTitle}>Live conversation</Text>
            <Text style={styles.chatCount}>{viewerCount} watching</Text>
          </View>
          <View style={styles.liveTools}>
            {session.isHost ? (
              <>
                <TouchableOpacity accessibilityRole="button" onPress={() => setStageModalVisible(true)} style={styles.toolButton}>
                  <Ionicons name="people-outline" size={13} color="#b6f0dd" />
                  <Text style={styles.toolButtonText}>Stage{stageRequests.length ? ` · ${stageRequests.length}` : ''}</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" onPress={() => void openModeration()} style={styles.toolButton}>
                  <Ionicons name="shield-checkmark-outline" size={13} color="#b6f0dd" />
                  <Text style={styles.toolButtonText}>Safety</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity accessibilityRole="button" onPress={() => setStageModalVisible(true)} style={styles.toolButton}>
                <Ionicons name={myInvitation ? 'person-add' : 'mic-outline'} size={13} color="#b6f0dd" />
                <Text style={styles.toolButtonText}>{myInvitation ? 'Stage invite' : myPendingRequest ? 'Requested' : 'Join stage'}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
        {error && <Text accessibilityRole="alert" style={styles.chatError}>{error}</Text>}
        <FlatList
          ref={messageList}
          data={messages}
          keyExtractor={(item) => item.id}
          onContentSizeChange={() => messageList.current?.scrollToEnd({ animated: true })}
          contentContainerStyle={styles.chatMessages}
          ListEmptyComponent={<Text style={styles.chatEmpty}>Say hello and join the conversation.</Text>}
          renderItem={({ item }) => (
            <Text
              style={styles.chatMessage}
              onLongPress={() => {
                if (session.isHost) {
                  Alert.alert('Moderate message', 'Remove this message from the live conversation?', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: () => { void applyModeration('delete_message', undefined, item.id); } },
                  ]);
                } else if (item.user.id !== userId) {
                  Alert.alert('Report participant', 'Report this live message for review?', [
                    { text: 'Cancel', style: 'cancel' },
                    {
                      text: 'Report',
                      style: 'destructive',
                      onPress: () => {
                        void reportLiveParticipant(session.room.id, item.user.id, 'harassment')
                          .then(() => onError(null))
                          .catch((reportError) => onError(reportError instanceof Error ? reportError.message : 'Could not submit the report.'));
                      },
                    },
                  ]);
                }
              }}
            >
              <Text style={styles.chatUsername}>{item.user.profile?.displayName || item.user.username}</Text>
              {'  '}{item.content}
            </Text>
          )}
        />
        <View style={styles.chatComposer}>
          {!session.isHost && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel={`Buy coins or send a gift. Balance ${coinBalance}`}
              onPress={() => void openWallet()}
              style={styles.giftButton}
            >
              <Ionicons name="gift-outline" size={18} color="#f7d88a" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Send appreciation"
            onPress={() => void react('💚')}
            style={styles.reactionButton}
          >
            <Ionicons name="heart" size={19} color="#8bd9c3" />
          </TouchableOpacity>
          <TextInput
            accessibilityLabel="Write a live chat message"
            value={messageText}
            onChangeText={setMessageText}
            editable={session.isHost || chatEnabled}
            placeholder={chatEnabled || session.isHost ? 'Add to the conversation…' : 'Live chat is paused'}
            placeholderTextColor="#8f8984"
            maxLength={300}
            onSubmitEditing={() => void sendMessage()}
            returnKeyType="send"
            style={styles.chatInput}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Send live chat message"
            disabled={!messageText.trim() || sending || (!session.isHost && !chatEnabled)}
            onPress={() => void sendMessage()}
            style={[styles.chatSend, (!messageText.trim() || sending) && styles.disabledButton]}
          >
            {sending ? <ActivityIndicator size="small" color="#10221e" /> : <Ionicons name="arrow-up" size={19} color="#10221e" />}
          </TouchableOpacity>
        </View>
        {session.isHost && <Text style={styles.hostHint}>{chatEnabled ? 'Your audience can chat while you’re live.' : 'Live chat is paused.'}</Text>}
      </View>

      <Modal visible={stageModalVisible} transparent animationType="slide" onRequestClose={() => setStageModalVisible(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View><Text style={styles.modalTitle}>Live stage</Text><Text style={styles.modalSubtitle}>Host plus up to three co-hosts</Text></View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close stage" onPress={() => setStageModalVisible(false)} style={styles.modalClose}><Ionicons name="close" size={20} color="#f5eee8" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {session.isHost ? (
              <>
                <View style={styles.inviteRow}>
                  <TextInput accessibilityLabel="Guest username" value={inviteUsername} onChangeText={setInviteUsername} placeholder="Invite by username" placeholderTextColor="#8f8984" autoCapitalize="none" style={styles.inviteInput} />
                  <TouchableOpacity accessibilityRole="button" disabled={!inviteUsername.trim() || guestActionPending} onPress={() => void guestAction({ action: 'invite', username: inviteUsername.trim() })} style={styles.inviteButton}>
                    <Text style={styles.inviteButtonText}>Invite</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.modalSection}>STAGE REQUESTS</Text>
                {stageRequests.filter((item) => item.status === 'pending').map((item) => (
                  <View key={item.id} style={styles.personRow}>
                    <Text numberOfLines={1} style={styles.personName}>{item.user?.profile?.displayName || item.user?.username || 'MyGuy member'}</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={() => void guestAction({ action: 'accept', requestId: item.id })} style={styles.smallAction}><Text style={styles.smallActionText}>Accept</Text></TouchableOpacity>
                    <TouchableOpacity accessibilityRole="button" onPress={() => void guestAction({ action: 'decline', requestId: item.id })} style={styles.smallDismiss}><Text style={styles.smallDismissText}>Decline</Text></TouchableOpacity>
                  </View>
                ))}
                {!stageRequests.some((item) => item.status === 'pending') && <Text style={styles.modalEmpty}>No one is waiting to join the stage.</Text>}
                <Text style={styles.modalSection}>ON STAGE · {stageSpeakers.length}/3</Text>
                {stageSpeakers.map((speaker) => (
                  <View key={speaker.id} style={styles.personRow}>
                    <Text numberOfLines={1} style={styles.personName}>{speaker.user.profile?.displayName || speaker.user.username}</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={() => void guestAction({ action: 'remove', userId: speaker.id })} style={styles.smallDismiss}><Text style={styles.smallDismissText}>Remove</Text></TouchableOpacity>
                  </View>
                ))}
                {!stageSpeakers.length && <Text style={styles.modalEmpty}>Invite a guest or accept a request to bring someone on stage.</Text>}
              </>
            ) : (
              <>
                <Text style={styles.modalBody}>
                  {myInvitation
                    ? 'The host invited you to join the live stage. Your microphone and camera may become available after you accept.'
                    : myPendingRequest
                      ? 'Your request is with the host. You can cancel by closing this panel.'
                      : 'Ask the host to bring you on stage. MyGuy allows up to three co-hosts at a time.'}
                </Text>
                {myInvitation ? (
                  <View style={styles.inviteRow}>
                    <TouchableOpacity accessibilityRole="button" onPress={() => void guestAction({ action: 'accept', requestId: myStageRequest!.id })} style={styles.inviteButton}>
                      <Text style={styles.inviteButtonText}>Accept invite</Text>
                    </TouchableOpacity>
                    <TouchableOpacity accessibilityRole="button" onPress={() => void guestAction({ action: 'decline', requestId: myStageRequest!.id })} style={styles.smallDismiss}>
                      <Text style={styles.smallDismissText}>Decline</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity
                    accessibilityRole="button"
                    disabled={guestActionPending || myPendingRequest}
                    onPress={() => void guestAction({ action: 'request' })}
                    style={[styles.inviteButton, (guestActionPending || myPendingRequest) && styles.disabledButton]}
                  >
                    <Text style={styles.inviteButtonText}>{myPendingRequest ? 'Request sent' : 'Request to join stage'}</Text>
                  </TouchableOpacity>
                )}
                {stageSpeakers.length > 0 && <Text style={styles.modalSubtitle}>On stage: {stageSpeakers.map((speaker) => speaker.user.profile?.displayName || speaker.user.username).join(', ')}</Text>}
              </>
            )}
            {guestActionPending && <ActivityIndicator color="#8bd9c3" style={styles.modalLoader} />}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={moderationModalVisible} transparent animationType="slide" onRequestClose={() => setModerationModalVisible(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View><Text style={styles.modalTitle}>{moderationTarget ? 'Participant controls' : 'Safety controls'}</Text><Text style={styles.modalSubtitle}>Host-only live moderation</Text></View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close safety controls" onPress={() => { setModerationTarget(null); setModerationModalVisible(false); }} style={styles.modalClose}><Ionicons name="close" size={20} color="#f5eee8" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            {moderationTarget ? (
              <>
                <TouchableOpacity accessibilityRole="button" onPress={() => setModerationTarget(null)} style={styles.backToList}><Ionicons name="arrow-back" size={15} color="#b6f0dd" /><Text style={styles.smallActionText}>All participants</Text></TouchableOpacity>
                <Text style={styles.personName}>{moderationTarget.user.profile?.displayName || moderationTarget.user.username}</Text>
                {moderationTarget.role === 'speaker' && (
                  <TouchableOpacity accessibilityRole="button" onPress={() => void applyModeration(moderationTarget.publishingMuted ? 'unmute_audio' : 'mute_audio', moderationTarget.id)} style={styles.moderationAction}>
                    <Text style={styles.moderationActionText}>{moderationTarget.publishingMuted ? 'Allow microphone and camera' : 'Mute microphone and camera'}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity accessibilityRole="button" onPress={() => void applyModeration(moderationTarget.chatMutedUntil && new Date(moderationTarget.chatMutedUntil) > new Date() ? 'unmute_chat' : 'mute_chat', moderationTarget.id)} style={styles.moderationAction}>
                  <Text style={styles.moderationActionText}>{moderationTarget.chatMutedUntil && new Date(moderationTarget.chatMutedUntil) > new Date() ? 'Unmute live chat' : 'Mute chat for 15 minutes'}</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" onPress={() => void applyModeration('kick', moderationTarget.id)} style={styles.moderationAction}>
                  <Text style={styles.moderationActionText}>Remove for 1 minute</Text>
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" onPress={() => void applyModeration('ban', moderationTarget.id)} style={[styles.moderationAction, styles.dangerAction]}>
                  <Text style={styles.dangerActionText}>Ban from this live</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity accessibilityRole="button" onPress={() => void applyModeration(chatEnabled ? 'chat_off' : 'chat_on')} style={styles.moderationAction}>
                  <Text style={styles.moderationActionText}>{chatEnabled ? 'Pause audience chat' : 'Resume audience chat'}</Text>
                </TouchableOpacity>
                <Text style={styles.modalSection}>IN THIS LIVE</Text>
                {moderationParticipants.filter((participant) => participant.id !== session.room.hostId).map((participant) => (
                  <TouchableOpacity key={participant.id} accessibilityRole="button" onPress={() => setModerationTarget(participant)} style={styles.personRow}>
                    <Text numberOfLines={1} style={styles.personName}>{participant.user.profile?.displayName || participant.user.username}</Text>
                    <Text style={styles.personRole}>{participant.role}</Text>
                    <Ionicons name="chevron-forward" size={16} color="#978c82" />
                  </TouchableOpacity>
                ))}
                {!moderationParticipants.some((participant) => participant.id !== session.room.hostId) && <Text style={styles.modalEmpty}>No other participants are here yet.</Text>}
                {!!bannedParticipants.length && <Text style={styles.modalSection}>BANNED FROM THIS LIVE</Text>}
                {bannedParticipants.map((participant) => (
                  <View key={participant.id} style={styles.personRow}>
                    <Text numberOfLines={1} style={styles.personName}>{participant.user.profile?.displayName || participant.user.username}</Text>
                    <TouchableOpacity accessibilityRole="button" onPress={() => void applyModeration('unban', participant.id)} style={styles.smallAction}><Text style={styles.smallActionText}>Unban</Text></TouchableOpacity>
                  </View>
                ))}
              </>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal visible={walletModalVisible} transparent animationType="slide" onRequestClose={() => setWalletModalVisible(false)}>
        <View style={styles.modalScrim}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View><Text style={styles.modalTitle}>Live gifts</Text><Text style={styles.modalSubtitle}>Balance · {coinBalance} coins</Text></View>
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close gifts" onPress={() => setWalletModalVisible(false)} style={styles.modalClose}><Ionicons name="close" size={20} color="#f5eee8" /></TouchableOpacity>
            </View>
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalSection}>SEND A THANK-YOU</Text>
            <View style={styles.giftList}>
              {([['heart', '💚', 'Heart', 5], ['spark', '✨', 'Spark', 10], ['star', '⭐', 'Star', 25]] as const).map(([giftType, emoji, label, cost]) => (
                <TouchableOpacity key={giftType} accessibilityRole="button" disabled={coinBalance < cost} onPress={() => void sendGift(giftType)} style={[styles.giftOption, coinBalance < cost && styles.disabledButton]}>
                  <Text style={styles.giftEmoji}>{emoji}</Text><Text style={styles.giftLabel}>{label}</Text><Text style={styles.giftCost}>{cost} coins</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.modalSection}>GET MORE COINS</Text>
            {coinProducts.map((product) => {
              const amount = product.identifier.endsWith('.100') ? 100 : product.identifier.endsWith('.550') ? 550 : 1200;
              return (
                <TouchableOpacity key={product.identifier} accessibilityRole="button" disabled={Boolean(buyingProductId)} onPress={() => void purchaseCoins(product)} style={styles.productOption}>
                  <Text style={styles.productAmount}>{amount} coins</Text>
                  {buyingProductId === product.identifier ? <ActivityIndicator color="#8bd9c3" /> : <Text style={styles.productPrice}>{product.priceString}</Text>}
                </TouchableOpacity>
              );
            })}
            {walletLoading && <ActivityIndicator color="#8bd9c3" style={styles.modalLoader} />}
            {coinError && <Text accessibilityRole="alert" style={styles.modalError}>{coinError}</Text>}
            <Text style={styles.walletDisclaimer}>Coins are digital gifts for this app and are not redeemable for cash or payouts.</Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#100f0e' },
  loadingScreen: { flex: 1, backgroundColor: '#100f0e', alignItems: 'center', justifyContent: 'center' },
  loadingText: { color: '#e7e1db', fontSize: 13, marginTop: 13 },
  setupScreen: { flex: 1, backgroundColor: '#151210' },
  setupHeader: { minHeight: 54, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#342c26' },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  setupHeading: { color: '#f5eee8', fontSize: 16, fontWeight: '800' },
  setupBody: { flex: 1, paddingHorizontal: 23, paddingTop: 28 },
  setupIcon: { width: 54, height: 54, borderRadius: 18, backgroundColor: '#183b36', alignItems: 'center', justifyContent: 'center' },
  setupTitle: { color: '#f7f2ed', fontSize: 23, lineHeight: 29, fontWeight: '900', marginTop: 18 },
  setupSubtitle: { color: '#c2b8b1', fontSize: 13, lineHeight: 20, marginTop: 7, marginBottom: 24 },
  fieldLabel: { color: '#a6d3c3', fontSize: 9, fontWeight: '900', letterSpacing: 1.2, marginTop: 13, marginBottom: 8 },
  titleInput: { minHeight: 50, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: '#403831', backgroundColor: '#211c19', color: '#f5eee8', fontSize: 14 },
  characterCount: { alignSelf: 'flex-end', color: '#91877f', fontSize: 10, marginTop: 5 },
  categoryList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: '#211c19', borderWidth: 1, borderColor: '#403831' },
  categorySelected: { backgroundColor: '#183b36', borderColor: '#398c78' },
  categoryText: { color: '#c2b8b1', fontSize: 11, fontWeight: '700' },
  categoryTextSelected: { color: '#b6f0dd' },
  typeList: { flexDirection: 'row', gap: 10 },
  typeCard: { flex: 1, padding: 13, borderRadius: 14, backgroundColor: '#211c19', borderWidth: 1, borderColor: '#403831' },
  typeSelected: { backgroundColor: '#183b36', borderColor: '#398c78' },
  typeTitle: { color: '#f5eee8', fontSize: 13, fontWeight: '800', marginTop: 8 },
  typeTextSelected: { color: '#b6f0dd' },
  typeDescription: { color: '#a79d95', fontSize: 10, marginTop: 3 },
  safetyNote: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20 },
  safetyText: { flex: 1, color: '#b7ada4', fontSize: 11, lineHeight: 16 },
  errorText: { color: '#ffaaa3', fontSize: 12, lineHeight: 17, marginTop: 12 },
  startButton: { minHeight: 50, marginTop: 17, borderRadius: 15, backgroundColor: '#8bd9c3', flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  startButtonText: { color: '#10221e', fontSize: 14, fontWeight: '900' },
  disabledButton: { opacity: 0.5 },
  liveRoom: { flex: 1, backgroundColor: '#151210' },
  broadcast: { height: '53%', minHeight: 290, maxHeight: 470, position: 'relative', overflow: 'hidden', backgroundColor: '#1c2623' },
  audioStage: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', backgroundColor: '#183b36' },
  hostAvatar: { width: 84, height: 84, borderRadius: 28, backgroundColor: '#24574e', alignItems: 'center', justifyContent: 'center' },
  audioHostName: { color: '#ffffff', fontSize: 17, fontWeight: '800', marginTop: 13 },
  audioStatus: { color: '#b6f0dd', fontSize: 9, fontWeight: '900', letterSpacing: 1.4, marginTop: 7 },
  broadcastShade: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 12, 11, 0.16)' },
  liveTop: { position: 'absolute', top: 10, left: 15, right: 15, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveNowPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: '#a63732' },
  liveBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' },
  liveNowText: { color: '#ffffff', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  viewersPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12, backgroundColor: 'rgba(18,20,19,0.72)' },
  viewersText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  leaveButton: { width: 35, height: 35, marginLeft: 'auto', alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: 'rgba(18,20,19,0.72)' },
  broadcastTitle: { position: 'absolute', left: 16, right: 14, bottom: 17 },
  broadcastTitleWithFilters: { bottom: 96 },
  broadcastName: { color: '#ffffff', fontSize: 19, lineHeight: 24, fontWeight: '900' },
  broadcastHost: { color: '#e1e8e4', fontSize: 11, marginTop: 4 },
  reactionFloat: { position: 'absolute', right: 26, bottom: 73, fontSize: 32 },
  reactionFloatWithFilters: { bottom: 112 },
  liveFilterScroll: { position: 'absolute', left: 12, right: 12, bottom: 57, flexGrow: 0 },
  liveFilterRow: { flexDirection: 'row', gap: 6 },
  liveFilterChip: { paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)', backgroundColor: 'rgba(19,24,22,0.72)' },
  liveFilterChipSelected: { borderColor: '#8bd9c3', backgroundColor: 'rgba(24,59,54,0.92)' },
  liveFilterText: { color: '#ffffff', fontSize: 10, fontWeight: '700' },
  liveFilterTextSelected: { color: '#b6f0dd' },
  hostControls: { position: 'absolute', right: 12, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  controlButton: { width: 36, height: 36, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(19,24,22,0.75)' },
  recordingButton: { backgroundColor: '#a63732' },
  endLiveButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, height: 36, borderRadius: 13, backgroundColor: '#a63732' },
  endLiveText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  chatArea: { flex: 1, paddingHorizontal: 15, paddingTop: 14, paddingBottom: 7 },
  chatHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 9, borderBottomWidth: 1, borderBottomColor: '#39312a' },
  chatTitle: { color: '#f5eee8', fontSize: 14, fontWeight: '800' },
  chatCount: { color: '#a89d94', fontSize: 10, fontWeight: '700' },
  liveTools: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  toolButton: { minHeight: 31, paddingHorizontal: 8, borderRadius: 11, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#20322e' },
  toolButtonText: { color: '#c4e9dc', fontSize: 9, fontWeight: '800' },
  chatMessages: { paddingTop: 10, paddingBottom: 8 },
  chatEmpty: { color: '#93887f', fontSize: 11, paddingVertical: 13 },
  chatMessage: { color: '#e8e0da', fontSize: 12, lineHeight: 18, paddingVertical: 3 },
  chatUsername: { color: '#9ddbc8', fontWeight: '800' },
  chatError: { color: '#ffaaa3', fontSize: 10, paddingVertical: 6 },
  chatComposer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#39312a' },
  reactionButton: { width: 38, height: 41, borderRadius: 14, backgroundColor: '#183b36', alignItems: 'center', justifyContent: 'center' },
  giftButton: { width: 38, height: 41, borderRadius: 14, backgroundColor: '#3c3020', alignItems: 'center', justifyContent: 'center' },
  chatInput: { flex: 1, minHeight: 43, maxHeight: 95, borderRadius: 14, borderWidth: 1, borderColor: '#403831', backgroundColor: '#211c19', paddingHorizontal: 13, color: '#f5eee8', fontSize: 12 },
  chatSend: { width: 41, height: 41, borderRadius: 14, backgroundColor: '#8bd9c3', alignItems: 'center', justifyContent: 'center' },
  hostHint: { color: '#92887f', fontSize: 9, textAlign: 'center', paddingTop: 6 },
  modalScrim: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalCard: { maxHeight: '88%', paddingHorizontal: 19, paddingTop: 18, paddingBottom: 26, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: '#201b18' },
  modalScroll: { flexGrow: 0, flexShrink: 1 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  modalTitle: { color: '#f5eee8', fontSize: 19, fontWeight: '900' },
  modalSubtitle: { color: '#a99e95', fontSize: 11, lineHeight: 17, marginTop: 3 },
  modalClose: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#342c26' },
  modalSection: { color: '#a6d3c3', fontSize: 9, fontWeight: '900', letterSpacing: 1.1, marginTop: 18, marginBottom: 8 },
  inviteRow: { flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 5 },
  inviteInput: { flex: 1, minHeight: 44, paddingHorizontal: 12, borderWidth: 1, borderColor: '#403831', borderRadius: 13, backgroundColor: '#151210', color: '#f5eee8', fontSize: 12 },
  inviteButton: { minHeight: 42, paddingHorizontal: 15, borderRadius: 13, alignItems: 'center', justifyContent: 'center', backgroundColor: '#8bd9c3' },
  inviteButtonText: { color: '#10221e', fontSize: 11, fontWeight: '900' },
  personRow: { minHeight: 43, flexDirection: 'row', alignItems: 'center', gap: 7, borderBottomWidth: 1, borderBottomColor: '#382f28' },
  personName: { flex: 1, color: '#f0e9e3', fontSize: 12, fontWeight: '700' },
  personRole: { color: '#a89d94', fontSize: 10, marginRight: 4 },
  smallAction: { minHeight: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, borderRadius: 10, backgroundColor: '#183b36' },
  smallActionText: { color: '#b6f0dd', fontSize: 10, fontWeight: '800' },
  smallDismiss: { minHeight: 30, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 9, borderRadius: 10, backgroundColor: '#342c26' },
  smallDismissText: { color: '#d2c6bd', fontSize: 10, fontWeight: '700' },
  modalEmpty: { color: '#a99e95', fontSize: 11, lineHeight: 17, paddingVertical: 6 },
  modalBody: { color: '#ddd4cd', fontSize: 12, lineHeight: 19, marginVertical: 8 },
  modalLoader: { marginTop: 12 },
  backToList: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  moderationAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 12, marginTop: 8, borderRadius: 12, backgroundColor: '#302923' },
  moderationActionText: { color: '#eee7e0', fontSize: 12, fontWeight: '700' },
  dangerAction: { backgroundColor: '#512b29' },
  dangerActionText: { color: '#ffb5ae', fontSize: 12, fontWeight: '800' },
  giftList: { flexDirection: 'row', gap: 8 },
  giftOption: { flex: 1, minHeight: 86, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#342c26' },
  giftEmoji: { fontSize: 21 },
  giftLabel: { color: '#f5eee8', fontSize: 11, fontWeight: '800', marginTop: 5 },
  giftCost: { color: '#c5b7aa', fontSize: 9, marginTop: 3 },
  productOption: { minHeight: 46, paddingHorizontal: 12, marginTop: 7, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#302923' },
  productAmount: { color: '#f5eee8', fontSize: 12, fontWeight: '800' },
  productPrice: { color: '#b6f0dd', fontSize: 12, fontWeight: '900' },
  modalError: { color: '#ffaaa3', fontSize: 10, lineHeight: 15, marginTop: 12 },
  walletDisclaimer: { color: '#91877f', fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 13 },
  webMessageScreen: {
    flex: 1,
    backgroundColor: '#10221e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  webMessageContent: {
    padding: 24,
    alignItems: 'center',
  },
  webMessageTitle: {
    color: '#f5eee8',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  webMessageText: {
    color: '#a99e95',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  webMessageButton: {
    backgroundColor: '#8bd9c3',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  webMessageButtonText: {
    color: '#10221e',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
