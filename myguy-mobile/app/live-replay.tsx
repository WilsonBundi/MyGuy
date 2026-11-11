import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ApiLiveReplay, deleteLiveReplay, getLiveReplay } from '../src/lib/api';

export default function LiveReplayScreen() {
  const { roomId: rawRoomId } = useLocalSearchParams<{ roomId?: string }>();
  const roomId = typeof rawRoomId === 'string' ? rawRoomId : '';
  const [replay, setReplay] = useState<ApiLiveReplay | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadReplay = useCallback(async () => {
    if (!roomId) {
      setError('Replay not found.');
      setLoading(false);
      return;
    }
    try {
      const result = await getLiveReplay(roomId);
      setReplay(result.replay);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load the replay.');
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    void loadReplay();
  }, [loadReplay]);

  useEffect(() => {
    if (replay?.status !== 'starting' && replay?.status !== 'recording') return;
    const timer = setInterval(() => { void loadReplay(); }, 5000);
    return () => clearInterval(timer);
  }, [loadReplay, replay?.status]);

  const confirmDelete = () => {
    Alert.alert('Delete replay?', 'This permanently removes your private recording.', [
      { text: 'Keep replay', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => { void removeReplay(); },
      },
    ]);
  };

  const removeReplay = async () => {
    setDeleting(true);
    try {
      await deleteLiveReplay(roomId);
      setReplay(null);
      setError(null);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'Could not delete the replay.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={21} color="#f5eee8" />
        </TouchableOpacity>
        <Text style={styles.heading}>Your replay</Text>
        {replay?.status === 'ready' ? (
          <TouchableOpacity accessibilityRole="button" accessibilityLabel="Delete replay" onPress={confirmDelete} style={styles.backButton} disabled={deleting}>
            {deleting ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name="trash-outline" size={19} color="#f5eee8" />}
          </TouchableOpacity>
        ) : <View style={styles.backButton} />}
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color="#8bd9c3" /><Text style={styles.bodyText}>Loading your replay…</Text></View>
      ) : replay?.status === 'ready' && replay.playbackUrl ? (
        <View style={styles.playerContainer}>
          <Video
            source={{ uri: replay.playbackUrl }}
            style={styles.player}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={false}
          />
          <Text style={styles.bodyText}>
            Private replay · Available through {new Date(replay.expiresAt).toLocaleDateString()}
          </Text>
        </View>
      ) : replay?.status === 'recording' || replay?.status === 'starting' ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8bd9c3" />
          <Text style={styles.title}>Preparing your replay</Text>
          <Text style={styles.bodyText}>MyGuy will make it available here when the recording finishes.</Text>
        </View>
      ) : (
        <View style={styles.centered}>
          <Ionicons name={replay?.status === 'failed' ? 'alert-circle-outline' : 'videocam-off-outline'} size={38} color="#9b9189" />
          <Text style={styles.title}>{replay?.status === 'failed' ? 'Recording unavailable' : 'No replay saved'}</Text>
          <Text accessibilityRole={error ? 'alert' : undefined} style={styles.bodyText}>
            {error || replay?.error || 'You can choose to save a private replay while hosting your next live.'}
          </Text>
          <TouchableOpacity accessibilityRole="button" onPress={() => router.back()} style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#151210' },
  header: { minHeight: 56, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: '#342c26' },
  backButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  heading: { color: '#f5eee8', fontSize: 16, fontWeight: '800' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  title: { color: '#f5eee8', fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 18 },
  bodyText: { color: '#b8ada4', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 12 },
  playerContainer: { flex: 1, justifyContent: 'center', padding: 16 },
  player: { width: '100%', aspectRatio: 9 / 16, backgroundColor: '#000000', borderRadius: 14 },
  doneButton: { minWidth: 120, alignItems: 'center', marginTop: 22, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 13, backgroundColor: '#8bd9c3' },
  doneText: { color: '#10221e', fontWeight: '900', fontSize: 13 },
});
