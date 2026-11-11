import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  AppState,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { useThemedStyles } from '../contexts/ThemeContext';
import {
  addMomentReply,
  createMoment,
  getMomentReplies,
  getMoments,
  reactToMoment,
  removeMomentReaction,
  resolveMediaUrl,
  uploadMedia,
  type ApiMoment,
  type ApiMomentReply,
} from '../lib/api';
import { ThemedTextInput } from './ThemedTextInput';
import { MediaAttachmentPreview, MediaPickerSheet, type SharedMediaAsset } from './MediaAttachment';

const REFRESH_INTERVAL_MS = 12000;
const reactions = [
  { type: 'heart', icon: '❤️', label: 'Heart' },
  { type: 'clap', icon: '👏', label: 'Clap' },
  { type: 'laugh', icon: '😂', label: 'Laugh' },
  { type: 'wow', icon: '😮', label: 'Wow' },
] as const;
const cardAccents = ['#7c3aed', '#0f766e', '#c2410c', '#2563eb'];

function authorName(moment: ApiMoment) {
  return moment.author.profile?.displayName?.trim() || moment.author.username;
}

function timeRemaining(expiresAt: string) {
  const hours = Math.max(1, Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 3600000));
  return `${hours}h left`;
}

export function PulseBoard() {
  const { user } = useAuth();
  const styles = useThemedStyles(baseStyles);
  const [moments, setMoments] = useState<ApiMoment[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(false);
  const [caption, setCaption] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<SharedMediaAsset | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [duration, setDuration] = useState<'6h' | '12h' | '24h'>('24h');
  const [posting, setPosting] = useState(false);
  const [viewerMoment, setViewerMoment] = useState<ApiMoment | null>(null);
  const [replies, setReplies] = useState<ApiMomentReply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const [viewerError, setViewerError] = useState<string | null>(null);
  const requestInFlight = useRef(false);

  const refreshMoments = useCallback(async (silent = false) => {
    if (!user || requestInFlight.current) return;
    requestInFlight.current = true;
    if (!silent) {
      setLoading(true);
      setRefreshError(null);
    }
    try {
      const { moments: latest } = await getMoments();
      setMoments(latest);
      setRefreshError(null);
      setViewerMoment((current) => current ? latest.find((moment) => moment.id === current.id) || null : null);
    } catch (error) {
      if (!silent) setRefreshError(error instanceof Error ? error.message : 'Could not load Pulse updates.');
    } finally {
      requestInFlight.current = false;
      if (!silent) setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user) {
      setMoments([]);
      return;
    }
    void refreshMoments();
    const interval = setInterval(() => {
      if (AppState.currentState === 'active') void refreshMoments(true);
    }, REFRESH_INTERVAL_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refreshMoments(true);
    });
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, [user?.id, refreshMoments]);

  const publish = async () => {
    const text = caption.trim();
    if ((!text && !selectedMedia) || posting) return;
    setPosting(true);
    setRefreshError(null);
    try {
      let mediaUrl: string | undefined;
      let mediaType: 'image' | 'video' | undefined;
      if (selectedMedia) {
        if (selectedMedia.type === 'file') {
          throw new Error('Pulse updates support photos and videos, not document attachments.');
        }
        const upload = await uploadMedia(selectedMedia, 'status');
        if (upload.mediaType === 'file') {
          throw new Error('The selected media was uploaded as a document and cannot be used in a Pulse update.');
        }
        mediaUrl = upload.url;
        mediaType = upload.mediaType;
      }
      await createMoment({ caption: text, mediaUrl, mediaType, duration });
      setCaption('');
      setSelectedMedia(null);
      setDuration('24h');
      setComposerOpen(false);
      await refreshMoments();
    } catch (error) {
      setRefreshError(error instanceof Error ? error.message : 'Could not share your Pulse.');
    } finally {
      setPosting(false);
    }
  };

  const openMoment = async (moment: ApiMoment) => {
    setViewerMoment(moment);
    setReplies([]);
    setReplyText('');
    setViewerError(null);
    try {
      const { replies: latestReplies } = await getMomentReplies(moment.id);
      setReplies(latestReplies);
    } catch (error) {
      setViewerError(error instanceof Error ? error.message : 'Could not load replies.');
    }
  };

  const sendReaction = async (type: typeof reactions[number]['type']) => {
    if (!viewerMoment || !user) return;
    setViewerError(null);
    try {
      const currentReaction = viewerMoment.reactions.find((reaction) => reaction.userId === user.id);
      if (currentReaction?.type === type) {
        await removeMomentReaction(viewerMoment.id);
      } else {
        await reactToMoment(viewerMoment.id, type);
      }
      await refreshMoments(true);
    } catch (error) {
      setViewerError(error instanceof Error ? error.message : 'Could not send your reaction.');
    }
  };

  const sendReply = async () => {
    if (!viewerMoment || !replyText.trim() || replying) return;
    setReplying(true);
    setViewerError(null);
    try {
      const { reply } = await addMomentReply(viewerMoment.id, replyText.trim());
      setReplies((current) => [reply, ...current]);
      setReplyText('');
      await refreshMoments(true);
    } catch (error) {
      setViewerError(error instanceof Error ? error.message : 'Could not send your reply.');
    } finally {
      setReplying(false);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.board}>
      <View style={styles.boardHeading}>
        <View style={styles.boardHeadingCopy}>
          <Text style={styles.eyebrow}>THE PULSE BOARD</Text>
          <Text style={styles.boardTitle}>A little from everyone</Text>
          <Text style={styles.boardSubtitle}>Shared updates fade after their chosen time.</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Refresh Pulse updates"
          style={styles.refreshButton}
          onPress={() => void refreshMoments()}
          disabled={loading}
        >
          {loading ? <ActivityIndicator size="small" color="#c2410c" /> : <Ionicons name="sync-outline" size={18} color="#c2410c" />}
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cards}>
        <TouchableOpacity
          accessibilityRole="button"
          style={[styles.pulseCard, styles.addCard]}
          onPress={() => { setRefreshError(null); setComposerOpen(true); }}
        >
          <View style={styles.addIcon}><Ionicons name="add" size={24} color="#ffffff" /></View>
          <Text style={styles.addTitle}>Start a Pulse</Text>
          <Text style={styles.addSubtitle}>A note, photo, or clip</Text>
        </TouchableOpacity>
        {moments.map((moment, index) => {
          const isOwn = moment.authorId === user.id;
          const author = authorName(moment);
          const accent = cardAccents[index % cardAccents.length];
          return (
            <TouchableOpacity
              key={moment.id}
              accessibilityRole="button"
              accessibilityLabel={`Open Pulse from ${author}`}
              style={[styles.pulseCard, { borderColor: accent }]}
              onPress={() => void openMoment(moment)}
            >
              {moment.mediaUrl && moment.mediaType === 'image' ? (
                <Image source={{ uri: resolveMediaUrl(moment.mediaUrl) }} style={styles.cardMedia} resizeMode="cover" />
              ) : (
                <View style={[styles.cardArtwork, { backgroundColor: accent }]}>
                  <Ionicons name={moment.mediaType === 'video' ? 'play-circle-outline' : 'chatbubble-ellipses-outline'} size={30} color="#ffffff" />
                  <Text style={styles.cardPreview} numberOfLines={3}>
                    {moment.caption || (moment.mediaType === 'video' ? 'A new clip' : 'A quick thought')}
                  </Text>
                </View>
              )}
              <View style={styles.cardFooter}>
                <View style={styles.cardAvatar}>
                  {moment.author.profile?.avatar ? (
                    <Image source={{ uri: resolveMediaUrl(moment.author.profile.avatar) }} style={styles.cardAvatarImage} />
                  ) : (
                    <Text style={styles.cardAvatarInitial}>{author[0]?.toUpperCase() || 'M'}</Text>
                  )}
                </View>
                <View style={styles.cardFooterCopy}>
                  <Text style={styles.cardAuthor} numberOfLines={1}>{isOwn ? 'Your Pulse' : author}</Text>
                  <Text style={styles.cardTime}>{timeRemaining(moment.expiresAt)}</Text>
                </View>
                {!!moment._count.reactions && <Text style={styles.reactionCount}>♥ {moment._count.reactions}</Text>}
              </View>
            </TouchableOpacity>
          );
        })}
        {!moments.length && !loading && (
          <View style={styles.emptyCard}>
            <Ionicons name="radio-outline" size={24} color="#c2410c" />
            <Text style={styles.emptyTitle}>It’s quiet here</Text>
            <Text style={styles.emptyText}>Start the first update for everyone.</Text>
          </View>
        )}
      </ScrollView>
      {!!refreshError && <Text style={styles.error}>{refreshError}</Text>}

      <Modal visible={composerOpen} animationType="slide" onRequestClose={() => setComposerOpen(false)}>
        <View style={styles.modalScreen}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.eyebrow}>A SHORT-LIVED UPDATE</Text>
              <Text style={styles.modalTitle}>Share your Pulse</Text>
            </View>
            <TouchableOpacity accessibilityLabel="Close Pulse composer" onPress={() => setComposerOpen(false)}>
              <Ionicons name="close-circle-outline" size={27} color="#6b625b" />
            </TouchableOpacity>
          </View>
          <Text style={styles.audienceNotice}><Ionicons name="earth-outline" size={16} color="#0f766e" /> Visible to everyone on MyGuy</Text>
          <ThemedTextInput
            value={caption}
            onChangeText={setCaption}
            placeholder="What’s happening in your corner?"
            multiline
            maxLength={500}
            style={styles.captionInput}
          />
          <View style={styles.mediaButton}>
            <TouchableOpacity style={styles.chooseMediaButton} onPress={() => setMediaPickerOpen(true)}>
              <Ionicons name="attach-outline" size={20} color="#c2410c" />
              <Text style={styles.mediaButtonText}>
                {selectedMedia ? selectedMedia.fileName || (selectedMedia.type === 'video' ? 'Clip selected' : 'Photo selected') : 'Add a photo or clip up to 60 seconds'}
              </Text>
            </TouchableOpacity>
            {selectedMedia && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Remove selected Pulse media"
                onPress={() => setSelectedMedia(null)}
              >
                <Ionicons name="close-circle" size={20} color="#b91c1c" />
              </TouchableOpacity>
            )}
          </View>
          {selectedMedia && (
            <MediaAttachmentPreview asset={selectedMedia} onRemove={() => setSelectedMedia(null)} />
          )}
          <Text style={styles.durationLabel}>Let this update stay up for</Text>
          <View style={styles.durationOptions}>
            {(['6h', '12h', '24h'] as const).map((option) => (
              <TouchableOpacity
                key={option}
                accessibilityRole="button"
                accessibilityState={{ selected: duration === option }}
                onPress={() => setDuration(option)}
                style={[styles.durationOption, duration === option && styles.durationSelected]}
              >
                <Text style={[styles.durationText, duration === option && styles.durationSelectedText]}>{option}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {!!refreshError && <Text style={styles.error}>{refreshError}</Text>}
          <TouchableOpacity
            accessibilityRole="button"
            disabled={(!caption.trim() && !selectedMedia) || posting}
            onPress={() => void publish()}
            style={[styles.publishButton, ((!caption.trim() && !selectedMedia) || posting) && styles.disabledButton]}
          >
            <Text style={styles.publishText}>{posting ? 'Sharing…' : 'Share with everyone'}</Text>
            {!posting && <Ionicons name="arrow-forward" size={18} color="#ffffff" />}
          </TouchableOpacity>
        </View>
      </Modal>
      <MediaPickerSheet
        visible={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(asset) => { setSelectedMedia(asset); setRefreshError(null); }}
        onError={setRefreshError}
      />

      <Modal visible={viewerMoment !== null} animationType="fade" onRequestClose={() => setViewerMoment(null)}>
        {viewerMoment && (
          <View style={styles.viewerScreen}>
            <View style={styles.viewerHeader}>
              <View style={styles.viewerAuthor}>
                <View style={styles.cardAvatar}>
                  {viewerMoment.author.profile?.avatar ? (
                    <Image source={{ uri: resolveMediaUrl(viewerMoment.author.profile.avatar) }} style={styles.cardAvatarImage} />
                  ) : <Text style={styles.cardAvatarInitial}>{authorName(viewerMoment)[0]?.toUpperCase() || 'M'}</Text>}
                </View>
                <View>
                  <Text style={styles.viewerName}>{authorName(viewerMoment)}</Text>
                  <Text style={styles.cardTime}>{timeRemaining(viewerMoment.expiresAt)}</Text>
                </View>
              </View>
              <TouchableOpacity accessibilityLabel="Close Pulse" onPress={() => setViewerMoment(null)}>
                <Ionicons name="close" size={26} color="#ffffff" />
              </TouchableOpacity>
            </View>
            {viewerMoment.mediaUrl && viewerMoment.mediaType === 'image' && (
              <Image source={{ uri: resolveMediaUrl(viewerMoment.mediaUrl) }} style={styles.viewerMedia} resizeMode="contain" />
            )}
            {viewerMoment.mediaUrl && viewerMoment.mediaType === 'video' && (
              <Video
                source={{ uri: resolveMediaUrl(viewerMoment.mediaUrl) }}
                style={styles.viewerMedia}
                resizeMode={ResizeMode.CONTAIN}
                useNativeControls
                shouldPlay
              />
            )}
            {!!viewerMoment.caption && <Text style={styles.viewerCaption}>{viewerMoment.caption}</Text>}
            <View style={styles.viewerReactions}>
              {reactions.map((reaction) => {
                const selected = viewerMoment.reactions.some((item) => item.userId === user.id && item.type === reaction.type);
                return (
                  <TouchableOpacity
                    key={reaction.type}
                    accessibilityRole="button"
                    accessibilityLabel={`React with ${reaction.label}`}
                    accessibilityState={{ selected }}
                    onPress={() => void sendReaction(reaction.type)}
                    style={[styles.reactionButton, selected && styles.reactionSelected]}
                  >
                    <Text style={styles.reactionIcon}>{reaction.icon}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <ScrollView style={styles.replyList}>
              {replies.map((reply) => (
                <View key={reply.id} style={styles.replyRow}>
                  <Text style={styles.replyAuthor}>{reply.user.profile?.displayName || reply.user.username}</Text>
                  <Text style={styles.replyBody}>{reply.content}</Text>
                </View>
              ))}
              {!replies.length && <Text style={styles.replyEmpty}>Leave a kind note for {authorName(viewerMoment)}.</Text>}
            </ScrollView>
            {!!viewerError && <Text style={styles.error}>{viewerError}</Text>}
            <View style={styles.replyComposer}>
              <ThemedTextInput
                value={replyText}
                onChangeText={setReplyText}
                placeholder="Reply to this Pulse"
                maxLength={500}
                style={styles.replyInput}
              />
              <TouchableOpacity
                accessibilityRole="button"
                disabled={!replyText.trim() || replying}
                onPress={() => void sendReply()}
                style={[styles.replySend, (!replyText.trim() || replying) && styles.disabledButton]}
              >
                <Ionicons name="send" size={17} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Modal>
    </View>
  );
}

const baseStyles = StyleSheet.create({
  board: {
    marginTop: 18,
    paddingVertical: 16,
    backgroundColor: '#fff1e5',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#f1e8df',
  },
  boardHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 13,
  },
  boardHeadingCopy: { flex: 1 },
  eyebrow: { color: '#0f766e', fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  boardTitle: { color: '#292524', fontSize: 17, fontWeight: '800', marginTop: 3 },
  boardSubtitle: { color: '#6b625b', fontSize: 11, marginTop: 3 },
  refreshButton: { width: 36, height: 36, borderRadius: 13, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  cards: { paddingHorizontal: 14, gap: 10 },
  pulseCard: { width: 138, height: 154, overflow: 'hidden', borderRadius: 19, borderWidth: 1.5, backgroundColor: '#ffffff' },
  addCard: { padding: 13, justifyContent: 'space-between', backgroundColor: '#0f766e', borderColor: '#0f766e' },
  addIcon: { width: 36, height: 36, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  addTitle: { color: '#ffffff', fontSize: 14, lineHeight: 18, fontWeight: '800' },
  addSubtitle: { color: '#d7f3e9', fontSize: 10 },
  cardArtwork: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 13 },
  cardPreview: { color: '#ffffff', fontSize: 12, fontWeight: '700', lineHeight: 17, textAlign: 'center', marginTop: 8 },
  cardMedia: { width: '100%', height: 99 },
  cardFooter: { minHeight: 53, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  cardAvatar: { width: 30, height: 30, borderRadius: 11, backgroundColor: '#fff1e5', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardAvatarImage: { width: '100%', height: '100%' },
  cardAvatarInitial: { color: '#c2410c', fontWeight: '800', fontSize: 12 },
  cardFooterCopy: { flex: 1, minWidth: 0, marginLeft: 7 },
  cardAuthor: { color: '#292524', fontSize: 10, fontWeight: '800' },
  cardTime: { color: '#6b625b', fontSize: 9, marginTop: 2 },
  reactionCount: { color: '#b42318', fontSize: 10, fontWeight: '700', marginLeft: 3 },
  emptyCard: { width: 166, height: 154, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1e8df' },
  emptyTitle: { color: '#292524', fontSize: 12, fontWeight: '800', marginTop: 7 },
  emptyText: { color: '#6b625b', fontSize: 10, textAlign: 'center', marginTop: 4 },
  error: { color: '#b91c1c', fontSize: 12, marginHorizontal: 14, marginTop: 8 },
  modalScreen: { flex: 1, padding: 20, paddingTop: 60, backgroundColor: '#fffaf5' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  modalTitle: { color: '#292524', fontSize: 24, fontWeight: '800', marginTop: 5 },
  audienceNotice: { alignSelf: 'flex-start', color: '#0f766e', backgroundColor: '#e3f4ec', borderRadius: 12, paddingHorizontal: 11, paddingVertical: 8, fontSize: 12, fontWeight: '700', overflow: 'hidden', marginBottom: 16 },
  captionInput: { minHeight: 150, padding: 16, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e7ddd3', fontSize: 16, textAlignVertical: 'top' },
  mediaButton: { flexDirection: 'row', alignItems: 'center', minHeight: 52, gap: 9, paddingHorizontal: 13, marginTop: 12, borderRadius: 15, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1e8df' },
  chooseMediaButton: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 50 },
  mediaButtonText: { flex: 1, color: '#7c2d12', fontSize: 12, fontWeight: '700' },
  durationLabel: { color: '#6b625b', fontSize: 12, fontWeight: '700', marginTop: 22, marginBottom: 10 },
  durationOptions: { flexDirection: 'row', gap: 9 },
  durationOption: { minWidth: 66, alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 13, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e7ddd3' },
  durationSelected: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  durationText: { color: '#57534e', fontSize: 13, fontWeight: '700' },
  durationSelectedText: { color: '#ffffff' },
  publishButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, minHeight: 52, marginTop: 'auto', borderRadius: 16, backgroundColor: '#0f766e' },
  publishText: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  disabledButton: { opacity: 0.5 },
  viewerScreen: { flex: 1, padding: 20, paddingTop: 54, backgroundColor: '#151210' },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewerAuthor: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  viewerName: { color: '#f5eee8', fontSize: 15, fontWeight: '800' },
  viewerMedia: { width: '100%', height: 330, marginTop: 18, borderRadius: 18, backgroundColor: '#211c19' },
  viewerCaption: { color: '#f5eee8', fontSize: 16, lineHeight: 23, marginTop: 13 },
  viewerReactions: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  reactionButton: { width: 48, height: 43, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#30241c' },
  reactionSelected: { borderWidth: 1.5, borderColor: '#fb923c', backgroundColor: '#493222' },
  reactionIcon: { fontSize: 21 },
  replyList: { flex: 1, borderTopWidth: 1, borderTopColor: '#3a3029', paddingTop: 8 },
  replyRow: { paddingVertical: 8 },
  replyAuthor: { color: '#fb923c', fontSize: 12, fontWeight: '800' },
  replyBody: { color: '#f5eee8', fontSize: 13, lineHeight: 19, marginTop: 3 },
  replyEmpty: { color: '#c4b8ae', textAlign: 'center', padding: 20, fontSize: 12 },
  replyComposer: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#3a3029' },
  replyInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 20, backgroundColor: '#211c19', fontSize: 14 },
  replySend: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: '#0f766e' },
});
