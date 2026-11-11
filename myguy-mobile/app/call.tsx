import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  BackHandler,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import type { MediaStream, RTCPeerConnection as RTCPeerConnectionType } from '@livekit/react-native-webrtc';
import {
  RTCIceCandidate,
  RTCPeerConnection,
  RTCSessionDescription,
  RTCView,
  mediaDevices,
} from '../src/lib/webrtc-runtime';
import { useAuth } from '../src/contexts/AuthContext';
import {
  answerChatCall,
  finishChatCall,
  getChatCallDetails,
  sendChatCallSignal,
  startChatCall,
  type ApiChatCall,
  type ApiChatCallSignal,
} from '../src/lib/api';

type CallStage = 'preparing' | 'ringing' | 'connecting' | 'active' | 'ended' | 'error';

export default function CallScreen() {
  const params = useLocalSearchParams<{ chatId: string; callType?: string; callId?: string }>();
  const chatId = typeof params.chatId === 'string' ? params.chatId : '';
  const incomingId = typeof params.callId === 'string' ? params.callId : '';
  const requestedType = params.callType === 'video' ? 'video' : 'audio';
  const { user } = useAuth();
  const [call, setCall] = useState<ApiChatCall | null>(null);
  const [callType, setCallType] = useState<'audio' | 'video'>(requestedType);
  const [stage, setStage] = useState<CallStage>('preparing');
  const [error, setError] = useState<string | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [seconds, setSeconds] = useState(0);
  const peerRef = useRef<RTCPeerConnectionType | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callIdRef = useRef(incomingId);
  const seenSignalsRef = useRef(new Set<string>());
  const pendingLocalCandidatesRef = useRef<ApiChatCallSignal['payload'][]>([]);
  const pendingRemoteCandidatesRef = useRef<ApiChatCallSignal['payload'][]>([]);
  const remoteDescriptionSetRef = useRef(false);
  const stageRef = useRef<CallStage>('preparing');

  const setCallStage = (next: CallStage) => {
    stageRef.current = next;
    setStage(next);
  };

  const closeMedia = useCallback(() => {
    peerRef.current?.close();
    peerRef.current = null;
    localStreamRef.current?.getTracks().forEach((track) => track.stop());
    localStreamRef.current?.release();
    localStreamRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
  }, []);

  const sendQueuedLocalCandidates = useCallback(async (activeChatId: string, activeCallId: string) => {
    const queued = pendingLocalCandidatesRef.current.splice(0);
    for (const candidate of queued) {
      await sendChatCallSignal(activeChatId, activeCallId, candidate);
    }
  }, []);

  const sendCandidate = useCallback(async (candidate: ApiChatCallSignal['payload']) => {
    const activeCallId = callIdRef.current;
    if (!activeCallId) {
      pendingLocalCandidatesRef.current.push(candidate);
      return;
    }
    try {
      await sendChatCallSignal(chatId, activeCallId, candidate);
    } catch (signalError) {
      console.error('Could not send a WebRTC network candidate:', signalError);
      setError(signalError instanceof Error ? signalError.message : 'Call connection signal failed.');
    }
  }, [chatId]);

  const addPendingRemoteCandidates = useCallback(async () => {
    const peer = peerRef.current;
    if (!peer?.remoteDescription) return;
    const queued = pendingRemoteCandidatesRef.current.splice(0);
    for (const candidate of queued) {
      await peer.addIceCandidate(new RTCIceCandidate(candidate));
    }
  }, []);

  useEffect(() => {
    if (!chatId || !user?.id) {
      setError('Open a direct conversation before starting a call.');
      setCallStage('error');
      return;
    }
    if (Platform.OS === 'web') {
      setError('Live calls need the MyGuy development build on an Android or iOS device.');
      setCallStage('error');
      return;
    }

    let cancelled = false;
    const setupCall = async () => {
      try {
        setError(null);
        const incoming = incomingId
          ? await getChatCallDetails(chatId, incomingId)
          : null;
        const effectiveType = incoming?.call.type || requestedType;
        if (incoming && incoming.call.status !== 'ringing') {
          throw new Error('This call is no longer available.');
        }
        if (cancelled) return;
        setCallType(effectiveType);
        if (incoming) {
          callIdRef.current = incoming.call.id;
          setCall(incoming.call);
          setCallStage('connecting');
        }

        if (Platform.OS === 'android') {
          const permissions = effectiveType === 'video'
            ? [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, PermissionsAndroid.PERMISSIONS.CAMERA]
            : [PermissionsAndroid.PERMISSIONS.RECORD_AUDIO];
          const permissionResults = await PermissionsAndroid.requestMultiple(permissions);
          if (permissions.some((permission) => permissionResults[permission] !== PermissionsAndroid.RESULTS.GRANTED)) {
            throw new Error('Allow MyGuy to use your microphone and camera to make this call.');
          }
        }

        const stream = await mediaDevices.getUserMedia({
          audio: true,
          video: effectiveType === 'video' ? { facingMode: 'user' } : false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          stream.release();
          return;
        }
        localStreamRef.current = stream;
        setLocalStream(stream);

        const peer = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerRef.current = peer;
        stream.getTracks().forEach((track) => peer.addTrack(track, stream));
        peer.addEventListener('icecandidate', (event) => {
          if (!event.candidate) return;
          void sendCandidate(event.candidate.toJSON()).catch((signalError: unknown) => {
            console.error('Could not queue WebRTC network candidate:', signalError);
          });
        });
        peer.addEventListener('track', (event) => {
          const [incomingStream] = event.streams;
          if (incomingStream) setRemoteStream(incomingStream);
        });
        peer.addEventListener('connectionstatechange', () => {
          if (peer.connectionState === 'connected') setCallStage('active');
          if (peer.connectionState === 'failed') {
            setError('Could not connect this call. Check your network and try again.');
          }
        });

        if (incoming) {
          await peer.setRemoteDescription(new RTCSessionDescription(incoming.call.offer));
          remoteDescriptionSetRef.current = true;
          for (const signal of incoming.signals) {
            seenSignalsRef.current.add(signal.id);
            pendingRemoteCandidatesRef.current.push(signal.payload);
          }
          await addPendingRemoteCandidates();
          const answer = await peer.createAnswer();
          await peer.setLocalDescription(answer);
          const localAnswer = peer.localDescription;
          if (!localAnswer?.sdp) throw new Error('Could not create a call answer.');
          await answerChatCall(chatId, incoming.call.id, { type: 'answer', sdp: localAnswer.sdp });
          await sendQueuedLocalCandidates(chatId, incoming.call.id);
          setCallStage('connecting');
          return;
        }

        const offer = await peer.createOffer({});
        await peer.setLocalDescription(offer);
        const localOffer = peer.localDescription;
        if (!localOffer?.sdp) throw new Error('Could not create a call offer.');
        const response = await startChatCall(chatId, effectiveType, { type: 'offer', sdp: localOffer.sdp });
        if (cancelled) {
          await finishChatCall(chatId, response.call.id, 'end');
          return;
        }
        callIdRef.current = response.call.id;
        setCall(response.call);
        setCallStage('ringing');
        await sendQueuedLocalCandidates(chatId, response.call.id);
      } catch (setupError) {
        if (cancelled) return;
        const failedCallId = callIdRef.current;
        if (failedCallId) {
          try {
            await finishChatCall(chatId, failedCallId, incomingId ? 'decline' : 'end');
          } catch (finishError) {
            console.error('Could not close a call after setup failed:', finishError);
          }
        }
        setError(setupError instanceof Error ? setupError.message : 'Could not start this call.');
        setCallStage('error');
        closeMedia();
      }
    };

    void setupCall();
    return () => {
      cancelled = true;
      closeMedia();
    };
  }, [
    addPendingRemoteCandidates,
    chatId,
    closeMedia,
    incomingId,
    requestedType,
    sendCandidate,
    sendQueuedLocalCandidates,
    user?.id,
  ]);

  useEffect(() => {
    const activeCallId = call?.id || incomingId;
    if (!activeCallId || !chatId || stage === 'ended' || stage === 'error') return;
    let mounted = true;
    let polling = false;
    const pollCall = async () => {
      if (!mounted || polling || AppState.currentState !== 'active') return;
      polling = true;
      try {
        const result = await getChatCallDetails(chatId, activeCallId);
        if (!mounted) return;
        setCall(result.call);
        if (result.call.status === 'declined' || result.call.status === 'ended') {
          setCallStage('ended');
          closeMedia();
          return;
        }

        const peer = peerRef.current;
        if (
          result.call.callerId === user?.id &&
          result.call.status === 'active' &&
          result.call.answer &&
          peer &&
          !peer.remoteDescription
        ) {
          await peer.setRemoteDescription(new RTCSessionDescription(result.call.answer));
          remoteDescriptionSetRef.current = true;
          await addPendingRemoteCandidates();
        }
        for (const signal of result.signals) {
          if (seenSignalsRef.current.has(signal.id)) continue;
          seenSignalsRef.current.add(signal.id);
          if (peer?.remoteDescription || remoteDescriptionSetRef.current) {
            await peer?.addIceCandidate(new RTCIceCandidate(signal.payload));
          } else {
            pendingRemoteCandidatesRef.current.push(signal.payload);
          }
        }
        if (result.call.status === 'active' && stageRef.current === 'ringing') {
          setCallStage('connecting');
        }
      } catch (pollError) {
        if (mounted) {
          console.error('Could not synchronize call signaling:', pollError);
          setError(pollError instanceof Error ? pollError.message : 'Call signaling was interrupted.');
        }
      } finally {
        polling = false;
      }
    };
    void pollCall();
    const interval = setInterval(() => { void pollCall(); }, 1200);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [addPendingRemoteCandidates, call?.id, chatId, closeMedia, incomingId, user?.id]);

  useEffect(() => {
    if (stage !== 'active') return;
    const interval = setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => clearInterval(interval);
  }, [stage]);

  const endCall = useCallback(async () => {
    const activeCallId = callIdRef.current;
    setCallStage('ended');
    closeMedia();
    if (activeCallId) {
      try {
        await finishChatCall(chatId, activeCallId, 'end');
      } catch (endError) {
        setError(endError instanceof Error ? endError.message : 'Could not end the call on the server.');
      }
    }
  }, [chatId, closeMedia]);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      void endCall();
      router.replace('/chat-detail');
      return true;
    });
    return () => back.remove();
  }, [endCall]);

  const toggleMute = () => {
    const nextMuted = !muted;
    localStreamRef.current?.getAudioTracks().forEach((track) => { track.enabled = !nextMuted; });
    setMuted(nextMuted);
  };

  const toggleCamera = () => {
    const nextEnabled = !cameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach((track) => { track.enabled = nextEnabled; });
    setCameraEnabled(nextEnabled);
  };

  const otherPerson = call && call.callerId === user?.id ? call.callee : call?.caller;
  const displayName = otherPerson?.profile?.displayName || otherPerson?.username || 'MyGuy member';
  const clock = `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  const statusLabel = stage === 'preparing'
    ? 'Preparing your call…'
    : stage === 'ringing'
      ? 'Calling…'
      : stage === 'connecting'
        ? 'Connecting…'
        : stage === 'active'
          ? clock
          : stage === 'ended'
            ? 'Call ended'
            : 'Call unavailable';

  return (
    <View style={styles.screen}>
      {callType === 'video' && remoteStream ? (
        <RTCView streamURL={remoteStream.toURL()} objectFit="cover" style={styles.remoteVideo} />
      ) : (
        <View style={styles.callBackdrop}>
          <View style={styles.avatar}>
            <Ionicons name={callType === 'video' ? 'videocam' : 'person'} size={39} color="#ffffff" />
          </View>
          <Text style={styles.personName}>{displayName}</Text>
          <Text style={styles.status}>{statusLabel}</Text>
          {callType === 'video' && <Text style={styles.waitingHint}>Waiting for video…</Text>}
        </View>
      )}

      {callType === 'video' && remoteStream && (
        <View style={styles.videoHeader}>
          <Text style={styles.videoName}>{displayName}</Text>
          <Text style={styles.videoStatus}>{statusLabel}</Text>
        </View>
      )}

      {callType === 'video' && localStream?.getVideoTracks().length ? (
        cameraEnabled
          ? <RTCView streamURL={localStream.toURL()} mirror objectFit="cover" style={styles.localVideo} />
          : <View style={[styles.localVideo, styles.cameraOff]}><Ionicons name="videocam-off" size={20} color="#ffffff" /></View>
      ) : null}

      {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

      <View style={styles.controls}>
        {stage !== 'ended' && stage !== 'error' && (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={muted ? 'Unmute microphone' : 'Mute microphone'} onPress={toggleMute} style={[styles.control, muted && styles.controlActive]}>
            <Ionicons name={muted ? 'mic-off' : 'mic'} size={21} color="#ffffff" />
          </TouchableOpacity>
        )}
        {callType === 'video' && stage !== 'ended' && stage !== 'error' && (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel={cameraEnabled ? 'Turn camera off' : 'Turn camera on'} onPress={toggleCamera} style={[styles.control, !cameraEnabled && styles.controlActive]}>
            <Ionicons name={cameraEnabled ? 'videocam' : 'videocam-off'} size={21} color="#ffffff" />
          </TouchableOpacity>
        )}
        {stage === 'preparing' || stage === 'connecting' ? (
          <View style={styles.control}><ActivityIndicator color="#ffffff" /></View>
        ) : stage === 'ended' || stage === 'error' ? (
          <TouchableOpacity accessibilityRole="button" onPress={() => router.replace('/chat-detail')} style={[styles.control, styles.hangup]}>
            <Ionicons name="arrow-back" size={21} color="#ffffff" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="End call" onPress={() => void endCall()} style={[styles.control, styles.hangup]}>
            <Ionicons name="call" size={21} color="#ffffff" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.callType}>{callType === 'video' ? 'MYGUY VIDEO CALL' : 'MYGUY VOICE CALL'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#132a25' },
  callBackdrop: { flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center', backgroundColor: '#173b31' },
  avatar: { width: 102, height: 102, alignItems: 'center', justifyContent: 'center', borderRadius: 38, backgroundColor: '#0f766e' },
  personName: { color: '#ffffff', fontSize: 25, fontWeight: '800', marginTop: 22 },
  status: { color: '#c9e3d6', fontSize: 15, marginTop: 9 },
  waitingHint: { color: '#c9e3d6', fontSize: 12, marginTop: 7 },
  remoteVideo: { ...StyleSheet.absoluteFillObject },
  videoHeader: { position: 'absolute', top: 65, left: 22, right: 22, alignItems: 'center' },
  videoName: { color: '#ffffff', fontSize: 19, fontWeight: '800', textShadowColor: '#00000080', textShadowRadius: 8 },
  videoStatus: { color: '#ffffff', fontSize: 12, marginTop: 4, textShadowColor: '#00000080', textShadowRadius: 8 },
  localVideo: { position: 'absolute', top: 65, right: 17, width: 106, height: 150, borderRadius: 17, overflow: 'hidden', backgroundColor: '#35594b' },
  cameraOff: { alignItems: 'center', justifyContent: 'center' },
  controls: { position: 'absolute', bottom: 83, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 19, width: '100%' },
  control: { width: 55, height: 55, alignItems: 'center', justifyContent: 'center', borderRadius: 28, backgroundColor: '#ffffff35' },
  controlActive: { backgroundColor: '#775c45' },
  hangup: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#c24135', transform: [{ rotate: '135deg' }] },
  callType: { position: 'absolute', bottom: 35, color: '#c9e3d6', fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  error: { position: 'absolute', top: 110, left: 24, right: 24, color: '#fee2e2', fontSize: 12, textAlign: 'center', padding: 12, borderRadius: 12, backgroundColor: '#7f1d1d99' },
});
