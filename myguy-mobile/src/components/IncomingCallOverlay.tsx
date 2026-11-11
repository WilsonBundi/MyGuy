import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, AppState, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import { finishChatCall, getIncomingCalls, type ApiIncomingCall } from '../lib/api';

export function IncomingCallOverlay() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState<ApiIncomingCall | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const handledCallIds = useRef(new Set<string>());

  useEffect(() => {
    if (!user) {
      setIncoming(null);
      return;
    }
    let mounted = true;
    let pending = false;
    const poll = async () => {
      if (!mounted || pending || AppState.currentState !== 'active') return;
      pending = true;
      try {
        const response = await getIncomingCalls();
        if (mounted) {
          const availableCalls = response.calls.filter((call) => !handledCallIds.current.has(call.id));
          setIncoming((current) => current && availableCalls.some((call) => call.id === current.id)
            ? availableCalls.find((call) => call.id === current.id) || null
            : availableCalls[0] || null);
        }
      } catch (pollError) {
        console.error('Could not check for incoming calls:', pollError);
      } finally {
        pending = false;
      }
    };
    void poll();
    const interval = setInterval(() => { void poll(); }, 2000);
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') void poll();
    });
    return () => {
      mounted = false;
      clearInterval(interval);
      appState.remove();
    };
  }, [user?.id]);

  const decline = async () => {
    if (!incoming || busy) return;
    setBusy(true);
    setError(null);
    handledCallIds.current.add(incoming.id);
    try {
      await finishChatCall(incoming.chatId, incoming.id, 'decline');
      setIncoming(null);
    } catch (declineError) {
      setError(declineError instanceof Error ? declineError.message : 'Could not decline the call.');
    } finally {
      setBusy(false);
    }
  };

  const answer = () => {
    if (!incoming || busy) return;
    setBusy(true);
    handledCallIds.current.add(incoming.id);
    setIncoming(null);
    router.push({
      pathname: '/call',
      params: { chatId: incoming.chatId, callId: incoming.id },
    });
    setBusy(false);
  };

  const callerName = incoming?.caller.profile?.displayName || incoming?.caller.username || 'MyGuy member';

  return (
    <Modal visible={!!incoming} transparent animationType="fade" onRequestClose={() => void decline()}>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.icon}>
            <Ionicons name={incoming?.type === 'video' ? 'videocam' : 'call'} size={25} color="#ffffff" />
          </View>
          <Text style={styles.eyebrow}>INCOMING {incoming?.type === 'video' ? 'VIDEO' : 'VOICE'} CALL</Text>
          <Text style={styles.name}>{callerName}</Text>
          <Text style={styles.description}>is calling you</Text>
          {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
          <View style={styles.actions}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Decline call" onPress={() => void decline()} disabled={busy} style={[styles.action, styles.decline]}>
              {busy ? <ActivityIndicator color="#ffffff" /> : <Ionicons name="call" size={21} color="#ffffff" />}
            </TouchableOpacity>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Answer call" onPress={answer} disabled={busy} style={[styles.action, styles.answer]}>
              <Ionicons name={incoming?.type === 'video' ? 'videocam' : 'call'} size={21} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: 'rgba(16, 24, 21, 0.65)' },
  card: { width: '100%', maxWidth: 360, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 28, borderRadius: 26, backgroundColor: '#fffaf5' },
  icon: { width: 62, height: 62, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: '#0f766e' },
  eyebrow: { color: '#0f766e', fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 17 },
  name: { color: '#292524', fontSize: 22, fontWeight: '900', marginTop: 8 },
  description: { color: '#847268', fontSize: 13, marginTop: 3 },
  error: { color: '#b91c1c', fontSize: 11, textAlign: 'center', marginTop: 12 },
  actions: { flexDirection: 'row', gap: 42, marginTop: 26 },
  action: { width: 58, height: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 29 },
  decline: { backgroundColor: '#b91c1c', transform: [{ rotate: '135deg' }] },
  answer: { backgroundColor: '#0f766e' },
});
