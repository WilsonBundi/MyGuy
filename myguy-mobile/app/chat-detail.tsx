import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { useChats } from '../src/contexts/ChatContext';
import { useAuth } from '../src/contexts/AuthContext';
import { router } from 'expo-router';
import { useTheme, useThemedStyles } from '../src/contexts/ThemeContext';
import { ThemedTextInput } from '../src/components/ThemedTextInput';
import { resolveMediaUrl, uploadMedia } from '../src/lib/api';
import { MediaAttachmentPreview, MediaPickerSheet, type SharedMediaAsset } from '../src/components/MediaAttachment';

function lastSeenLabel(value?: string | null) {
  if (!value) return 'Offline';
  const elapsedMinutes = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 60000));
  if (elapsedMinutes < 1) return 'Last active just now';
  if (elapsedMinutes < 60) return `Last active ${elapsedMinutes}m ago`;
  const hours = Math.floor(elapsedMinutes / 60);
  if (hours < 24) return `Last active ${hours}h ago`;
  return `Last active ${new Date(value).toLocaleDateString()}`;
}

export default function ChatDetailScreen() {
  const { activeChat, messages, messagesLoading, messagesError, selectChat, send } = useChats();
  const { user } = useAuth();
  const styles = useThemedStyles(baseStyles);
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<SharedMediaAsset | null>(null);
  const [isAnnouncement, setIsAnnouncement] = useState(false);

  const handleSend = async () => {
    const content = message.trim();
    if ((!content && !selectedMedia) || sending) return;
    setSendError(null);
    setSending(true);
    try {
      if (selectedMedia) {
        const uploaded = await uploadMedia(selectedMedia, 'chat');
        await send({
          content,
          messageType: uploaded.mediaType,
          mediaUrl: uploaded.url,
          isAnnouncement,
          attachmentName: uploaded.mediaType === 'file'
            ? selectedMedia.fileName || uploaded.filename
            : undefined,
        });
      } else {
        await send({ content, isAnnouncement });
      }
      setMessage('');
      setSelectedMedia(null);
      setIsAnnouncement(false);
    } catch (error) {
      setSendError(error instanceof Error ? error.message : 'Could not send message.');
    } finally {
      setSending(false);
    }
  };

  if (!activeChat) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Choose a conversation to continue.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.retryText}>Back to chats</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.safeArea, { backgroundColor: colors.surface }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to messages" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <View style={styles.avatarWrap}>
          <View style={[styles.avatar, !activeChat.avatar && styles.avatarFallback]}>
            {activeChat.avatar ? (
              <Image source={{ uri: resolveMediaUrl(activeChat.avatar) }} style={styles.avatarImage} />
            ) : activeChat.isGroup ? (
              <Ionicons name="people" size={20} color="#ffffff" />
            ) : (
              <Text style={styles.avatarInitial}>{activeChat.name[0]?.toUpperCase() || 'M'}</Text>
            )}
          </View>
          {!activeChat.isGroup && <View style={[styles.statusDot, activeChat.isOnline ? styles.statusOnline : styles.statusOffline]} />}
        </View>
        <View style={styles.headerCenter}>
          <Text numberOfLines={1} style={styles.headerTitle}>{activeChat.name}</Text>
          <View style={styles.statusLine}>
            {activeChat.isOnline && !activeChat.isGroup && <View style={styles.onlineDot} />}
            <Text style={[styles.headerSubtitle, activeChat.isOnline && styles.onlineText]}>
              {activeChat.isGroup
                ? `${activeChat.memberCount} members${activeChat.onlineMemberCount ? ` · ${activeChat.onlineMemberCount} online` : ''}`
                : activeChat.isOnline ? 'Online now' : lastSeenLabel(activeChat.lastActiveAt)}
            </Text>
          </View>
        </View>
        {activeChat.isGroup ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Crew details"
            style={styles.headerAction}
            onPress={() => router.push({ pathname: '/crew-detail', params: { id: activeChat.id } })}
          >
            <Ionicons name="ellipsis-horizontal" size={21} color="#6b625b" />
          </TouchableOpacity>
        ) : (
          <View style={styles.callActions}>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Start voice call"
              style={styles.callButton}
              onPress={() => router.push({ pathname: '/call', params: { chatId: activeChat.id, callType: 'audio' } })}
            >
              <Ionicons name="call-outline" size={19} color="#0f766e" />
            </TouchableOpacity>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Start video call"
              style={styles.callButton}
              onPress={() => router.push({ pathname: '/call', params: { chatId: activeChat.id, callType: 'video' } })}
            >
              <Ionicons name="videocam-outline" size={20} color="#0f766e" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messagesContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.encryptionNote}>
          <Ionicons name="heart-outline" size={13} color="#0f766e" />
          <Text style={styles.encryptionText}>
            {activeChat.isGroup ? 'A shared space for your Crew.' : 'A direct conversation, just between you two.'}
          </Text>
        </View>
        {messagesLoading ? (
          <ActivityIndicator color="#0f766e" style={styles.loader} />
        ) : messages.length === 0 ? (
          <View style={styles.firstMessage}>
            <View style={styles.firstMessageIcon}><Ionicons name="chatbubble-ellipses-outline" size={24} color="#0f766e" /></View>
            <Text style={styles.firstMessageTitle}>Say hello to {activeChat.name}</Text>
            <Text style={styles.firstMessageText}>A thoughtful first note can start something good.</Text>
          </View>
        ) : messages.map((msg) => {
          const ownMessage = msg.senderId === user?.id;
          return (
            <View
              key={msg.id}
              style={[
                styles.messageRow,
                ownMessage ? styles.myMessageRow : styles.otherMessageRow,
              ]}
            >
              <View style={[
                styles.messageBubble,
                ownMessage ? styles.myMessage : styles.otherMessage,
                msg.isAnnouncement && styles.announcementBubble,
                !!msg.mediaUrl && msg.messageType !== 'file' && styles.mediaMessageBubble,
              ]}>
                {msg.isAnnouncement && (
                  <View style={styles.announcementLabel}>
                    <Ionicons name="megaphone-outline" size={12} color="#0f766e" />
                    <Text style={styles.announcementLabelText}>CREW NOTE</Text>
                  </View>
                )}
                {activeChat.isGroup && !ownMessage && (
                  <Text style={styles.senderLabel}>
                    {msg.sender?.profile?.displayName || msg.sender?.username || 'Crew member'}
                  </Text>
                )}
                {msg.mediaUrl && msg.messageType === 'image' && (
                  <Image source={{ uri: resolveMediaUrl(msg.mediaUrl) }} style={styles.sharedImage} resizeMode="cover" />
                )}
                {msg.mediaUrl && msg.messageType === 'video' && (
                  <Video
                    source={{ uri: resolveMediaUrl(msg.mediaUrl) }}
                    style={styles.sharedVideo}
                    resizeMode={ResizeMode.CONTAIN}
                    useNativeControls
                  />
                )}
                {msg.mediaUrl && msg.messageType === 'file' && (
                  <TouchableOpacity
                    accessibilityRole="link"
                    style={styles.sharedFile}
                    onPress={() => void Linking.openURL(resolveMediaUrl(msg.mediaUrl!))}
                  >
                    <Ionicons name="document-text-outline" size={22} color={ownMessage ? '#ffffff' : '#0f766e'} />
                    <Text numberOfLines={2} style={[styles.sharedFileName, ownMessage && styles.myMessageText]}>
                      {msg.attachmentName || 'Open attachment'}
                    </Text>
                    <Ionicons name="download-outline" size={18} color={ownMessage ? '#ffffff' : '#0f766e'} />
                  </TouchableOpacity>
                )}
                {!!msg.content && <Text style={[styles.messageText, ownMessage && styles.myMessageText]}>{msg.content}</Text>}
                <View style={styles.messageFooter}>
                  <Text style={[styles.messageTime, ownMessage && styles.myMessageTime]}>
                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                  {ownMessage && (
                    <Ionicons
                      name={!activeChat.isGroup && msg.isRead ? 'checkmark-done' : 'checkmark'}
                      size={14}
                      color={!activeChat.isGroup && msg.isRead ? '#d7f3e9' : '#ffffff'}
                    />
                  )}
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      {!!messagesError && <Text style={styles.errorText}>{messagesError}</Text>}
      {!!sendError && <Text style={styles.errorText}>{sendError}</Text>}

      <View style={styles.composerWrap}>
        {activeChat.isGroup && ['owner', 'admin'].includes(activeChat.role) && (
          <TouchableOpacity
            accessibilityRole="switch"
            accessibilityState={{ checked: isAnnouncement }}
            onPress={() => setIsAnnouncement((value) => !value)}
            style={[styles.announcementToggle, isAnnouncement && styles.announcementToggleActive]}
          >
            <Ionicons name="megaphone-outline" size={15} color={isAnnouncement ? '#ffffff' : '#0f766e'} />
            <Text style={[styles.announcementToggleText, isAnnouncement && styles.announcementToggleTextActive]}>
              {isAnnouncement ? 'Crew note on' : 'Send as Crew note'}
            </Text>
          </TouchableOpacity>
        )}
        {selectedMedia && (
          <MediaAttachmentPreview asset={selectedMedia} onRemove={() => setSelectedMedia(null)} />
        )}
        <View style={styles.inputContainer}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add a photo, video, or file"
            style={styles.attachButton}
            onPress={() => setMediaPickerOpen(true)}
          >
            <Ionicons name="add-circle-outline" size={25} color="#0f766e" />
          </TouchableOpacity>
          <ThemedTextInput
            style={styles.input}
            placeholder="Write a message…"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={5000}
          />
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: (!message.trim() && !selectedMedia) || sending }}
            disabled={(!message.trim() && !selectedMedia) || sending}
            style={[styles.sendButton, (!message.trim() && !selectedMedia || sending) && styles.sendButtonDisabled]}
            onPress={() => void handleSend()}
          >
            {sending ? <ActivityIndicator size="small" color="#ffffff" /> : <Ionicons name="arrow-up" size={21} color="#ffffff" />}
          </TouchableOpacity>
        </View>
        <Text style={styles.composerHint}>Kind words look good on everyone.</Text>
      </View>
      <MediaPickerSheet
        visible={mediaPickerOpen}
        includeFiles
        onClose={() => setMediaPickerOpen(false)}
        onSelect={(asset) => { setSelectedMedia(asset); setSendError(null); }}
        onError={setSendError}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1, backgroundColor: '#fffaf5' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1e8df' },
  backButton: { width: 34, height: 42, alignItems: 'center', justifyContent: 'center', marginRight: 7 },
  avatarWrap: { width: 43, height: 43, position: 'relative', marginRight: 10 },
  avatar: { width: 41, height: 41, overflow: 'hidden', borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff1e5' },
  avatarFallback: { backgroundColor: '#0f766e' },
  avatarImage: { width: '100%', height: '100%' },
  avatarInitial: { color: '#ffffff', fontSize: 16, fontWeight: '800' },
  statusDot: { width: 12, height: 12, position: 'absolute', bottom: -1, right: -1, borderRadius: 6, borderWidth: 2, borderColor: '#ffffff' },
  statusOnline: { backgroundColor: '#16a34a' },
  statusOffline: { backgroundColor: '#c4b8ae' },
  headerCenter: { flex: 1, minWidth: 0 },
  headerTitle: { color: '#292524', fontSize: 15, fontWeight: '800' },
  statusLine: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, marginRight: 5, backgroundColor: '#16a34a' },
  headerSubtitle: { color: '#6b625b', fontSize: 11 },
  onlineText: { color: '#15803d', fontWeight: '700' },
  headerAction: { width: 36, height: 40, alignItems: 'center', justifyContent: 'center', marginLeft: 4 },
  callActions: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  callButton: { width: 35, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#e7f3ed' },
  messages: { flex: 1 },
  messagesContent: { flexGrow: 1, justifyContent: 'flex-end', paddingHorizontal: 15, paddingVertical: 17 },
  encryptionNote: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, marginBottom: 19, borderRadius: 14, backgroundColor: '#e3f4ec' },
  encryptionText: { color: '#0f766e', fontSize: 10, fontWeight: '700' },
  loader: { marginVertical: 28 },
  firstMessage: { alignItems: 'center', alignSelf: 'center', maxWidth: 240, paddingVertical: 35 },
  firstMessageIcon: { width: 52, height: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e3f4ec' },
  firstMessageTitle: { color: '#292524', fontSize: 15, fontWeight: '800', textAlign: 'center', marginTop: 13 },
  firstMessageText: { color: '#6b625b', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 5 },
  messageRow: { flexDirection: 'row', width: '100%', marginBottom: 9 },
  myMessageRow: { justifyContent: 'flex-end' },
  otherMessageRow: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '82%', overflow: 'hidden', paddingHorizontal: 13, paddingTop: 10, paddingBottom: 7, borderRadius: 18 },
  senderLabel: { color: '#0f766e', fontSize: 10, fontWeight: '800', marginBottom: 4 },
  mediaMessageBubble: { width: '82%', paddingHorizontal: 7, paddingTop: 7 },
  sharedImage: { width: '100%', height: 210, borderRadius: 12 },
  sharedVideo: { width: '100%', height: 210, borderRadius: 12, backgroundColor: '#151210' },
  sharedFile: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48, paddingHorizontal: 6 },
  sharedFileName: { flex: 1, color: '#292524', fontSize: 12, fontWeight: '700' },
  myMessage: { backgroundColor: '#0f766e', borderBottomRightRadius: 5 },
  otherMessage: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1e8df', borderBottomLeftRadius: 5 },
  announcementBubble: { borderWidth: 1, borderColor: '#b7ddcc' },
  announcementLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 5 },
  announcementLabelText: { color: '#0f766e', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  messageText: { color: '#292524', fontSize: 14, lineHeight: 20 },
  myMessageText: { color: '#ffffff' },
  messageFooter: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 4, marginTop: 3 },
  messageTime: { color: '#9a6b51', fontSize: 9 },
  myMessageTime: { color: '#d7f3e9' },
  errorText: { color: '#b91c1c', fontSize: 11, textAlign: 'center', paddingHorizontal: 12, paddingVertical: 5 },
  composerWrap: { paddingHorizontal: 13, paddingTop: 10, paddingBottom: 7, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#f1e8df' },
  announcementToggle: { flexDirection: 'row', alignSelf: 'flex-start', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 8, borderRadius: 11, backgroundColor: '#e7f3ed' },
  announcementToggleActive: { backgroundColor: '#0f766e' },
  announcementToggleText: { color: '#0f766e', fontSize: 10, fontWeight: '800' },
  announcementToggleTextActive: { color: '#ffffff' },
  inputContainer: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  attachButton: { width: 32, height: 43, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, maxHeight: 110, minHeight: 44, paddingHorizontal: 15, paddingVertical: 11, borderWidth: 1, borderColor: '#f1e8df', borderRadius: 17, backgroundColor: '#fffaf5', color: '#292524', fontSize: 14 },
  sendButton: { width: 43, height: 43, borderRadius: 16, backgroundColor: '#0f766e', alignItems: 'center', justifyContent: 'center' },
  sendButtonDisabled: { opacity: 0.48 },
  composerHint: { color: '#9a6b51', fontSize: 9, textAlign: 'center', marginTop: 7 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fffaf5' },
  emptyText: { color: '#6b625b', textAlign: 'center', padding: 20 },
  retryText: { color: '#c2410c', fontWeight: '700', padding: 12 },
});
