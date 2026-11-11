import React, { useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, StyleSheet, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useChats, type Chat } from '../../src/contexts/ChatContext';
import { router } from 'expo-router';
import { useThemedStyles } from '../../src/contexts/ThemeContext';
import { ThemedTextInput } from '../../src/components/ThemedTextInput';
import { resolveMediaUrl } from '../../src/lib/api';

type ChatFilter = 'all' | 'unread' | 'online';

function formatChatTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const now = new Date();
  if (date.toDateString() === now.toDateString()) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  }
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function ChatsScreen() {
  const { chats, loading, error, refresh, selectChat } = useChats();
  const styles = useThemedStyles(baseStyles);
  const [activeFilter, setActiveFilter] = useState<ChatFilter>('all');
  const [search, setSearch] = useState('');
  const directChats = chats.filter((chat) => !chat.isGroup);

  const onlineCount = directChats.filter((chat) => chat.isOnline).length;
  const filteredChats = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return directChats.filter((chat) => {
      if (activeFilter === 'unread' && !chat.unreadCount) return false;
      if (activeFilter === 'online' && !chat.isOnline) return false;
      return !query || `${chat.name} ${chat.username} ${chat.lastMessage || ''}`.toLocaleLowerCase().includes(query);
    });
  }, [activeFilter, directChats, search]);

  const handleChatPress = (chat: Chat) => {
    void selectChat(chat);
    router.push('/chat-detail');
  };

  const filters: Array<{ id: ChatFilter; label: string; count?: number }> = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', count: directChats.filter((chat) => chat.unreadCount > 0).length },
    { id: 'online', label: 'Online', count: onlineCount },
  ];

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor="#c2410c" />}
    >
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>YOUR SPACE TO TALK</Text>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.presenceSummary}>
            <View style={styles.onlineDot} />
            <Text style={styles.presenceText}>
              {onlineCount ? `${onlineCount} ${onlineCount === 1 ? 'person' : 'people'} around now` : 'Your conversations, all in one place'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Start a new conversation"
          style={styles.composeButton}
          onPress={() => router.push('/(tabs)/discover')}
        >
          <Ionicons name="create-outline" size={21} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBox}>
        <Ionicons name="search-outline" size={19} color="#78716c" />
        <ThemedTextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search people or messages"
          accessibilityLabel="Search conversations"
          returnKeyType="search"
          style={styles.searchInput}
        />
        {!!search && (
          <TouchableOpacity accessibilityLabel="Clear conversation search" onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={19} color="#78716c" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        {filters.map((filter) => {
          const selected = activeFilter === filter.id;
          return (
            <TouchableOpacity
              key={filter.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => setActiveFilter(filter.id)}
              style={[styles.filter, selected && styles.activeFilter]}
            >
              <Text style={[styles.filterText, selected && styles.activeFilterText]}>{filter.label}</Text>
              {!!filter.count && (
                <Text style={[styles.filterCount, selected && styles.activeFilterCount]}>{filter.count}</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.listHeading}>
        <Text style={styles.listTitle}>{activeFilter === 'online' ? 'Here right now' : 'Recent conversations'}</Text>
        <Text style={styles.listCount}>{filteredChats.length}</Text>
      </View>

      <View style={styles.chatList}>
        {loading && chats.length === 0 ? (
          <Text style={styles.loadingText}>Loading your conversations…</Text>
        ) : error ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name="cloud-offline-outline" size={24} color="#c2410c" /></View>
            <Text style={styles.emptyTitle}>Couldn’t load messages</Text>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity onPress={() => void refresh()} style={styles.retryButton}>
              <Text style={styles.retryText}>Try again</Text>
            </TouchableOpacity>
          </View>
        ) : filteredChats.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}><Ionicons name={search ? 'search-outline' : 'chatbubbles-outline'} size={24} color="#c2410c" /></View>
            <Text style={styles.emptyTitle}>
              {search ? 'No matches yet' : activeFilter === 'online' ? 'Nobody online just now' : 'A quiet inbox'}
            </Text>
            <Text style={styles.emptyText}>
              {search ? 'Try a different name or message.' : chats.length ? 'There are no conversations in this view.' : 'When you start a conversation, it will find a home here.'}
            </Text>
            {!search && chats.length === 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/discover')} style={styles.retryButton}>
                <Text style={styles.retryText}>Find someone to talk to</Text>
                <Ionicons name="arrow-forward" size={15} color="#c2410c" />
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredChats.map((chat) => (
            <TouchableOpacity
              key={chat.id}
              accessibilityRole="button"
              accessibilityLabel={`Conversation with ${chat.name}${chat.isOnline ? ', online' : ''}`}
              style={styles.chatItem}
              onPress={() => handleChatPress(chat)}
            >
              <View style={styles.avatarWrap}>
                <View style={[styles.chatAvatar, !chat.avatar && styles.avatarFallback]}>
                  {chat.avatar ? (
                    <Image source={{ uri: resolveMediaUrl(chat.avatar) }} style={styles.avatarImage} />
                  ) : (
                    <Text style={styles.chatAvatarText}>{(chat.name || '?')[0].toUpperCase()}</Text>
                  )}
                </View>
                <View style={[styles.statusDot, chat.isOnline ? styles.statusOnline : styles.statusOffline]} />
              </View>
              <View style={styles.chatInfo}>
                <View style={styles.chatTopLine}>
                  <Text numberOfLines={1} style={styles.chatName}>{chat.name}</Text>
                  <Text style={styles.chatTime}>{formatChatTime(chat.lastMessageAt)}</Text>
                </View>
                <View style={styles.chatBottomLine}>
                  <Text numberOfLines={1} style={[styles.chatMessage, chat.unreadCount > 0 && styles.unreadMessage]}>
                    {chat.isOnline && !chat.lastMessage ? 'Online now' : chat.lastMessage || `@${chat.username}`}
                  </Text>
                  {chat.unreadCount > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
      <Text style={styles.footerNote}>Online status updates while MyGuy is open.</Text>

    </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf5' },
  content: { paddingBottom: 28 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 22, paddingBottom: 17 },
  headerCopy: { flex: 1 },
  eyebrow: { color: '#0f766e', fontSize: 9, fontWeight: '900', letterSpacing: 1.6 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#292524', marginTop: 3 },
  presenceSummary: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#16a34a', marginRight: 7 },
  presenceText: { fontSize: 12, color: '#6b625b' },
  composeButton: { width: 44, height: 44, borderRadius: 16, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' },
  createCrewButton: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 15, padding: 12, borderRadius: 17, backgroundColor: '#e7f3ed', borderWidth: 1, borderColor: '#d3e8dc' },
  createCrewIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center' },
  createCrewCopy: { flex: 1, marginHorizontal: 10 },
  createCrewTitle: { color: '#14532d', fontSize: 13, fontWeight: '800' },
  createCrewDescription: { color: '#52715f', fontSize: 11, marginTop: 2 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 48, marginHorizontal: 16, paddingHorizontal: 13, borderRadius: 16, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1e8df' },
  searchInput: { flex: 1, minHeight: 44, paddingVertical: 8, fontSize: 14, borderWidth: 0, backgroundColor: 'transparent' },
  filters: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 15, paddingBottom: 19 },
  filter: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 14, borderWidth: 1, borderColor: '#f1e8df', backgroundColor: '#ffffff' },
  activeFilter: { backgroundColor: '#0f766e', borderColor: '#0f766e' },
  filterText: { fontSize: 12, fontWeight: '700', color: '#6b625b' },
  activeFilterText: { color: '#ffffff' },
  filterCount: { fontSize: 10, fontWeight: '800', color: '#c2410c' },
  activeFilterCount: { color: '#ffffff' },
  listHeading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 7 },
  listTitle: { color: '#292524', fontSize: 14, fontWeight: '800' },
  listCount: { color: '#9a6b51', fontSize: 11, fontWeight: '700', marginLeft: 7 },
  chatList: { marginHorizontal: 12, paddingHorizontal: 4, borderRadius: 22, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1e8df', overflow: 'hidden' },
  chatItem: { flexDirection: 'row', alignItems: 'center', minHeight: 79, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f0eb' },
  avatarWrap: { width: 52, height: 52, marginRight: 12, position: 'relative' },
  chatAvatar: { width: 50, height: 50, borderRadius: 18, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1e5' },
  avatarFallback: { backgroundColor: '#0f766e' },
  avatarImage: { width: '100%', height: '100%' },
  chatAvatarText: { color: '#ffffff', fontSize: 18, fontWeight: '800' },
  statusDot: { width: 13, height: 13, position: 'absolute', right: -1, bottom: -1, borderRadius: 7, borderWidth: 2, borderColor: '#ffffff' },
  statusOnline: { backgroundColor: '#16a34a' },
  statusOffline: { backgroundColor: '#c4b8ae' },
  chatInfo: { flex: 1, justifyContent: 'center', minHeight: 61 },
  chatTopLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  chatName: { flex: 1, fontSize: 14, fontWeight: '800', color: '#292524' },
  chatTime: { fontSize: 10, color: '#9a6b51' },
  chatBottomLine: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 5 },
  chatMessage: { flex: 1, fontSize: 12, color: '#6b625b' },
  unreadMessage: { fontWeight: '800', color: '#292524' },
  unreadBadge: { minWidth: 20, height: 20, paddingHorizontal: 6, borderRadius: 10, backgroundColor: '#c2410c', alignItems: 'center', justifyContent: 'center' },
  unreadBadgeText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  loadingText: { textAlign: 'center', color: '#6b625b', padding: 28 },
  emptyState: { alignItems: 'center', paddingHorizontal: 22, paddingVertical: 34 },
  emptyIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1e5' },
  emptyTitle: { color: '#292524', fontSize: 14, fontWeight: '800', marginTop: 12 },
  emptyText: { color: '#6b625b', fontSize: 12, textAlign: 'center', lineHeight: 18, marginTop: 5 },
  retryButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 11, padding: 8 },
  retryText: { color: '#c2410c', fontWeight: '800', fontSize: 12 },
  footerNote: { textAlign: 'center', color: '#9a6b51', fontSize: 10, marginTop: 14 },
  crewModal: { flex: 1, backgroundColor: '#fffaf5' },
  crewModalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1e8df' },
  crewCloseButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#fff6ed' },
  crewModalTitleWrap: { flex: 1, marginLeft: 10 },
  crewModalTitle: { color: '#292524', fontSize: 16, fontWeight: '900' },
  crewModalSubtitle: { color: '#6b625b', fontSize: 11, marginTop: 2 },
  crewCreateButton: { minWidth: 70, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#0f766e' },
  crewCreateButtonDisabled: { opacity: 0.6 },
  crewCreateButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  crewModalContent: { paddingHorizontal: 17, paddingTop: 19, paddingBottom: 35 },
  fieldLabel: { color: '#292524', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  crewNameInput: { minHeight: 46, paddingHorizontal: 13, borderWidth: 1, borderColor: '#eadfd5', borderRadius: 14, backgroundColor: '#ffffff', color: '#292524', fontSize: 14 },
  memberHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  memberCount: { color: '#0f766e', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  memberSearchBox: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, paddingLeft: 12, paddingRight: 6, borderWidth: 1, borderColor: '#eadfd5', borderRadius: 14, backgroundColor: '#ffffff' },
  memberSearchInput: { flex: 1, minHeight: 44, paddingVertical: 7, borderWidth: 0, backgroundColor: 'transparent', color: '#292524', fontSize: 13 },
  memberSearchButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#e7f3ed' },
  selectedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  selectedMember: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, backgroundColor: '#e7f3ed' },
  selectedMemberText: { maxWidth: 175, color: '#14532d', fontSize: 11, fontWeight: '700' },
  memberResults: { marginTop: 11, borderRadius: 16, overflow: 'hidden', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1e8df' },
  memberHint: { color: '#6b625b', fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 23, paddingVertical: 25 },
  memberResult: { flexDirection: 'row', alignItems: 'center', minHeight: 67, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f0eb' },
  memberAvatar: { width: 40, height: 40, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  memberAvatarFallback: { backgroundColor: '#0f766e' },
  memberAvatarImage: { width: '100%', height: '100%' },
  memberAvatarInitial: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  memberIdentity: { flex: 1, minWidth: 0 },
  memberName: { color: '#292524', fontSize: 12, fontWeight: '800' },
  memberUsername: { color: '#8b7567', fontSize: 10, marginTop: 3 },
  crewError: { color: '#b91c1c', fontSize: 12, lineHeight: 17, marginTop: 11 },
});
