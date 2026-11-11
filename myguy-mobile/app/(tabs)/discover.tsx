import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Image, RefreshControl, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDiscover } from '../../src/contexts/DiscoverContext';
import { useChats } from '../../src/contexts/ChatContext';
import { router } from 'expo-router';
import { useThemedStyles } from '../../src/contexts/ThemeContext';
import { createPing, getLiveRooms, resolveMediaUrl, type ApiLiveRoom } from '../../src/lib/api';
import { ThemedTextInput as TextInput } from '../../src/components/ThemedTextInput';

const dailyRipples = [
  'What small thing made your day brighter recently?',
  'What is something you wish more people understood about your community?',
  'Share a song, idea, or place that always brings you back to yourself.',
  'What is one kind thing someone did that you still remember?',
  'What are you learning lately, even if you are still a beginner?',
  'If you could bring people together around one idea, what would it be?',
  'What is a local tradition or hidden gem more people should know?',
];

function getDailyRipple() {
  const dayNumber = Math.floor(Date.now() / 86_400_000);
  return dailyRipples[((dayNumber % dailyRipples.length) + dailyRipples.length) % dailyRipples.length];
}

export default function DiscoverScreen() {
  const {
    suggestedUsers,
    circles,
    trendingPings,
    loading,
    error,
    refresh,
    search,
    sendRequest,
    joinCircle,
  } = useDiscover();
  const { startChat } = useChats();
  const styles = useThemedStyles(baseStyles);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [searchResults, setSearchResults] = useState<{
    users: typeof suggestedUsers;
    pings: typeof trendingPings;
    circles: typeof circles;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [rippleOpen, setRippleOpen] = useState(false);
  const [rippleAnswer, setRippleAnswer] = useState('');
  const [ripplePosting, setRipplePosting] = useState(false);
  const [rippleError, setRippleError] = useState<string | null>(null);
  const [rippleNotice, setRippleNotice] = useState<string | null>(null);
  const [liveRooms, setLiveRooms] = useState<ApiLiveRoom[]>([]);
  const [liveLoading, setLiveLoading] = useState(true);
  const [liveError, setLiveError] = useState<string | null>(null);
  const dailyRipple = getDailyRipple();

  const refreshLiveRooms = useCallback(async () => {
    try {
      const response = await getLiveRooms();
      setLiveRooms(response.rooms);
      setLiveError(null);
    } catch (loadError) {
      setLiveError(loadError instanceof Error ? loadError.message : 'Could not load live streams.');
    } finally {
      setLiveLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshLiveRooms();
  }, [refreshLiveRooms]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    let cancelled = false;
    setSearchResults(null);
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      setActionError(null);
      try {
        const results = await search(query);
        if (!cancelled) setSearchResults(results);
      } catch (searchError) {
        if (!cancelled) {
          setActionError(searchError instanceof Error ? searchError.message : 'Search failed.');
          setSearchResults({ users: [], pings: [], circles: [] });
        }
      } finally {
        if (!cancelled) setSearchLoading(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery, search]);

  const displayUsers = searchResults?.users ?? suggestedUsers;
  const displayCircles = searchResults?.circles ?? circles;
  const displayPings = searchResults?.pings ?? trendingPings;
  const runAction = async (key: string, action: () => Promise<void>) => {
    if (busyAction) return;
    setActionError(null);
    setBusyAction(key);
    try {
      await action();
    } catch (actionFailure) {
      setActionError(actionFailure instanceof Error ? actionFailure.message : 'The action failed.');
    } finally {
      setBusyAction(null);
    }
  };

  const shareRipple = async () => {
    const answer = rippleAnswer.trim();
    if (!answer || ripplePosting) return;
    setRipplePosting(true);
    setRippleError(null);
    try {
      await createPing({ content: `Today's Ripple: ${dailyRipple}\n\n${answer}` });
      setRippleAnswer('');
      setRippleOpen(false);
      setRippleNotice('Your Ripple is live in the community feed.');
      void refresh();
    } catch (postError) {
      setRippleError(postError instanceof Error ? postError.message : 'Could not share your Ripple.');
    } finally {
      setRipplePosting(false);
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={loading || liveLoading} onRefresh={() => { void refresh(); void refreshLiveRooms(); }} tintColor="#f97316" />}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>YOUR NEXT CONNECTION</Text>
          <Text style={styles.title}>Discover</Text>
          <Text style={styles.subtitle}>Find people, conversations, and circles worth joining.</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Refresh Discover"
          style={styles.refreshButton}
          onPress={() => void refresh()}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator size="small" color="#f97316" />
            : <Ionicons name="refresh-outline" size={20} color="#9a4d1b" />}
        </TouchableOpacity>
      </View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        {searchLoading
          ? <ActivityIndicator size="small" color="#f97316" style={styles.searchIcon} />
          : <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />}
        <TextInput
          style={styles.searchInput}
          placeholder="Search people, circles, topics..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          returnKeyType="search"
        />
        {!!searchQuery && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear Discover search"
            onPress={() => setSearchQuery('')}
            style={styles.clearSearch}
          >
            <Ionicons name="close-circle" size={19} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {['all', 'live', 'trending', 'people', 'circles'].map((tab) => (
          <TouchableOpacity
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab }}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {!searchQuery && (activeTab === 'all' || activeTab === 'live') && (
        <View style={styles.liveSection}>
          <View style={styles.liveSectionHeading}>
            <View>
              <Text style={styles.liveEyebrow}>HAPPENING NOW</Text>
              <Text style={styles.liveTitle}>Live from the community</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Start a live stream"
              style={styles.goLiveButton}
              onPress={() => router.push('/live')}
            >
              <Ionicons name="radio-outline" size={15} color="#ffffff" />
              <Text style={styles.goLiveButtonText}>Go live</Text>
            </TouchableOpacity>
          </View>
          {liveLoading ? (
            <ActivityIndicator color="#0f766e" style={styles.liveLoading} />
          ) : liveError ? (
            <Text style={styles.liveEmpty}>{liveError}</Text>
          ) : liveRooms.length === 0 ? (
            <View style={styles.liveEmptyCard}>
              <Ionicons name="radio-outline" size={23} color="#0f766e" />
              <View style={styles.liveEmptyCopy}>
                <Text style={styles.liveEmptyTitle}>A quiet moment</Text>
                <Text style={styles.liveEmpty}>No one is live right now. Start a conversation when you’re ready.</Text>
              </View>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.liveCards}>
              {liveRooms.map((room) => (
                <TouchableOpacity
                  key={room.id}
                  accessibilityRole="button"
                  accessibilityLabel={`Join live ${room.name}`}
                  style={styles.liveCard}
                  onPress={() => router.push({ pathname: '/live', params: { roomId: room.id } })}
                >
                  <View style={styles.liveCardTop}>
                    <View style={styles.liveBadge}><View style={styles.liveBadgeDot} /><Text style={styles.liveBadgeText}>LIVE</Text></View>
                    <Ionicons name={room.type === 'video' ? 'videocam-outline' : 'mic-outline'} size={17} color="#ffffff" />
                  </View>
                  <Text numberOfLines={2} style={styles.liveCardName}>{room.name}</Text>
                  <Text numberOfLines={1} style={styles.liveCardHost}>{room.host.profile?.displayName || room.host.username}</Text>
                  <View style={styles.liveCardFooter}>
                    {!!room.category && <Text numberOfLines={1} style={styles.liveCategory}>{room.category}</Text>}
                    <View style={styles.viewerCount}><Ionicons name="eye-outline" size={13} color="#cbd5d1" /><Text style={styles.viewerCountText}>{room.viewerCount + 1}</Text></View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {!searchQuery && (activeTab === 'all' || activeTab === 'trending') && (
        <View style={styles.rippleCard}>
          <View style={styles.rippleHeader}>
            <View style={styles.rippleIcon}>
              <Ionicons name="sparkles" size={19} color="#ffffff" />
            </View>
            <View style={styles.rippleHeaderText}>
              <Text style={styles.rippleEyebrow}>A SHARED DAILY PROMPT</Text>
              <Text style={styles.rippleTitle}>Today’s Ripple</Text>
            </View>
            <Ionicons name="radio-outline" size={20} color="#8c4e2e" />
          </View>
          <Text style={styles.rippleQuestion}>{dailyRipple}</Text>
          <Text style={styles.rippleDescription}>One prompt, many perspectives. Add your voice to the public feed.</Text>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.rippleButton}
            onPress={() => {
              setRippleError(null);
              setRippleNotice(null);
              setRippleOpen(true);
            }}
          >
            <Ionicons name="create-outline" size={17} color="#ffffff" />
            <Text style={styles.rippleButtonText}>Add your voice</Text>
          </TouchableOpacity>
        </View>
      )}

      {!!rippleNotice && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Dismiss confirmation"
          style={styles.noticeBanner}
          onPress={() => setRippleNotice(null)}
        >
          <Ionicons name="checkmark-circle" size={18} color="#15803d" />
          <Text style={styles.noticeText}>{rippleNotice}</Text>
          <Ionicons name="close" size={16} color="#6b625b" />
        </TouchableOpacity>
      )}

      {(activeTab === 'all' || activeTab === 'trending') && (
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{searchQuery ? 'Matching moments' : 'Trending moments'}</Text>
            <Text style={styles.sectionCount}>{displayPings.length}</Text>
          </View>
          {searchLoading ? <ActivityIndicator color="#f97316" /> : displayPings.length === 0 ? (
            <Text style={styles.emptyText}>{error ? 'Moments could not be loaded. Pull down to retry.' : 'No matching moments yet.'}</Text>
          ) : displayPings.map((ping, index) => (
            <View key={ping.id} style={styles.trendingItem}>
              <View style={styles.trendingRank}>
                <Text style={styles.trendingRankText}>{index + 1}</Text>
              </View>
              <View style={styles.trendingContent}>
                <Text style={styles.trendingText} numberOfLines={2}>{ping.content}</Text>
                <Text style={styles.trendingMeta}>Shared by {ping.authorName}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {(activeTab === 'all' || activeTab === 'people') && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{searchQuery ? 'People' : 'People to connect'}</Text>
          {searchLoading || (loading && !searchResults) ? (
          <Text style={styles.loadingText}>Loading...</Text>
          ) : displayUsers.length === 0 ? (
            <Text style={styles.emptyText}>{error ? 'People could not be loaded. Pull down to retry.' : 'No people found.'}</Text>
          ) : displayUsers.map((user) => (
            <View key={user.id} style={styles.suggestedPerson}>
              <View style={styles.suggestedAvatar}>
                {user.avatar ? (
                  <Image source={{ uri: resolveMediaUrl(user.avatar) }} style={styles.suggestedAvatarImage} />
                ) : <Text style={styles.suggestedAvatarText}>{(user.displayName || user.username || '?')[0].toUpperCase()}</Text>}
              </View>
              <View style={styles.suggestedInfo}>
                <Text style={styles.suggestedName}>{user.displayName}</Text>
                <Text style={styles.suggestedUsername}>@{user.username}</Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Message ${user.displayName}`}
                style={styles.messageButton}
                disabled={busyAction !== null}
                onPress={() => void runAction(`message:${user.id}`, async () => {
                  await startChat(user.id);
                  router.push('/chat-detail');
                })}
              >
                {busyAction === `message:${user.id}`
                  ? <ActivityIndicator size="small" color="#f97316" />
                  : <Ionicons name="chatbubble-outline" size={18} color="#f97316" />}
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                style={[styles.connectButton, busyAction !== null && styles.actionDisabled]}
                disabled={busyAction !== null}
                onPress={() => void runAction(`connect:${user.id}`, async () => {
                  await sendRequest(user.id);
                  setSearchResults((current) => current
                    ? { ...current, users: current.users.filter((item) => item.id !== user.id) }
                    : current);
                })}
              >
                {busyAction === `connect:${user.id}`
                  ? <ActivityIndicator size="small" color="#ffffff" />
                  : <Text style={styles.connectButtonText}>Connect</Text>}
              </TouchableOpacity>
            </View>
          ))
            }
        </View>
      )}

      {(activeTab === 'all' || activeTab === 'circles') && (
        <View style={styles.section}>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{searchQuery ? 'Circles' : 'Popular circles'}</Text>
            <Text style={styles.sectionCount}>{displayCircles.length}</Text>
          </View>
          {searchLoading || (loading && !searchResults) ? <Text style={styles.loadingText}>Loading...</Text> :
            displayCircles.length === 0 ? <Text style={styles.emptyText}>{error ? 'Circles could not be loaded. Pull down to retry.' : 'No circles found.'}</Text> :
            displayCircles.map((circle) => (
            <View key={circle.id} style={styles.circleItem}>
              <View style={styles.circleIcon}>
                <Ionicons name="people" size={20} color="#ffffff" />
              </View>
              <View style={styles.circleInfo}>
                <Text style={styles.circleName}>{circle.name}</Text>
                <Text style={styles.circleMembers}>
                  {circle.memberCount} {circle.memberCount === 1 ? 'member' : 'members'}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                style={[styles.joinButton, busyAction !== null && styles.actionDisabled]}
                disabled={busyAction !== null}
                onPress={() => void runAction(`join:${circle.id}`, async () => {
                  await joinCircle(circle.id);
                  setSearchResults((current) => current
                    ? { ...current, circles: current.circles.filter((item) => item.id !== circle.id) }
                    : current);
                })}
              >
                {busyAction === `join:${circle.id}`
                  ? <ActivityIndicator size="small" color="#ffffff" />
                  : <Text style={styles.joinButtonText}>Join</Text>}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {!!error && (
        <View style={styles.section}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => void refresh()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}
      {!!actionError && <Text style={styles.errorText}>{actionError}</Text>}

      <Modal
        visible={rippleOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRippleOpen(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity
            style={styles.modalScrim}
            activeOpacity={1}
            accessibilityLabel="Close Ripple composer"
            onPress={() => setRippleOpen(false)}
          />
          <View style={styles.rippleModal}>
            <View style={styles.modalHeading}>
              <View style={styles.rippleIconSmall}>
                <Ionicons name="sparkles" size={16} color="#ffffff" />
              </View>
              <Text style={styles.modalTitle}>Answer today’s Ripple</Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close Ripple composer"
                onPress={() => setRippleOpen(false)}
              >
                <Ionicons name="close-circle-outline" size={25} color="#6b625b" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalQuestion}>{dailyRipple}</Text>
            <TextInput
              style={styles.rippleInput}
              placeholder="Your perspective can start a conversation..."
              value={rippleAnswer}
              onChangeText={setRippleAnswer}
              multiline
              maxLength={500}
              textAlignVertical="top"
              accessibilityLabel="Your Ripple response"
            />
            <Text style={styles.characterCount}>{rippleAnswer.length}/500</Text>
            {!!rippleError && <Text style={styles.rippleError}>{rippleError}</Text>}
            <Text style={styles.publicNote}>This response will be shared as a public Ping.</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={[styles.rippleSubmit, (!rippleAnswer.trim() || ripplePosting) && styles.actionDisabled]}
              disabled={!rippleAnswer.trim() || ripplePosting}
              onPress={() => void shareRipple()}
            >
              {ripplePosting
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <Ionicons name="paper-plane-outline" size={17} color="#ffffff" />}
              <Text style={styles.rippleButtonText}>{ripplePosting ? 'Sharing...' : 'Share with everyone'}</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 20,
    paddingBottom: 4,
  },
  headerCopy: { flex: 1, marginRight: 12 },
  eyebrow: { color: '#9a6b51', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#292524', fontSize: 27, fontWeight: '900', marginTop: 3 },
  subtitle: { color: '#6b625b', fontSize: 12, marginTop: 4, lineHeight: 17 },
  refreshButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff4eb',
    borderWidth: 1,
    borderColor: '#f5dfce',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    margin: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
  },
  clearSearch: { marginLeft: 8, padding: 2 },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  liveSection: {
    marginHorizontal: 16,
    marginTop: 14,
    padding: 15,
    borderRadius: 19,
    backgroundColor: '#e7f3ed',
    borderWidth: 1,
    borderColor: '#cfe5db',
  },
  liveSectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  liveEyebrow: { color: '#0f766e', fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  liveTitle: { color: '#173c37', fontSize: 16, fontWeight: '900', marginTop: 3 },
  goLiveButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 9, borderRadius: 12, backgroundColor: '#0f766e' },
  goLiveButtonText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  liveLoading: { padding: 18 },
  liveEmptyCard: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13, marginTop: 13, borderRadius: 14, backgroundColor: '#f5fbf8' },
  liveEmptyCopy: { flex: 1 },
  liveEmptyTitle: { color: '#173c37', fontSize: 13, fontWeight: '800', marginBottom: 2 },
  liveEmpty: { color: '#64746d', fontSize: 11, lineHeight: 16, paddingTop: 12 },
  liveCards: { gap: 10, paddingTop: 13, paddingRight: 2 },
  liveCard: { width: 176, minHeight: 143, padding: 13, borderRadius: 16, backgroundColor: '#183b36' },
  liveCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: '#a63732' },
  liveBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ffffff' },
  liveBadgeText: { color: '#ffffff', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  liveCardName: { color: '#ffffff', fontSize: 14, lineHeight: 19, fontWeight: '800', marginTop: 12 },
  liveCardHost: { color: '#d1ded8', fontSize: 11, marginTop: 4 },
  liveCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 12 },
  liveCategory: { flex: 1, color: '#a6d3c3', fontSize: 10, fontWeight: '700', marginRight: 8 },
  viewerCount: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  viewerCountText: { color: '#cbd5d1', fontSize: 10, fontWeight: '700' },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  activeTab: {
    backgroundColor: '#f97316',
    borderColor: '#f97316',
  },
  tabText: {
    fontSize: 14,
    color: '#6b7280',
  },
  activeTabText: {
    color: '#ffffff',
  },
  section: {
    backgroundColor: '#ffffff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 0,
  },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  sectionCount: { minWidth: 24, textAlign: 'center', color: '#9a4d1b', backgroundColor: '#fff1e6', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 12, fontSize: 11, fontWeight: '800' },
  rippleCard: {
    marginHorizontal: 16,
    marginTop: 12,
    padding: 17,
    borderRadius: 20,
    backgroundColor: '#fff1e5',
    borderWidth: 1,
    borderColor: '#f3d9c4',
  },
  rippleHeader: { flexDirection: 'row', alignItems: 'center' },
  rippleIcon: { width: 38, height: 38, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#b45324', marginRight: 10 },
  rippleIconSmall: { width: 30, height: 30, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: '#b45324', marginRight: 9 },
  rippleHeaderText: { flex: 1 },
  rippleEyebrow: { color: '#8c4e2e', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  rippleTitle: { color: '#292524', fontSize: 16, fontWeight: '900', marginTop: 2 },
  rippleQuestion: { color: '#292524', fontSize: 17, lineHeight: 24, fontWeight: '800', marginTop: 17 },
  rippleDescription: { color: '#6b625b', fontSize: 12, lineHeight: 17, marginTop: 7 },
  rippleButton: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 7, marginTop: 15, backgroundColor: '#b45324', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 13 },
  rippleButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  noticeBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 10, paddingHorizontal: 13, paddingVertical: 11, borderRadius: 12, backgroundColor: '#ecfdf3', borderWidth: 1, borderColor: '#bbf7d0' },
  noticeText: { flex: 1, color: '#166534', fontSize: 12, fontWeight: '700' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(21,18,16,0.45)' },
  modalScrim: { flex: 1 },
  rippleModal: { paddingHorizontal: 19, paddingTop: 18, paddingBottom: 30, borderTopLeftRadius: 25, borderTopRightRadius: 25, backgroundColor: '#fffaf5' },
  modalHeading: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  modalTitle: { flex: 1, color: '#292524', fontSize: 17, fontWeight: '800' },
  modalQuestion: { color: '#5b4538', fontSize: 15, lineHeight: 22, fontWeight: '700', marginBottom: 12 },
  rippleInput: { minHeight: 130, maxHeight: 210, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: '#e8d8cb', backgroundColor: '#ffffff', color: '#292524', fontSize: 14 },
  characterCount: { alignSelf: 'flex-end', color: '#8a7b71', fontSize: 10, marginTop: 5 },
  rippleError: { color: '#b91c1c', fontSize: 12, marginTop: 8 },
  publicNote: { color: '#6b625b', fontSize: 11, marginTop: 10 },
  rippleSubmit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 46, marginTop: 13, borderRadius: 14, backgroundColor: '#b45324' },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  trendingRank: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  trendingRankText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trendingContent: {
    flex: 1,
  },
  trendingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  trendingMeta: {
    fontSize: 12,
    color: '#6b7280',
  },
  suggestedPerson: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  suggestedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f97316',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestedAvatarText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestedAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  suggestedInfo: {
    flex: 1,
  },
  suggestedName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  suggestedUsername: {
    fontSize: 12,
    color: '#6b7280',
  },
  connectButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  messageButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fed7aa',
    marginRight: 8,
  },
  connectButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  actionDisabled: { opacity: 0.65 },
  circleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  circleIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  circleInfo: {
    flex: 1,
  },
  circleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  circleMembers: {
    fontSize: 12,
    color: '#6b7280',
  },
  joinButton: {
    backgroundColor: '#f97316',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    padding: 16,
  },
  errorText: {
    color: '#b91c1c',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryText: {
    color: '#f97316',
    fontWeight: '600',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});
