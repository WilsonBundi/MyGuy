import { useMemo, useState, type ComponentProps } from 'react';
import {
  Alert,
  Modal,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { useThemedStyles } from '../src/contexts/ThemeContext';
import { resolveMediaUrl } from '../src/lib/api';
import { ThemedTextInput as TextInput } from '../src/components/ThemedTextInput';
import { confirmSignOut, showSignOutError } from '../src/lib/signOutConfirmation';

type IconName = ComponentProps<typeof Ionicons>['name'];

type HubItem = {
  title: string;
  subtitle: string;
  icon: IconName;
  onPress: () => void;
};

type HubSection = {
  title: string;
  caption: string;
  items: HubItem[];
};

export default function HubScreen() {
  const { user, signOut } = useAuth();
  const styles = useThemedStyles(baseStyles);
  const [search, setSearch] = useState('');
  const [signingOut, setSigningOut] = useState(false);
  const [info, setInfo] = useState<{ title: string; body: string } | null>(null);

  const displayName = user?.displayName?.trim() || user?.username?.trim() || 'MyGuy member';
  const username = user?.username?.trim() || 'myguy-member';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const sections: HubSection[] = [
    {
      title: 'Your MyGuy',
      caption: 'Pick up where you left off',
      items: [
        {
          title: 'Your space',
          subtitle: 'Profile and account details',
          icon: 'person-circle-outline',
          onPress: () => router.push('/(tabs)/profile'),
        },
        {
          title: 'Discover people',
          subtitle: 'Find new voices and connections',
          icon: 'compass-outline',
          onPress: () => router.push('/(tabs)/discover'),
        },
        {
          title: 'Conversations',
          subtitle: 'Catch up with your people',
          icon: 'chatbubbles-outline',
          onPress: () => router.push('/(tabs)/chats'),
        },
        {
          title: 'Share a moment',
          subtitle: 'Add something to your community',
          icon: 'add-circle-outline',
          onPress: () => router.push('/(tabs)/create'),
        },
      ],
    },
    {
      title: 'Account & care',
      caption: 'Know what is connected to your account',
      items: [
        {
          title: 'Settings & preferences',
          subtitle: 'Notifications and on-device options',
          icon: 'options-outline',
          onPress: () => router.push('/settings'),
        },
        {
          title: 'Account details',
          subtitle: 'Name, username, and email on this device',
          icon: 'id-card-outline',
          onPress: () =>
            setInfo({
              title: 'Account details',
              body: `Name: ${displayName}\nUsername: @${username}\nEmail: ${user?.email || 'Not provided'}`,
            }),
        },
        {
          title: 'Sign-in & security',
          subtitle: 'Review this session and sign-out options',
          icon: 'shield-checkmark-outline',
          onPress: () => router.push('/settings'),
        },
        {
          title: 'Privacy & safety',
          subtitle: 'How your account information is handled',
          icon: 'lock-closed-outline',
          onPress: () => router.push('/settings'),
        },
      ],
    },
    {
      title: 'Help & about',
      caption: 'A little guidance when you need it',
      items: [
        {
          title: 'Using MyGuy',
          subtitle: 'A social space for people and moments',
          icon: 'help-circle-outline',
          onPress: () =>
            setInfo({
              title: 'Using MyGuy',
              body: 'Share a moment, discover people, and continue conversations from the tabs below. Your MyGuy hub keeps these spaces and account information together.',
            }),
        },
        {
          title: 'About MyGuy',
          subtitle: 'People. Moments. Everywhere.',
          icon: 'sparkles-outline',
          onPress: () =>
            setInfo({
              title: 'About MyGuy',
              body: 'MyGuy is a place to stay close to your people and share the moments that matter. This original hub brings your account and community shortcuts into one calm space.',
            }),
        },
      ],
    },
  ];

  const visibleSections = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) =>
          `${section.title} ${item.title} ${item.subtitle}`.toLowerCase().includes(query)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [search, user]);

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

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
            style={styles.backButton}
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace('/(tabs)/home')
            }
          >
            <Ionicons name="arrow-back" size={21} color="#6b3b24" />
          </TouchableOpacity>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>MYGUY • YOUR COMMUNITY</Text>
            <Text style={styles.heading}>Your hub</Text>
          </View>
          <View style={styles.headerMark}>
            <Ionicons name="people" size={19} color="#c2410c" />
          </View>
        </View>

        <Text style={styles.intro}>
          Your spaces, account, and a few helpful shortcuts — all gathered here.
        </Text>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.memberCard}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <View style={styles.avatar}>
            {user?.avatar ? (
              <Image source={{ uri: resolveMediaUrl(user.avatar) }} style={styles.avatarImage} />
            ) : <Text style={styles.avatarText}>{initials || 'M'}</Text>}
          </View>
          <View style={styles.memberCopy}>
            <Text style={styles.memberName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.memberUsername} numberOfLines={1}>@{username}</Text>
          </View>
          <View style={styles.memberLink}>
            <Text style={styles.memberLinkText}>Your space</Text>
            <Ionicons name="arrow-forward" size={14} color="#c2410c" />
          </View>
        </TouchableOpacity>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={19} color="#a8a29e" />
          <TextInput
            accessibilityLabel="Search your hub"
            style={styles.searchInput}
            placeholder="Find a space or setting"
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearch('')}
            >
              <Ionicons name="close-circle" size={19} color="#a8a29e" />
            </TouchableOpacity>
          )}
        </View>

        {visibleSections.length === 0 ? (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={24} color="#c2410c" />
            <Text style={styles.noResultsTitle}>Nothing in this hub yet</Text>
            <Text style={styles.noResultsText}>Try another word or clear your search.</Text>
          </View>
        ) : (
          visibleSections.map((section, sectionIndex) => (
            <View key={section.title} style={styles.section}>
              <View style={styles.sectionHeading}>
                <View>
                  <Text style={styles.sectionTitle}>{section.title}</Text>
                  <Text style={styles.sectionCaption}>{section.caption}</Text>
                </View>
                <Text style={styles.sectionNumber}>0{sectionIndex + 1}</Text>
              </View>
              <View style={styles.sectionCard}>
                {section.items.map((item, itemIndex) => (
                  <TouchableOpacity
                    key={item.title}
                    accessibilityRole="button"
                    style={[
                      styles.row,
                      itemIndex === section.items.length - 1 && styles.rowLast,
                    ]}
                    onPress={item.onPress}
                  >
                    <View style={styles.rowIcon}>
                      <Ionicons name={item.icon} size={19} color="#b45324" />
                    </View>
                    <View style={styles.rowCopy}>
                      <Text style={styles.rowTitle}>{item.title}</Text>
                      <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={17} color="#b8a99d" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.signOut}
          onPress={handleSignOut}
          disabled={signingOut}
        >
          <View style={styles.signOutIcon}>
            <Ionicons name="log-out-outline" size={19} color="#b42318" />
          </View>
          <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign out of MyGuy'}</Text>
          <Ionicons name="chevron-forward" size={17} color="#c9a7a3" />
        </TouchableOpacity>

        <Text style={styles.footer}>A little closer, wherever you are.</Text>
      </ScrollView>

      <Modal
        visible={info !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setInfo(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}>
              <Ionicons name="information-circle-outline" size={24} color="#c2410c" />
            </View>
            <Text style={styles.modalTitle}>{info?.title}</Text>
            <Text style={styles.modalBody}>{info?.body}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              style={styles.modalButton}
              onPress={() => setInfo(null)}
            >
              <Text style={styles.modalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 16,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
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
    letterSpacing: 1.4,
  },
  heading: {
    color: '#292524',
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerMark: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#fff0e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  intro: {
    color: '#78716c',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    marginBottom: 16,
    paddingHorizontal: 2,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1e5',
    borderColor: '#f5dfcb',
    borderWidth: 1,
    borderRadius: 21,
    padding: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f5dfcb',
  },
  avatarText: {
    color: '#c2410c',
    fontSize: 16,
    fontWeight: '800',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  memberCopy: {
    flex: 1,
    minWidth: 0,
    marginLeft: 11,
  },
  memberName: {
    color: '#292524',
    fontSize: 15,
    fontWeight: '800',
  },
  memberUsername: {
    color: '#9a6b51',
    fontSize: 12,
    marginTop: 3,
  },
  memberLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 6,
  },
  memberLinkText: {
    color: '#c2410c',
    fontSize: 11,
    fontWeight: '700',
    marginRight: 4,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    paddingHorizontal: 14,
    marginTop: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1e8df',
    borderRadius: 16,
  },
  searchInput: {
    flex: 1,
    color: '#292524',
    fontSize: 13,
    paddingVertical: 11,
    marginLeft: 9,
  },
  section: {
    marginTop: 22,
  },
  sectionHeading: {
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
  sectionCaption: {
    color: '#a8a29e',
    fontSize: 11,
    marginTop: 3,
  },
  sectionNumber: {
    color: '#d8c7b9',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1e8df',
    borderRadius: 19,
    paddingHorizontal: 12,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 68,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f0eb',
  },
  rowLast: {
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
    marginRight: 8,
  },
  rowTitle: {
    color: '#292524',
    fontSize: 13,
    fontWeight: '700',
  },
  rowSubtitle: {
    color: '#a8a29e',
    fontSize: 11,
    marginTop: 3,
  },
  signOut: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 58,
    marginTop: 22,
    paddingHorizontal: 13,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1e8df',
    borderRadius: 17,
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
    textAlign: 'center',
    fontSize: 11,
    marginTop: 20,
  },
  noResults: {
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1e8df',
    borderRadius: 19,
    padding: 24,
    marginTop: 18,
  },
  noResultsTitle: {
    color: '#292524',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 10,
  },
  noResultsText: {
    color: '#a8a29e',
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(41, 37, 36, 0.42)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fffaf5',
    borderRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#f1e8df',
  },
  modalIcon: {
    width: 46,
    height: 46,
    borderRadius: 16,
    backgroundColor: '#fff0e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#292524',
    fontSize: 20,
    fontWeight: '800',
    marginTop: 16,
  },
  modalBody: {
    color: '#6b625b',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 9,
  },
  modalButton: {
    alignItems: 'center',
    backgroundColor: '#c2410c',
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 20,
  },
  modalButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '800',
  },
});
