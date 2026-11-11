import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemedStyles } from '../../src/contexts/ThemeContext';
import { getMyProfile, resolveMediaUrl, updateUserProfile, uploadMedia } from '../../src/lib/api';
import { ThemedTextInput as TextInput } from '../../src/components/ThemedTextInput';
import { confirmSignOut, showSignOutError } from '../../src/lib/signOutConfirmation';

export default function ProfileScreen() {
  const { user, signOut, updateUser } = useAuth();
  const styles = useThemedStyles(baseStyles);
  const [signingOut, setSigningOut] = useState(false);
  const [profile, setProfile] = useState({ bio: '', location: '', website: '' });
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar || '');
  const [coverImageUrl, setCoverImageUrl] = useState(user?.coverImage || '');
  const [uploadingImage, setUploadingImage] = useState<'avatar' | 'cover' | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editBio, setEditBio] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editWebsite, setEditWebsite] = useState('');
  const [editError, setEditError] = useState<string | null>(null);
  const displayName = user?.displayName?.trim() || user?.username?.trim() || 'MyGuy member';
  const initials = displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((name) => name[0]?.toUpperCase())
    .join('');

  useEffect(() => {
    let active = true;
    getMyProfile()
      .then(({ profile: value }) => {
        if (!active) return;
        const nextProfile = {
          bio: value.bio || '',
          location: value.location || '',
          website: value.website || '',
        };
        setProfile(nextProfile);
        setAvatarUrl(value.avatar || '');
        setCoverImageUrl(value.coverImage || '');
        setEditName(value.displayName);
        setEditBio(nextProfile.bio);
        setEditLocation(nextProfile.location);
        setEditWebsite(nextProfile.website);
      })
      .catch((loadError) => {
        if (active) setProfileError(loadError instanceof Error ? loadError.message : 'Could not load profile details.');
      })
      .finally(() => {
        if (active) setProfileLoading(false);
      });
    return () => { active = false; };
  }, []);

  const changeProfileImage = async (purpose: 'avatar' | 'cover') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setProfileError('Allow MyGuy to access your photo library to choose a profile image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: purpose === 'avatar' ? [1, 1] : [16, 7],
      quality: 0.85,
    });
    if (result.canceled) return;

    setUploadingImage(purpose);
    setProfileError(null);
    try {
      const uploaded = await uploadMedia(result.assets[0], purpose);
      await updateUserProfile({ [purpose === 'avatar' ? 'avatar' : 'coverImage']: uploaded.url });
      if (purpose === 'avatar') {
        setAvatarUrl(uploaded.url);
        await updateUser({ avatar: uploaded.url });
      } else {
        setCoverImageUrl(uploaded.url);
        await updateUser({ coverImage: uploaded.url });
      }
    } catch (uploadError) {
      setProfileError(uploadError instanceof Error ? uploadError.message : 'Could not update profile image.');
    } finally {
      setUploadingImage(null);
    }
  };

  const saveProfile = async () => {
    setSaving(true);
    setEditError(null);
    try {
      const { profile: updated } = await updateUserProfile({
        displayName: editName.trim(),
        bio: editBio.trim(),
        location: editLocation.trim(),
        website: editWebsite.trim(),
      });
      setProfile({
        bio: updated.bio || '',
        location: updated.location || '',
        website: updated.website || '',
      });
      await updateUser({ displayName: updated.displayName });
      setEditing(false);
    } catch (saveError) {
      setEditError(saveError instanceof Error ? saveError.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
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

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.eyebrow}>MYGUY</Text>
          <Text style={styles.pageTitle}>Your space</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open your MyGuy hub"
          style={styles.topBarIcon}
          onPress={() => router.push('/hub')}
        >
          <Ionicons name="menu-outline" size={23} color="#c2410c" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <ImageBackground
          source={coverImageUrl ? { uri: resolveMediaUrl(coverImageUrl) } : undefined}
          style={styles.cover}
          imageStyle={styles.coverImage}
        >
          <View style={styles.coverOverlay} />
          <View style={styles.coverOrbOne} />
          <View style={styles.coverOrbTwo} />
          <View style={styles.coverCopy}>
            <Text style={styles.coverLabel}>YOUR MYGUY PROFILE</Text>
            <Text style={styles.coverMessage}>Your people.{'\n'}Your moments.</Text>
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Change cover photo"
            style={styles.coverEdit}
            disabled={uploadingImage !== null}
            onPress={() => void changeProfileImage('cover')}
          >
            <Ionicons name={uploadingImage === 'cover' ? 'hourglass-outline' : 'camera-outline'} size={17} color="#ffffff" />
            <Text style={styles.coverEditText}>{uploadingImage === 'cover' ? 'Uploading' : 'Cover photo'}</Text>
          </TouchableOpacity>
        </ImageBackground>

        <View style={styles.identity}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Change profile picture"
            style={styles.avatar}
            disabled={uploadingImage !== null}
            onPress={() => void changeProfileImage('avatar')}
          >
            {avatarUrl ? (
              <Image source={{ uri: resolveMediaUrl(avatarUrl) }} style={styles.avatarImage} />
            ) : <Text style={styles.avatarText}>{initials || 'M'}</Text>}
            <View style={styles.avatarCamera}>
              <Ionicons name={uploadingImage === 'avatar' ? 'hourglass-outline' : 'camera'} size={12} color="#ffffff" />
            </View>
          </TouchableOpacity>
          <View style={styles.identityText}>
            <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
            <Text style={styles.username} numberOfLines={1}>
              @{user?.username?.trim() || 'myguy-member'}
            </Text>
          </View>
          <TouchableOpacity accessibilityRole="button" style={styles.editButton} onPress={() => {
            setEditName(displayName);
            setEditBio(profile.bio);
            setEditLocation(profile.location);
            setEditWebsite(profile.website);
            setEditError(null);
            setEditing(true);
          }}>
            <Ionicons name="create-outline" size={18} color="#c2410c" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <View style={styles.photoShareNotice}>
          <Ionicons name="sparkles-outline" size={16} color="#c2410c" />
          <Text style={styles.photoShareNoticeText}>
            A new look becomes a shared moment—your people can see it, like it, and leave a reply.
          </Text>
        </View>

        <View style={styles.accountSection}>
          <Text style={styles.sectionTitle}>Account details</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="mail-outline" size={18} color="#c2410c" />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.detailLabel}>Email address</Text>
              <Text style={styles.detailValue} numberOfLines={1}>{user?.email || 'Not provided'}</Text>
            </View>
          </View>
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Ionicons name="at-outline" size={18} color="#c2410c" />
            </View>
            <View style={styles.detailCopy}>
              <Text style={styles.detailLabel}>Username</Text>
              <Text style={styles.detailValue} numberOfLines={1}>
                @{user?.username?.trim() || 'myguy-member'}
              </Text>
            </View>
          </View>
          {(!!profile.bio || !!profile.location || !!profile.website) && (
            <View style={styles.aboutSection}>
              <Text style={styles.sectionTitle}>About</Text>
              {!!profile.bio && <Text style={styles.aboutText}>{profile.bio}</Text>}
              {!!profile.location && <Text style={styles.aboutMeta}><Ionicons name="location-outline" size={14} /> {profile.location}</Text>}
              {!!profile.website && <Text style={styles.aboutMeta}><Ionicons name="link-outline" size={14} /> {profile.website}</Text>}
            </View>
          )}
          {profileLoading && <ActivityIndicator style={styles.profileSpinner} color="#f97316" />}
          {!!profileError && <Text style={styles.profileError}>{profileError}</Text>}
        </View>
      </View>

      <View style={styles.communityCard}>
        <View style={styles.communityIcon}>
          <Ionicons name="heart" size={19} color="#c2410c" />
        </View>
        <View style={styles.communityCopy}>
          <Text style={styles.communityTitle}>A place for your people</Text>
          <Text style={styles.communityText}>Share what matters and stay close to your community.</Text>
        </View>
      </View>

      <TouchableOpacity
        accessibilityRole="button"
        style={styles.signOutButton}
        onPress={handleSignOut}
        disabled={signingOut}
      >
        <Ionicons name="log-out-outline" size={20} color="#b42318" />
        <Text style={styles.signOutText}>{signingOut ? 'Signing out…' : 'Sign out'}</Text>
        <Ionicons name="chevron-forward" size={18} color="#c9a7a3" />
      </TouchableOpacity>

      <Text style={styles.footer}>MyGuy · People. Moments. Everywhere.</Text>
      <Modal visible={editing} animationType="slide" onRequestClose={() => setEditing(false)}>
        <ScrollView style={styles.editorScreen} contentContainerStyle={styles.editorContent}>
          <View style={styles.editorHeader}>
            <Text style={styles.editorTitle}>Edit your profile</Text>
            <TouchableOpacity accessibilityLabel="Close profile editor" onPress={() => setEditing(false)}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <Text style={styles.inputLabel}>Display name</Text>
          <TextInput style={styles.profileInput} value={editName} onChangeText={setEditName} maxLength={50} />
          <Text style={styles.inputLabel}>About you</Text>
          <TextInput style={[styles.profileInput, styles.bioInput]} value={editBio} onChangeText={setEditBio} maxLength={500} multiline />
          <Text style={styles.inputLabel}>Location</Text>
          <TextInput style={styles.profileInput} value={editLocation} onChangeText={setEditLocation} maxLength={100} />
          <Text style={styles.inputLabel}>Website</Text>
          <TextInput style={styles.profileInput} value={editWebsite} onChangeText={setEditWebsite} autoCapitalize="none" keyboardType="url" />
          {!!editError && <Text style={styles.profileError}>{editError}</Text>}
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.saveButton, (!editName.trim() || saving) && styles.saveButtonDisabled]}
            disabled={!editName.trim() || saving}
            onPress={() => void saveProfile()}
          >
            <Text style={styles.saveButtonText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  contentContainer: {
    paddingBottom: 28,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: {
    color: '#c2410c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  pageTitle: {
    color: '#292524',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    marginTop: 3,
  },
  topBarIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#fff0e2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f9dfc8',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f1e8df',
  },
  cover: {
    height: 158,
    overflow: 'hidden',
    justifyContent: 'center',
    paddingHorizontal: 22,
    backgroundColor: '#c2410c',
  },
  coverImage: {
    resizeMode: 'cover',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(124,45,18,0.48)',
  },
  coverOrbOne: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    right: -60,
    top: -82,
    backgroundColor: 'rgba(255,255,255,0.11)',
  },
  coverOrbTwo: {
    position: 'absolute',
    width: 116,
    height: 116,
    borderRadius: 58,
    right: 52,
    bottom: -73,
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  coverCopy: {
    zIndex: 1,
  },
  coverLabel: {
    color: '#ffdec4',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  coverMessage: {
    color: '#ffffff',
    fontSize: 25,
    lineHeight: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginTop: 8,
  },
  coverIcon: {
    position: 'absolute',
    right: 25,
    bottom: 25,
  },
  identity: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 16,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: '#fff0e2',
    borderWidth: 2,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -2,
  },
  avatarText: {
    color: '#c2410c',
    fontSize: 19,
    fontWeight: '800',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  avatarCamera: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 23,
    height: 23,
    borderRadius: 12,
    backgroundColor: '#c2410c',
    borderWidth: 2,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverEdit: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(41,37,36,0.62)',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 12,
  },
  coverEditText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  identityText: {
    flex: 1,
    marginLeft: 13,
    minWidth: 0,
  },
  profileName: {
    color: '#292524',
    fontSize: 18,
    fontWeight: '800',
  },
  username: {
    color: '#a8a29e',
    fontSize: 13,
    marginTop: 3,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#fff5eb',
  },
  editButtonText: {
    color: '#c2410c',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3eee9',
    marginHorizontal: 18,
  },
  photoShareNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 18,
    marginTop: 14,
    padding: 12,
    borderRadius: 14,
    backgroundColor: '#fff5eb',
  },
  photoShareNoticeText: {
    flex: 1,
    marginLeft: 8,
    color: '#7c2d12',
    fontSize: 12,
    lineHeight: 17,
  },
  accountSection: {
    padding: 18,
  },
  aboutSection: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3eee9',
  },
  aboutText: {
    color: '#57534e',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  aboutMeta: {
    color: '#78716c',
    fontSize: 13,
    marginTop: 5,
  },
  profileSpinner: {
    marginTop: 14,
  },
  profileError: {
    color: '#b91c1c',
    marginTop: 12,
    fontSize: 13,
  },
  sectionTitle: {
    color: '#57534e',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 13,
    backgroundColor: '#fff5eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailCopy: {
    flex: 1,
    marginLeft: 12,
    minWidth: 0,
  },
  detailLabel: {
    color: '#a8a29e',
    fontSize: 11,
    fontWeight: '600',
  },
  detailValue: {
    color: '#292524',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 3,
  },
  communityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1e5',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f8dfc7',
  },
  communityIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityCopy: {
    flex: 1,
    marginLeft: 12,
  },
  communityTitle: {
    color: '#7c2d12',
    fontSize: 14,
    fontWeight: '800',
  },
  communityText: {
    color: '#9a5b3d',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: 16,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#f1e8df',
  },
  signOutText: {
    flex: 1,
    color: '#b42318',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 11,
  },
  footer: {
    color: '#b7ada4',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 20,
  },
  editorScreen: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  editorContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 32,
  },
  editorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  editorTitle: {
    color: '#292524',
    fontSize: 22,
    fontWeight: '800',
  },
  inputLabel: {
    color: '#57534e',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 7,
    marginTop: 14,
  },
  profileInput: {
    color: '#292524',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1e8df',
    borderRadius: 13,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  bioInput: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  saveButton: {
    alignItems: 'center',
    backgroundColor: '#f97316',
    borderRadius: 14,
    marginTop: 24,
    paddingVertical: 14,
  },
  saveButtonDisabled: {
    opacity: 0.55,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
});
