import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, RefreshControl, Share, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { usePings } from '../../src/contexts/PingContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { addPingComment, getPingComments, resolveMediaUrl, uploadMedia, type ApiComment } from '../../src/lib/api';
import { useChats } from '../../src/contexts/ChatContext';
import MyGuyLogo from '../../src/components/MyGuyLogo';
import { router, useLocalSearchParams } from 'expo-router';
import { useTheme, useThemedStyles } from '../../src/contexts/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedTextInput as TextInput } from '../../src/components/ThemedTextInput';
import { MediaAttachmentPreview, MediaPickerSheet, type SharedMediaAsset } from '../../src/components/MediaAttachment';

export default function HomeScreen() {
  const params = useLocalSearchParams<{ compose?: string; attachment?: string; draft?: string }>();
  const { pings, loading, error, createPing, toggleLike, refreshPings } = usePings();
  const { user } = useAuth();
  const { startChat } = useChats();
  const styles = useThemedStyles(baseStyles);
  const { colors } = useTheme();
  const [showComposer, setShowComposer] = useState(false);
  const [newPing, setNewPing] = useState('');
  const [posting, setPosting] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SharedMediaAsset | null>(null);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [composerMediaError, setComposerMediaError] = useState<string | null>(null);
  const [mediaAspectRatios, setMediaAspectRatios] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState(false);
  const [expandedPingId, setExpandedPingId] = useState<string | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTarget, setReplyTarget] = useState<{ id: string; name: string } | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [commentPosting, setCommentPosting] = useState(false);
  const firstName = (user?.displayName || user?.username || 'there').trim().split(/\s+/)[0];

  const handlePost = async () => {
    const content = newPing.trim();
    if ((!content && !selectedMedia) || posting) return;

    setPosting(true);
    try {
      let mediaUrls: string[] = [];
      if (selectedMedia) {
        setUploading(true);
        const uploaded = await uploadMedia(selectedMedia, 'ping');
        mediaUrls = [uploaded.url];
      }
      await createPing(content, mediaUrls);
      setNewPing('');
      setSelectedMedia(null);
      setShowComposer(false);
      Alert.alert('Posted', 'Your moment has been shared.');
    } catch (error) {
      Alert.alert('Could not post', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setUploading(false);
      setPosting(false);
    }
  };

  useEffect(() => {
    if (params.compose !== 'true') return;
    setShowComposer(true);
    setNewPing(typeof params.draft === 'string' ? params.draft : '');
    setSelectedMedia(null);
    setComposerMediaError(null);
    if (params.attachment === 'true') setMediaPickerOpen(true);
    router.setParams({ compose: undefined, attachment: undefined, draft: undefined });
  }, [params.compose, params.attachment, params.draft]);

  const startConversation = async (posterId: string) => {
    try {
      await startChat(posterId);
      router.push('/chat-detail');
    } catch (error) {
      Alert.alert('Could not open conversation', error instanceof Error ? error.message : 'Please try again.');
    }
  };

  const pingsArray = Array.isArray(pings) ? pings : [];
  const openComments = async (pingId: string) => {
    if (expandedPingId === pingId) {
      setExpandedPingId(null);
      setReplyTarget(null);
      return;
    }
    setExpandedPingId(pingId);
    setComments([]);
    setCommentText('');
    setReplyTarget(null);
    setCommentError(null);
    setCommentsLoading(true);
    try {
      const result = await getPingComments(pingId);
      setComments(result.comments);
    } catch (loadError) {
      setCommentError(loadError instanceof Error ? loadError.message : 'Could not load comments.');
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    const content = commentText.trim();
    if (!expandedPingId || !content || commentPosting) return;
    setCommentPosting(true);
    setCommentError(null);
    try {
      const parentCommentId = replyTarget?.id;
      const { comment } = await addPingComment(expandedPingId, content, parentCommentId);
      setComments((current) => parentCommentId
        ? current.map((item) => item.id === parentCommentId
          ? { ...item, replies: [...(item.replies || []), comment] }
          : item
        )
        : [comment, ...current]
      );
      setCommentText('');
      setReplyTarget(null);
      await refreshPings();
    } catch (submitError) {
      setCommentError(submitError instanceof Error ? submitError.message : 'Could not post comment.');
    } finally {
      setCommentPosting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={refreshPings} tintColor="#f97316" />}
      >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MyGuyLogo size={40} />
          <View>
            <Text style={styles.headerTitle}>MyGuy</Text>
            <Text style={styles.headerSubtitle}>Your people, your moments</Text>
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open your MyGuy hub"
          style={styles.profileButton}
          onPress={() => router.push('/hub')}
        >
          <Ionicons name="menu-outline" size={24} color="#c2410c" />
        </TouchableOpacity>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go live"
          style={styles.quickAction}
          onPress={() => router.push('/live')}
        >
          <View style={[styles.quickActionIcon, styles.liveActionIcon]}>
            <Ionicons name="radio" size={20} color="#ffffff" />
          </View>
          <Text style={styles.quickActionLabel}>Live</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open Pulse updates"
          style={styles.quickAction}
          onPress={() => router.push('/pulse')}
        >
          <View style={[styles.quickActionIcon, styles.pulseActionIcon]}>
            <Ionicons name="play" size={19} color="#ffffff" />
          </View>
          <Text style={styles.quickActionLabel}>Pulse</Text>
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
          style={styles.quickAction}
          onPress={() => router.push('/notifications')}
        >
          <View style={[styles.quickActionIcon, styles.notificationsActionIcon]}>
            <Ionicons name="notifications" size={19} color="#ffffff" />
          </View>
          <Text style={styles.quickActionLabel}>Notifications</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.greeting}>
        <Text style={styles.greetingTitle}>Good to see you, {firstName}</Text>
        <Text style={styles.greetingSubtitle}>A little moment can bring people closer.</Text>
      </View>

      {/* Create Post */}
      <TouchableOpacity
        accessibilityRole="button"
        style={styles.createPost}
        onPress={() => setShowComposer(true)}
      >
        <View style={styles.createPostLeft}>
          <View style={styles.createPostAvatar}>
            <Text style={styles.createPostInitial}>{firstName[0]?.toUpperCase() || 'Y'}</Text>
          </View>
          <View>
            <Text style={styles.createPostTitle}>Share a moment</Text>
            <Text style={styles.createPostPlaceholder}>What would you like to say?</Text>
          </View>
        </View>
        <View style={styles.createPostButton}>
          <Ionicons name="add-circle" size={24} color="#ffffff" />
        </View>
      </TouchableOpacity>

      {showComposer && (
        <View style={styles.composer}>
          <TextInput
            style={styles.composerInput}
            placeholder="What's on your mind?"
            value={newPing}
            onChangeText={setNewPing}
            multiline
          />
          <TouchableOpacity style={styles.mediaPickButton} onPress={() => setMediaPickerOpen(true)}>
            <Ionicons name="add-circle-outline" size={20} color="#0f766e" />
            <Text style={styles.mediaPickText}>Add a photo or video</Text>
          </TouchableOpacity>
          {selectedMedia && (
            <MediaAttachmentPreview asset={selectedMedia} onRemove={() => setSelectedMedia(null)} />
          )}
          {!!composerMediaError && <Text style={styles.composerMediaError}>{composerMediaError}</Text>}
          <View style={styles.composerActions}>
            <TouchableOpacity style={styles.composerCancel} onPress={() => setShowComposer(false)}>
              <Text style={styles.composerCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.composerPost, ((!newPing.trim() && !selectedMedia) || posting) && styles.composerPostDisabled]}
              onPress={handlePost}
              disabled={(!newPing.trim() && !selectedMedia) || posting}
            >
              <Text style={styles.composerPostText}>{uploading ? 'Uploading…' : posting ? 'Sharing…' : 'Share moment'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      <MediaPickerSheet
        visible={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(asset) => { setSelectedMedia(asset); setComposerMediaError(null); }}
        onError={setComposerMediaError}
      />

      {/* Feed */}
      <View style={styles.feed}>
        <View style={styles.feedHeading}>
          <View>
            <Text style={styles.feedTitle}>Your feed</Text>
            <Text style={styles.feedSubtitle}>New community moments arrive automatically</Text>
          </View>
          <Ionicons name="sparkles-outline" size={20} color="#f97316" />
        </View>
        {error && pingsArray.length > 0 && (
          <View style={styles.statusCard}>
            <Text style={styles.emptyText}>{error} Your saved moments are still available.</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshPings}>
              <Text style={styles.retryButtonText}>Reconnect</Text>
            </TouchableOpacity>
          </View>
        )}
        {loading ? (
          <View style={styles.statusCard}>
            <Text style={styles.loadingText}>Finding the latest moments…</Text>
          </View>
        ) : error && pingsArray.length === 0 ? (
          <View style={styles.statusCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="cloud-offline-outline" size={26} color="#c2410c" />
            </View>
            <Text style={styles.emptyTitle}>Your feed couldn’t load</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={refreshPings}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : pingsArray.length === 0 ? (
          <View style={styles.statusCard}>
            <View style={styles.emptyIcon}>
              <Ionicons name="chatbubble-ellipses-outline" size={26} color="#c2410c" />
            </View>
            <Text style={styles.emptyTitle}>A fresh start</Text>
            <Text style={styles.emptyText}>Your community’s moments will show up here. Share the first one?</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => setShowComposer(true)}>
              <Text style={styles.retryButtonText}>Share a moment</Text>
            </TouchableOpacity>
          </View>
        ) : (
          pingsArray.map((ping) => (
            <View key={ping.id} style={styles.post}>
              <View style={styles.postHeader}>
                <View style={styles.postAuthor}>
                  <View style={styles.avatarSmall}>
                    {ping.author.avatar ? (
                      <Image source={{ uri: resolveMediaUrl(ping.author.avatar) }} style={styles.postAvatarImage} />
                    ) : <Text style={styles.avatarTextSmall}>{ping.author.username?.[0]?.toUpperCase() || 'U'}</Text>}
                  </View>
                  <View>
                    <Text style={styles.postAuthorName}>{ping.author.displayName || ping.author.username}</Text>
                    <Text style={styles.postTime}>
                      {ping.createdAt ? new Date(ping.createdAt).toLocaleString() : 'Just now'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity>
                  <Ionicons name="ellipsis-horizontal" size={20} color="#6b7280" />
                </TouchableOpacity>
              </View>
              <Text style={styles.postContent}>{ping.content}</Text>
              {ping.mediaUrls.map((url) => (
                /\.(mp4|mov|webm)(?:$|[?#])/i.test(url) ? (
                  <Video
                    key={url}
                    source={{ uri: resolveMediaUrl(url) }}
                    style={[styles.postMedia, { aspectRatio: mediaAspectRatios[url] || 16 / 9 }]}
                    useNativeControls
                    resizeMode={ResizeMode.CONTAIN}
                    shouldPlay={false}
                    onReadyForDisplay={({ naturalSize }) => {
                      if (naturalSize.width > 0 && naturalSize.height > 0) {
                        setMediaAspectRatios((current) => ({
                          ...current,
                          [url]: naturalSize.width / naturalSize.height,
                        }));
                      }
                    }}
                  />
                ) : (
                  <Image
                    key={url}
                    source={{ uri: resolveMediaUrl(url) }}
                    style={[styles.postMedia, { aspectRatio: mediaAspectRatios[url] || 1 }]}
                    resizeMode="contain"
                    onLoad={({ nativeEvent }) => {
                      const { width, height } = nativeEvent.source;
                      if (width > 0 && height > 0) {
                        setMediaAspectRatios((current) => ({
                          ...current,
                          [url]: width / height,
                        }));
                      }
                    }}
                  />
                )
              ))}
              <View style={styles.postActions}>
                <TouchableOpacity style={styles.postAction} onPress={() => void toggleLike(ping.id).catch((likeError) =>
                  Alert.alert('Could not update reaction', likeError instanceof Error ? likeError.message : 'Please try again.')
                )}>
                  <Ionicons name={ping.isLiked ? 'heart' : 'heart-outline'} size={20} color={ping.isLiked ? '#dc2626' : '#6b7280'} />
                  <Text style={styles.postActionText}>{ping.likes} Likes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction} onPress={() => void openComments(ping.id)}>
                  <Ionicons name={expandedPingId === ping.id ? 'chatbubble' : 'chatbubble-outline'} size={20} color="#6b7280" />
                  <Text style={styles.postActionText}>{ping.comments} Comments</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.postAction} onPress={() => void Share.share({ message: `${ping.content}\n\nShared on MyGuy` })}>
                  <Ionicons name="share-outline" size={20} color="#6b7280" />
                  <Text style={styles.postActionText}>Share</Text>
                </TouchableOpacity>
                {ping.author.id !== user?.id && (
                  <TouchableOpacity style={styles.postAction} onPress={() => void startConversation(ping.author.id)}>
                    <Ionicons name="chatbubble-ellipses-outline" size={20} color="#c2410c" />
                    <Text style={styles.postActionText}>Message</Text>
                  </TouchableOpacity>
                )}
              </View>
              {expandedPingId === ping.id && (
                <View style={styles.inlineComments}>
                  {!!commentError && <Text style={styles.commentError}>{commentError}</Text>}
                  {commentsLoading ? (
                    <Text style={styles.commentEmpty}>Loading replies…</Text>
                  ) : comments.length === 0 ? (
                    <Text style={styles.commentEmpty}>Start a thoughtful conversation.</Text>
                  ) : comments.map((comment) => (
                    <View key={comment.id} style={styles.commentItem}>
                      <Text style={styles.commentAuthor}>
                        {comment.user.profile?.displayName || comment.user.username}
                      </Text>
                      <Text style={styles.commentBody}>{comment.content}</Text>
                      <View style={styles.commentMeta}>
                        <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleString()}</Text>
                        <TouchableOpacity
                          accessibilityRole="button"
                          onPress={() => setReplyTarget({
                            id: comment.id,
                            name: comment.user.profile?.displayName || comment.user.username,
                          })}
                        >
                          <Text style={styles.commentReply}>Reply</Text>
                        </TouchableOpacity>
                      </View>
                      {(comment.replies || []).map((reply) => (
                        <View key={reply.id} style={styles.commentReplyItem}>
                          <Text style={styles.commentAuthor}>
                            {reply.user.profile?.displayName || reply.user.username}
                          </Text>
                          <Text style={styles.commentBody}>{reply.content}</Text>
                          <Text style={styles.commentDate}>{new Date(reply.createdAt).toLocaleString()}</Text>
                        </View>
                      ))}
                    </View>
                  ))}
                  {replyTarget && (
                    <View style={styles.replyingTo}>
                      <Text style={styles.replyingToText}>Replying to {replyTarget.name}</Text>
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel="Cancel comment reply"
                        onPress={() => setReplyTarget(null)}
                      >
                        <Ionicons name="close-circle" size={18} color="#6b7280" />
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.commentComposer}>
                    <TextInput
                      value={commentText}
                      onChangeText={setCommentText}
                      placeholder={replyTarget ? 'Write a reply' : 'Add a comment'}
                      maxLength={500}
                      style={styles.commentInput}
                    />
                    <TouchableOpacity
                      accessibilityRole="button"
                      disabled={!commentText.trim() || commentPosting}
                      onPress={() => void submitComment()}
                      style={[styles.commentSend, (!commentText.trim() || commentPosting) && styles.commentSendDisabled]}
                    >
                      <Text style={styles.commentSendText}>{commentPosting ? 'Sending…' : replyTarget ? 'Reply' : 'Comment'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          ))
        )}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  postAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  contentContainer: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f4eee8',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
  profileButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff1e5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffe0c2',
  },
  profileInitial: {
    color: '#c2410c',
    fontWeight: '700',
    fontSize: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  quickAction: {
    minWidth: 72,
    alignItems: 'center',
    gap: 6,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  liveActionIcon: {
    backgroundColor: '#c2410c',
  },
  pulseActionIcon: {
    backgroundColor: '#7c3aed',
  },
  notificationsActionIcon: {
    backgroundColor: '#0f766e',
  },
  quickActionLabel: {
    color: '#57534e',
    fontSize: 11,
    fontWeight: '700',
  },
  greeting: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 4,
  },
  greetingTitle: {
    color: '#1f2937',
    fontSize: 23,
    fontWeight: '700',
    letterSpacing: -0.4,
  },
  greetingSubtitle: {
    marginTop: 5,
    color: '#78716c',
    fontSize: 13,
  },
  createPost: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1e8df',
  },
  createPostLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  createPostAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#fff1e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  createPostInitial: {
    color: '#c2410c',
    fontWeight: '700',
    fontSize: 16,
  },
  createPostTitle: {
    color: '#292524',
    fontSize: 14,
    fontWeight: '700',
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarTextSmall: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  createPostPlaceholder: {
    color: '#a8a29e',
    fontSize: 12,
    marginTop: 3,
  },
  createPostButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  composer: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1e8df',
  },
  composerInput: {
    minHeight: 100,
    fontSize: 16,
    marginBottom: 16,
    color: '#111827',
  },
  mediaPickButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: '#fff5eb',
  },
  mediaPickText: {
    color: '#0f766e',
    fontWeight: '600',
    fontSize: 13,
    marginLeft: 7,
  },
  selectedMediaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#f5f5f4',
  },
  selectedMediaName: {
    flex: 1,
    color: '#57534e',
    marginRight: 10,
    fontSize: 12,
  },
  composerMediaError: { color: '#b91c1c', fontSize: 12, marginTop: 8 },
  composerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  composerCancel: {
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  composerCancelText: {
    color: '#6b7280',
    fontSize: 15,
    fontWeight: '600',
  },
  composerPost: {
    backgroundColor: '#f97316',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  composerPostDisabled: {
    opacity: 0.55,
  },
  composerPostText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  storiesContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 8,
  },
  story: {
    marginRight: 12,
    alignItems: 'center',
  },
  storyImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#e5e7eb',
    borderWidth: 3,
    borderColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyAdd: {
    backgroundColor: '#f97316',
    borderStyle: 'dashed',
  },
  storyAvatarText: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  storyName: {
    fontSize: 11,
    color: '#374151',
    marginTop: 6,
    fontWeight: '500',
  },
  feed: {
    marginTop: 26,
  },
  feedHeading: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 12,
  },
  feedTitle: {
    color: '#1f2937',
    fontSize: 18,
    fontWeight: '700',
  },
  feedSubtitle: {
    color: '#a8a29e',
    fontSize: 12,
    marginTop: 3,
  },
  post: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1e8df',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  postAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postAuthorName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  postTime: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  postContent: {
    fontSize: 15,
    color: '#1f2937',
    marginBottom: 16,
    lineHeight: 22,
  },
  postMedia: {
    width: '100%',
    maxHeight: 520,
    backgroundColor: '#1c1917',
    borderRadius: 14,
    marginBottom: 14,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  postActionText: {
    fontSize: 13,
    color: '#6b7280',
    marginLeft: 6,
    fontWeight: '500',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 28,
    fontSize: 15,
  },
  emptyText: {
    textAlign: 'center',
    color: '#78716c',
    paddingHorizontal: 12,
    fontSize: 13,
    lineHeight: 19,
  },
  statusCard: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    paddingHorizontal: 22,
    paddingVertical: 28,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#f1e8df',
  },
  emptyIcon: {
    width: 54,
    height: 54,
    borderRadius: 18,
    backgroundColor: '#fff1e5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    color: '#292524',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f97316',
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  inlineComments: {
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1e8df',
  },
  commentItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1e8df',
  },
  commentAuthor: {
    color: '#292524',
    fontWeight: '700',
    marginBottom: 4,
  },
  commentBody: {
    color: '#44403c',
    fontSize: 14,
    lineHeight: 20,
  },
  commentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  commentDate: {
    color: '#a8a29e',
    fontSize: 11,
  },
  commentReply: {
    color: '#c2410c',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 14,
  },
  commentReplyItem: {
    marginTop: 12,
    marginLeft: 14,
    paddingLeft: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#f1e8df',
  },
  commentEmpty: {
    color: '#78716c',
    paddingVertical: 16,
    textAlign: 'center',
  },
  replyingTo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff1e5',
    borderRadius: 10,
    marginBottom: 8,
  },
  replyingToText: {
    color: '#7c2d12',
    fontSize: 12,
    fontWeight: '600',
  },
  commentComposer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 10,
  },
  commentInput: {
    flex: 1,
    color: '#292524',
    backgroundColor: '#f5f5f4',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  commentSend: {
    marginLeft: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 18,
    backgroundColor: '#f97316',
  },
  commentSendDisabled: {
    opacity: 0.55,
  },
  commentSendText: {
    color: '#ffffff',
    fontWeight: '700',
  },
  commentError: {
    color: '#b91c1c',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
});
