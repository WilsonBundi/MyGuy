import { useEffect, useState, type ComponentProps } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useTheme, useThemedStyles, type ThemeMode } from '../src/contexts/ThemeContext';
import { confirmSignOut, showSignOutError } from '../src/lib/signOutConfirmation';

type IconName = ComponentProps<typeof Ionicons>['name'];
type PreferenceKey = 'messageAlerts' | 'connectionAlerts' | 'communityUpdates';
type Preferences = Record<PreferenceKey, boolean>;

const STORAGE_KEY = 'myguy:settings:v1';
const DEFAULT_PREFERENCES: Preferences = {
  messageAlerts: true,
  connectionAlerts: true,
  communityUpdates: false,
};

const notificationRows: {
  key: PreferenceKey;
  title: string;
  subtitle: string;
  icon: IconName;
}[] = [
  {
    key: 'messageAlerts',
    title: 'Conversation reminders',
    subtitle: 'Keep message alerts in your preferences',
    icon: 'chatbubble-ellipses-outline',
  },
  {
    key: 'connectionAlerts',
    title: 'People activity',
    subtitle: 'Connection and community activity',
    icon: 'people-outline',
  },
  {
    key: 'communityUpdates',
    title: 'MyGuy notes',
    subtitle: 'Occasional product and community updates',
    icon: 'sparkles-outline',
  },
];

export default function SettingsScreen() {
  const { user, signOut } = useAuth();
  const { mode, isDark, setMode } = useTheme();
  const styles = useThemedStyles(baseStyles);
  const [preferences, setPreferences] = useState(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<PreferenceKey | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let mounted = true;

    const loadPreferences = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored && mounted) {
          const parsed: unknown = JSON.parse(stored);
          if (parsed && typeof parsed === 'object') {
            const values = parsed as Partial<Preferences>;
            setPreferences({
              messageAlerts:
                typeof values.messageAlerts === 'boolean'
                  ? values.messageAlerts
                  : DEFAULT_PREFERENCES.messageAlerts,
              connectionAlerts:
                typeof values.connectionAlerts === 'boolean'
                  ? values.connectionAlerts
                  : DEFAULT_PREFERENCES.connectionAlerts,
              communityUpdates:
                typeof values.communityUpdates === 'boolean'
                  ? values.communityUpdates
                  : DEFAULT_PREFERENCES.communityUpdates,
            });
          }
        }
      } catch (error) {
        console.error('Could not load MyGuy settings:', error);
        if (mounted) {
          setLoadError('Saved preferences could not be loaded. You can still change them and retry.');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadPreferences();
    return () => {
      mounted = false;
    };
  }, []);

  const changePreference = async (key: PreferenceKey, value: boolean) => {
    const next = { ...preferences, [key]: value };
    setSaving(key);
    setLoadError('');
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setPreferences(next);
    } catch (error) {
      console.error('Could not save MyGuy settings:', error);
      Alert.alert(
        'Could not save preference',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSaving(null);
    }
  };

  const handleReset = () => {
    Alert.alert(
      'Reset preferences?',
      'This restores the notification preferences to their original values.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: async () => {
            setLoadError('');
            try {
              await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
              setPreferences(DEFAULT_PREFERENCES);
            } catch (error) {
              console.error('Could not reset MyGuy settings:', error);
              Alert.alert(
                'Could not reset settings',
                error instanceof Error ? error.message : 'Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    confirmSignOut(async () => {
      try {
        setSigningOut(true);
        await signOut();
        router.replace('/signin');
      } catch (error) {
        showSignOutError(error);
      } finally {
        setSigningOut(false);
      }
    });
  };

  const displayName = user?.displayName?.trim() || user?.username?.trim() || 'MyGuy member';
  const changeTheme = async (nextMode: ThemeMode) => {
    try {
      await setMode(nextMode);
    } catch (error) {
      console.error('Could not save MyGuy theme preference:', error);
      Alert.alert(
        'Could not save theme',
        error instanceof Error ? error.message : 'Please try again.'
      );
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to your hub"
          style={styles.backButton}
          onPress={() => router.canGoBack() ? router.back() : router.replace('/hub')}
        >
          <Ionicons name="arrow-back" size={21} color="#6b3b24" />
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>MAKE IT YOURS</Text>
          <Text style={styles.title}>Settings</Text>
        </View>
        <View style={styles.headerIcon}>
          <Ionicons name="options-outline" size={20} color="#c2410c" />
        </View>
      </View>

      <View style={styles.accountCard}>
        <View style={styles.accountAvatar}>
          <Text style={styles.accountInitial}>
            {displayName.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'M'}
          </Text>
        </View>
        <View style={styles.accountCopy}>
          <Text style={styles.accountName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.accountEmail} numberOfLines={1}>{user?.email || 'Signed in on this device'}</Text>
        </View>
        <View style={styles.signedInBadge}>
          <View style={styles.signedInDot} />
          <Text style={styles.signedInText}>Active</Text>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionSubtitle}>Choose how MyGuy looks on this device</Text>
        </View>
          <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={19} color="#c2410c" />
      </View>

      <View style={styles.themeCard}>
        {([
          { key: 'light', label: 'Light', icon: 'sunny-outline' },
          { key: 'dark', label: 'Dark', icon: 'moon-outline' },
          { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
        ] as const).map((option) => {
          const selected = mode === option.key;
          return (
            <TouchableOpacity
              key={option.key}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={[styles.themeOption, selected && styles.themeOptionSelected]}
              onPress={() => changeTheme(option.key)}
            >
              <Ionicons
                name={option.icon}
                size={18}
                color={selected ? '#c2410c' : '#9a8b80'}
              />
              <Text style={[styles.themeOptionText, selected && styles.themeOptionTextSelected]}>
                {option.label}
              </Text>
              {selected && <Ionicons name="checkmark-circle" size={16} color="#c2410c" />}
            </TouchableOpacity>
          );
        })}
        <Text style={styles.themeDescription}>
          {mode === 'system'
            ? `Following your device appearance (${isDark ? 'dark' : 'light'}).`
            : `MyGuy is using ${mode} appearance.`}
        </Text>
      </View>

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <Text style={styles.sectionSubtitle}>Choose what you want MyGuy to remember</Text>
        </View>
        {loading && <ActivityIndicator size="small" color="#c2410c" />}
      </View>

      <View style={styles.card}>
        {notificationRows.map((row, index) => (
          <View
            key={row.key}
            style={[styles.preferenceRow, index === notificationRows.length - 1 && styles.lastRow]}
          >
            <View style={styles.rowIcon}>
              <Ionicons name={row.icon} size={19} color="#b45324" />
            </View>
            <View style={styles.rowCopy}>
              <Text style={styles.rowTitle}>{row.title}</Text>
              <Text style={styles.rowSubtitle}>{row.subtitle}</Text>
            </View>
            {saving === row.key ? (
              <ActivityIndicator size="small" color="#c2410c" />
            ) : (
              <Switch
                accessibilityLabel={row.title}
                value={preferences[row.key]}
                onValueChange={(value) => changePreference(row.key, value)}
                trackColor={{ false: '#e7dfd7', true: '#f5b183' }}
                thumbColor={preferences[row.key] ? '#c2410c' : '#ffffff'}
                disabled={loading || saving !== null}
              />
            )}
          </View>
        ))}
      </View>

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={18} color="#9a5b3d" />
        <Text style={styles.noticeText}>
          These preferences are saved on this device. Push notification delivery is not enabled in this build yet.
        </Text>
      </View>
      {!!loadError && <Text accessibilityRole="alert" style={styles.errorText}>{loadError}</Text>}

      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Privacy & device</Text>
          <Text style={styles.sectionSubtitle}>Know what this app stores here</Text>
        </View>
      </View>
      <View style={styles.card}>
        <View style={styles.infoRow}>
          <View style={styles.rowIcon}>
            <Ionicons name="phone-portrait-outline" size={19} color="#b45324" />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>This device</Text>
            <Text style={styles.rowSubtitle}>
              Your signed-in profile and these preferences are stored locally.
            </Text>
          </View>
        </View>
        <View style={[styles.infoRow, styles.lastRow]}>
          <View style={styles.rowIcon}>
            <Ionicons name="lock-closed-outline" size={19} color="#b45324" />
          </View>
          <View style={styles.rowCopy}>
            <Text style={styles.rowTitle}>Profile visibility</Text>
            <Text style={styles.rowSubtitle}>
              Audience and visibility controls are not available in this mobile build.
            </Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.resetButton}
        onPress={handleReset}
        disabled={loading || saving !== null}
      >
        <Ionicons name="refresh-outline" size={17} color="#9a5b3d" />
        <Text style={styles.resetText}>Reset notification preferences</Text>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.signOutButton}
        onPress={handleSignOut}
        disabled={signingOut}
      >
        <View style={styles.signOutIcon}>
          <Ionicons name="log-out-outline" size={19} color="#b42318" />
        </View>
        <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign out of MyGuy'}</Text>
        <Ionicons name="chevron-forward" size={17} color="#c9a7a3" />
      </TouchableOpacity>

      <Text style={styles.footer}>Your settings stay on this device.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1e8df',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCopy: {
    flex: 1,
    marginLeft: 12,
  },
  eyebrow: {
    color: '#c2410c',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  title: {
    color: '#292524',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#fff0e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1e5',
    borderWidth: 1,
    borderColor: '#f5dfcb',
    borderRadius: 20,
    padding: 14,
    marginBottom: 24,
  },
  accountAvatar: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f5dfcb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accountInitial: {
    color: '#c2410c',
    fontSize: 15,
    fontWeight: '800',
  },
  accountCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },
  accountName: {
    color: '#292524',
    fontSize: 14,
    fontWeight: '800',
  },
  accountEmail: {
    color: '#9a6b51',
    fontSize: 11,
    marginTop: 3,
  },
  signedInBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  signedInDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#16a34a',
    marginRight: 5,
  },
  signedInText: {
    color: '#4d7c0f',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 2,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#292524',
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#a8a29e',
    fontSize: 11,
    marginTop: 3,
  },
  themeCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1e8df',
    borderRadius: 19,
    padding: 10,
    marginBottom: 24,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    paddingHorizontal: 11,
    borderRadius: 13,
    marginBottom: 4,
  },
  themeOptionSelected: {
    backgroundColor: '#fff5eb',
  },
  themeOptionText: {
    color: '#6b625b',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    marginLeft: 10,
  },
  themeOptionTextSelected: {
    color: '#c2410c',
    fontWeight: '800',
  },
  themeDescription: {
    color: '#a8a29e',
    fontSize: 11,
    lineHeight: 16,
    paddingHorizontal: 11,
    paddingTop: 5,
    paddingBottom: 3,
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1e8df',
    borderRadius: 19,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 70,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0eb',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 72,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0eb',
  },
  lastRow: {
    borderBottomWidth: 0,
  },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#fff5eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
    marginRight: 6,
  },
  rowTitle: {
    color: '#292524',
    fontSize: 13,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: '#a8a29e',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
  notice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff5eb',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    marginBottom: 24,
  },
  noticeText: {
    flex: 1,
    color: '#8b5e46',
    fontSize: 11,
    lineHeight: 16,
    marginLeft: 8,
  },
  errorText: {
    color: '#b42318',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    marginBottom: 12,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 2,
    marginTop: 6,
    marginBottom: 8,
  },
  resetText: {
    color: '#9a5b3d',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 7,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    paddingHorizontal: 13,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1e8df',
    borderRadius: 17,
    marginTop: 10,
  },
  signOutIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#fff1f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutText: {
    flex: 1,
    color: '#b42318',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 11,
  },
  footer: {
    color: '#b7ada4',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },
});
