import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import {
  getNotifications,
  markNotificationsRead,
  type ApiNotification,
} from '../src/lib/api';
import { useTheme, useThemedStyles } from '../src/contexts/ThemeContext';

function formatNotificationDate(date: string) {
  const timestamp = new Date(date);
  if (Number.isNaN(timestamp.getTime())) return '';
  return timestamp.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function safeInternalLink(link: string | null): Href | null {
  if (!link || !link.startsWith('/') || link.startsWith('//')) return null;
  return link as Href;
}

export default function NotificationsScreen() {
  const styles = useThemedStyles(baseStyles);
  const { colors } = useTheme();
  const [notifications, setNotifications] = useState<ApiNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingRead, setMarkingRead] = useState(false);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const result = await getNotifications();
      setNotifications(result.notifications);
      setUnreadCount(result.unreadCount);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const markAllRead = async () => {
    if (!unreadCount || markingRead) return;
    setMarkingRead(true);
    setError(null);
    try {
      await markNotificationsRead();
      setNotifications((current) => current.map((item) => ({ ...item, read: true })));
      setUnreadCount(0);
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Could not update notifications.');
    } finally {
      setMarkingRead(false);
    }
  };

  const openNotification = async (item: ApiNotification) => {
    if (!item.read) {
      try {
        await markNotificationsRead(item.id);
        setNotifications((current) => current.map((notification) =>
          notification.id === item.id ? { ...notification, read: true } : notification
        ));
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : 'Could not update notification.');
      }
    }
    const link = safeInternalLink(item.link);
    if (link) router.push(link);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={[styles.backButton, { backgroundColor: colors.surfaceSoft }]}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.heading}>
          <Text style={[styles.title, { color: colors.text }]}>Notifications</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {unreadCount ? `${unreadCount} new update${unreadCount === 1 ? '' : 's'}` : 'You’re all caught up'}
          </Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Mark all notifications as read"
          disabled={!unreadCount || markingRead}
          onPress={() => void markAllRead()}
        >
          {markingRead
            ? <ActivityIndicator size="small" color={colors.accent} />
            : <Text style={[styles.markAll, { color: unreadCount ? colors.accent : colors.muted }]}>Read all</Text>}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor={colors.accent} />}
      >
        {error && (
          <View style={[styles.messageCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.messageText, { color: colors.textSecondary }]}>{error}</Text>
            <TouchableOpacity accessibilityRole="button" onPress={() => void refresh()}>
              <Text style={[styles.retry, { color: colors.accent }]}>Try again</Text>
            </TouchableOpacity>
          </View>
        )}
        {loading && notifications.length === 0 && !error ? (
          <ActivityIndicator style={styles.loader} color={colors.accent} />
        ) : null}
        {!loading && !error && notifications.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.surfaceSoft }]}>
              <Ionicons name="notifications-outline" size={27} color={colors.accent} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Nothing new yet</Text>
            <Text style={[styles.emptyCopy, { color: colors.textSecondary }]}>
              New activity and invitations will show up here.
            </Text>
          </View>
        ) : null}
        {notifications.map((item) => (
          <TouchableOpacity
            key={item.id}
            accessibilityRole="button"
            style={[
              styles.notification,
              { backgroundColor: colors.surface, borderColor: colors.border },
              !item.read && { backgroundColor: colors.accentSoft },
            ]}
            onPress={() => void openNotification(item)}
          >
            <View style={[styles.notificationIcon, { backgroundColor: colors.surfaceSoft }]}>
              <Ionicons name={item.type === 'live_invite' ? 'radio-outline' : 'notifications-outline'} size={20} color={colors.accent} />
            </View>
            <View style={styles.notificationCopy}>
              <Text style={[styles.notificationTitle, { color: colors.text }]}>{item.title}</Text>
              {!!item.body && <Text style={[styles.notificationBody, { color: colors.textSecondary }]}>{item.body}</Text>}
              <Text style={[styles.date, { color: colors.muted }]}>{formatNotificationDate(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={[styles.unreadDot, { backgroundColor: colors.accent }]} />}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  header: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1e8df',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: '#fff1e5',
  },
  heading: {
    flex: 1,
  },
  title: {
    color: '#292524',
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    marginTop: 2,
    color: '#6b625b',
    fontSize: 12,
  },
  markAll: {
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    padding: 16,
    gap: 10,
  },
  loader: {
    marginTop: 36,
  },
  notification: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: '#ffffff',
  },
  notificationIcon: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
    backgroundColor: '#fff1e5',
  },
  notificationCopy: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  notificationBody: {
    fontSize: 12,
    lineHeight: 17,
  },
  date: {
    fontSize: 10,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  messageCard: {
    padding: 16,
    borderWidth: 1,
    borderRadius: 16,
    gap: 10,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 19,
  },
  retry: {
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 28,
    borderWidth: 1,
    borderRadius: 20,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCopy: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
