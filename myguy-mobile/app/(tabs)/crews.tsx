import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ThemedTextInput } from '../../src/components/ThemedTextInput';
import { useAuth } from '../../src/contexts/AuthContext';
import { useChats, type Chat } from '../../src/contexts/ChatContext';
import { useThemedStyles } from '../../src/contexts/ThemeContext';
import { getDiscoverableCrews, joinCrew, resolveMediaUrl, searchUsers, type ApiDiscoverableCrew, type ApiUser } from '../../src/lib/api';

export default function CrewsScreen() {
  const { crews, loading, error, refresh, startCrew } = useChats();
  const { user } = useAuth();
  const styles = useThemedStyles(baseStyles);
  const [createOpen, setCreateOpen] = useState(false);
  const [crewName, setCrewName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiUser[]>([]);
  const [selected, setSelected] = useState<ApiUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [publicCrews, setPublicCrews] = useState<ApiDiscoverableCrew[]>([]);
  const [discoveryError, setDiscoveryError] = useState<string | null>(null);
  const [joiningCrewId, setJoiningCrewId] = useState<string | null>(null);
  const [joinCodeOpen, setJoinCodeOpen] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joiningByCode, setJoiningByCode] = useState(false);

  const loadDiscovery = async () => {
    setDiscoveryError(null);
    try {
      const response = await getDiscoverableCrews();
      setPublicCrews(response.crews);
    } catch (loadError) {
      setDiscoveryError(loadError instanceof Error ? loadError.message : 'Could not find public Crews.');
    }
  };

  useEffect(() => { void loadDiscovery(); }, []);

  const joinPublicCrew = async (crewId: string) => {
    setJoiningCrewId(crewId);
    setDiscoveryError(null);
    try {
      const result = await joinCrew({ crewId });
      if (result.pending) {
        Alert.alert('Request sent', 'A Crew admin will review your request to join.');
      }
      await Promise.all([refresh(), loadDiscovery()]);
    } catch (joinError) {
      setDiscoveryError(joinError instanceof Error ? joinError.message : 'Could not join this Crew.');
    } finally {
      setJoiningCrewId(null);
    }
  };

  const joinWithCode = async () => {
    const code = inviteCode.trim();
    if (!code) {
      setDiscoveryError('Enter a Crew invite code.');
      return;
    }
    setJoiningByCode(true);
    setDiscoveryError(null);
    try {
      const result = await joinCrew({ inviteCode: code });
      setJoinCodeOpen(false);
      setInviteCode('');
      await refresh();
      router.push({ pathname: '/crew-detail', params: { id: result.crewId } });
    } catch (joinError) {
      setDiscoveryError(joinError instanceof Error ? joinError.message : 'Could not join this Crew.');
    } finally {
      setJoiningByCode(false);
    }
  };

  const closeCreator = () => {
    if (creating) return;
    setCreateOpen(false);
    setCrewName('');
    setDescription('');
    setIsPrivate(false);
    setRequiresApproval(false);
    setQuery('');
    setResults([]);
    setSelected([]);
    setFormError(null);
  };

  const findPeople = async () => {
    if (query.trim().length < 2) {
      setFormError('Enter at least two characters to find people.');
      return;
    }
    setSearching(true);
    setFormError(null);
    try {
      const response = await searchUsers(query.trim());
      setResults(response.users.filter((candidate) => candidate.id !== user?.id));
    } catch (searchError) {
      setFormError(searchError instanceof Error ? searchError.message : 'Could not search for people.');
    } finally {
      setSearching(false);
    }
  };

  const toggleMember = (candidate: ApiUser) => {
    setFormError(null);
    setSelected((current) => current.some((member) => member.id === candidate.id)
      ? current.filter((member) => member.id !== candidate.id)
      : [...current, candidate]);
  };

  const create = async () => {
    if (crewName.trim().length < 2) {
      setFormError('Give your Crew a name of at least two characters.');
      return;
    }
    if (selected.length < 2) {
      setFormError('Choose at least two people to start a Crew.');
      return;
    }
    setCreating(true);
    setFormError(null);
    try {
      const crew = await startCrew(crewName.trim(), selected.map((member) => member.id), {
        description: description.trim(),
        isPrivate,
        requiresApproval: !isPrivate && requiresApproval,
      });
      setCreateOpen(false);
      setCrewName('');
      setDescription('');
      setIsPrivate(false);
      setRequiresApproval(false);
      setQuery('');
      setResults([]);
      setSelected([]);
      router.push({ pathname: '/crew-detail', params: { id: crew.id } });
    } catch (createError) {
      setFormError(createError instanceof Error ? createError.message : 'Could not create this Crew.');
    } finally {
      setCreating(false);
    }
  };

  const openCrew = (crew: Chat) => {
    router.push({ pathname: '/crew-detail', params: { id: crew.id } });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void refresh()} tintColor="#0f766e" />}
    >
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="people" size={23} color="#ffffff" /></View>
        <Text style={styles.eyebrow}>YOUR PEOPLE, TOGETHER</Text>
        <Text style={styles.title}>Crews</Text>
        <Text style={styles.subtitle}>Shared spaces for the people you bring together.</Text>
      </View>

      <TouchableOpacity accessibilityRole="button" style={styles.createButton} onPress={() => setCreateOpen(true)}>
        <View style={styles.createIcon}><Ionicons name="add" size={23} color="#ffffff" /></View>
        <View style={styles.createCopy}>
          <Text style={styles.createTitle}>Create a Crew</Text>
          <Text style={styles.createSubtitle}>Name your space and choose its people</Text>
        </View>
        <Ionicons name="chevron-forward" size={19} color="#0f766e" />
      </TouchableOpacity>
      <TouchableOpacity accessibilityRole="button" style={styles.joinCodeButton} onPress={() => setJoinCodeOpen(true)}>
        <Ionicons name="key-outline" size={17} color="#0f766e" />
        <Text style={styles.joinCodeText}>Join with an invite code</Text>
      </TouchableOpacity>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Your Crews</Text>
        <Text style={styles.sectionCount}>{crews.length}</Text>
      </View>

      {error ? (
        <View style={styles.stateCard}>
          <Ionicons name="cloud-offline-outline" size={27} color="#c2410c" />
          <Text style={styles.stateTitle}>Couldn’t load Crews</Text>
          <Text style={styles.stateText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => void refresh()}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
        </View>
      ) : loading && crews.length === 0 ? (
        <ActivityIndicator color="#0f766e" style={styles.loader} />
      ) : crews.length === 0 ? (
        <View style={styles.stateCard}>
          <View style={styles.emptyIcon}><Ionicons name="people-outline" size={25} color="#0f766e" /></View>
          <Text style={styles.stateTitle}>Your Crew space starts here</Text>
          <Text style={styles.stateText}>Create a Crew to bring people together in a shared conversation.</Text>
        </View>
      ) : (
        <View style={styles.crewList}>
          {crews.map((crew) => (
            <TouchableOpacity
              key={crew.id}
              accessibilityRole="button"
              accessibilityLabel={`${crew.name}, ${crew.memberCount} members`}
              style={styles.crewRow}
              onPress={() => openCrew(crew)}
            >
              <View style={[styles.crewAvatar, !crew.avatar && styles.crewAvatarFallback]}>
                {crew.avatar
                  ? <Image source={{ uri: resolveMediaUrl(crew.avatar) }} style={styles.avatarImage} />
                  : <Ionicons name="people" size={22} color="#ffffff" />}
              </View>
              <View style={styles.crewCopy}>
                <Text numberOfLines={1} style={styles.crewName}>{crew.name}</Text>
                <Text numberOfLines={1} style={styles.crewDetail}>
                  {crew.memberCount} members{crew.onlineMemberCount ? ` · ${crew.onlineMemberCount} online` : ''}
                  {crew.lastMessage ? ` · ${crew.lastMessage}` : ''}
                </Text>
              </View>
              {crew.unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{crew.unreadCount > 99 ? '99+' : crew.unreadCount}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={17} color="#9a6b51" />
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Find your people</Text>
        <Text style={styles.sectionCount}>{publicCrews.length}</Text>
      </View>
      {!!discoveryError && <Text accessibilityRole="alert" style={styles.discoveryError}>{discoveryError}</Text>}
      {publicCrews.length > 0 && (
        <View style={styles.crewList}>
          {publicCrews.map((candidate) => (
            <View key={candidate.id} style={styles.discoverRow}>
              <View style={[styles.crewAvatar, styles.crewAvatarFallback]}>
                {candidate.groupImage
                  ? <Image source={{ uri: resolveMediaUrl(candidate.groupImage) }} style={styles.avatarImage} />
                  : <Ionicons name="people" size={21} color="#ffffff" />}
              </View>
              <View style={styles.crewCopy}>
                <Text numberOfLines={1} style={styles.crewName}>{candidate.groupName}</Text>
                <Text numberOfLines={2} style={styles.crewDetail}>
                  {candidate._count.members} members{candidate.requiresApproval ? ' · Request to join' : ''}{candidate.createdBy?.profile?.displayName
                    ? ` · Started by ${candidate.createdBy.profile.displayName}`
                    : ''}
                </Text>
                {!!candidate.description && <Text numberOfLines={2} style={styles.discoverDescription}>{candidate.description}</Text>}
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                disabled={joiningCrewId === candidate.id}
                onPress={() => void joinPublicCrew(candidate.id)}
                style={styles.joinButton}
              >
                {joiningCrewId === candidate.id
                  ? <ActivityIndicator size="small" color="#ffffff" />
                  : <Text style={styles.joinButtonText}>{candidate.requiresApproval ? 'Request' : 'Join'}</Text>}
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal visible={joinCodeOpen} animationType="slide" onRequestClose={() => setJoinCodeOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close invite code entry" onPress={() => setJoinCodeOpen(false)} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#292524" />
            </TouchableOpacity>
            <View style={styles.modalHeading}>
              <Text style={styles.modalTitle}>Join a Crew</Text>
              <Text style={styles.modalSubtitle}>Use a code shared by a Crew member</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" disabled={joiningByCode} onPress={() => void joinWithCode()} style={[styles.submitButton, joiningByCode && styles.submitDisabled]}>
              {joiningByCode ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.submitText}>Join</Text>}
            </TouchableOpacity>
          </View>
          <View style={styles.joinCodeContent}>
            <ThemedTextInput
              value={inviteCode}
              onChangeText={(value) => { setInviteCode(value); setDiscoveryError(null); }}
              placeholder="Paste Crew invite code"
              accessibilityLabel="Crew invite code"
              autoCapitalize="none"
              style={styles.nameInput}
            />
            {!!discoveryError && <Text accessibilityRole="alert" style={styles.formError}>{discoveryError}</Text>}
          </View>
        </View>
      </Modal>

      <Modal visible={createOpen} animationType="slide" onRequestClose={closeCreator}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close Crew creator" onPress={closeCreator} style={styles.closeButton}>
              <Ionicons name="close" size={22} color="#292524" />
            </TouchableOpacity>
            <View style={styles.modalHeading}>
              <Text style={styles.modalTitle}>Create a Crew</Text>
              <Text style={styles.modalSubtitle}>A shared place for your people</Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={creating}
              onPress={() => void create()}
              style={[styles.submitButton, creating && styles.submitDisabled]}
            >
              {creating ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.submitText}>Create</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.modalContent}>
            <Text style={styles.fieldLabel}>Crew name</Text>
            <ThemedTextInput
              value={crewName}
              onChangeText={(value) => { setCrewName(value); setFormError(null); }}
              placeholder="e.g. Weekend plans"
              accessibilityLabel="Crew name"
              maxLength={40}
              style={styles.nameInput}
            />
            <Text style={[styles.fieldLabel, styles.descriptionLabel]}>Crew description (optional)</Text>
            <ThemedTextInput
              value={description}
              onChangeText={(value) => { setDescription(value); setFormError(null); }}
              placeholder="What brings this Crew together?"
              accessibilityLabel="Crew description"
              multiline
              maxLength={280}
              style={styles.descriptionInput}
            />
            <TouchableOpacity
              accessibilityRole="switch"
              accessibilityState={{ checked: isPrivate }}
              onPress={() => setIsPrivate((value) => !value)}
              style={styles.privacyToggle}
            >
              <View style={styles.privacyCopy}>
                <Text style={styles.privacyTitle}>{isPrivate ? 'Private Crew' : 'Public Crew'}</Text>
                <Text style={styles.privacyDescription}>
                  {isPrivate ? 'Only people you add or invite can join.' : 'People can find this Crew and join it.'}
                </Text>
              </View>
              <Ionicons name={isPrivate ? 'lock-closed' : 'link-outline'} size={19} color="#0f766e" />
            </TouchableOpacity>
            {!isPrivate && (
              <TouchableOpacity
                accessibilityRole="switch"
                accessibilityState={{ checked: requiresApproval }}
                onPress={() => setRequiresApproval((value) => !value)}
                style={styles.privacyToggle}
              >
                <View style={styles.privacyCopy}>
                  <Text style={styles.privacyTitle}>Review join requests</Text>
                  <Text style={styles.privacyDescription}>
                    {requiresApproval ? 'Admins approve people before they join.' : 'Anyone can join instantly.'}
                  </Text>
                </View>
                <Ionicons name={requiresApproval ? 'shield-checkmark-outline' : 'enter-outline'} size={19} color="#0f766e" />
              </TouchableOpacity>
            )}
            <View style={styles.memberHeading}>
              <Text style={styles.fieldLabel}>Choose people</Text>
              <Text style={styles.selectedCount}>{selected.length} selected</Text>
            </View>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#78716c" />
              <ThemedTextInput
                value={query}
                onChangeText={(value) => { setQuery(value); setFormError(null); }}
                placeholder="Search by name or username"
                accessibilityLabel="Search people for Crew"
                returnKeyType="search"
                onSubmitEditing={() => void findPeople()}
                style={styles.searchInput}
              />
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Find people" onPress={() => void findPeople()} disabled={searching} style={styles.searchAction}>
                {searching ? <ActivityIndicator size="small" color="#0f766e" /> : <Ionicons name="arrow-forward" size={18} color="#0f766e" />}
              </TouchableOpacity>
            </View>
            {selected.length > 0 && (
              <View style={styles.selectedList}>
                {selected.map((member) => (
                  <TouchableOpacity key={member.id} style={styles.selectedPill} onPress={() => toggleMember(member)}>
                    <Text numberOfLines={1} style={styles.selectedPillText}>{member.profile?.displayName || member.username}</Text>
                    <Ionicons name="close-circle" size={15} color="#0f766e" />
                  </TouchableOpacity>
                ))}
              </View>
            )}
            <View style={styles.results}>
              {results.length === 0 && !searching ? (
                <Text style={styles.hint}>Find people by name or username, then select at least two to start a Crew.</Text>
              ) : results.map((candidate) => {
                const isSelected = selected.some((member) => member.id === candidate.id);
                return (
                  <TouchableOpacity
                    key={candidate.id}
                    accessibilityRole="button"
                    accessibilityState={{ selected: isSelected }}
                    onPress={() => toggleMember(candidate)}
                    style={styles.resultRow}
                  >
                    <View style={[styles.memberAvatar, !candidate.profile?.avatar && styles.memberFallback]}>
                      {candidate.profile?.avatar
                        ? <Image source={{ uri: resolveMediaUrl(candidate.profile.avatar) }} style={styles.avatarImage} />
                        : <Text style={styles.memberInitial}>{(candidate.profile?.displayName || candidate.username)[0]?.toUpperCase() || '?'}</Text>}
                    </View>
                    <View style={styles.memberCopy}>
                      <Text numberOfLines={1} style={styles.memberName}>{candidate.profile?.displayName || candidate.username}</Text>
                      <Text numberOfLines={1} style={styles.memberUsername}>@{candidate.username}</Text>
                    </View>
                    <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? '#0f766e' : '#c4b8ae'} />
                  </TouchableOpacity>
                );
              })}
            </View>
            {!!formError && <Text accessibilityRole="alert" style={styles.formError}>{formError}</Text>}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf5' },
  content: { paddingBottom: 30 },
  hero: { alignItems: 'center', paddingHorizontal: 25, paddingTop: 27, paddingBottom: 25, backgroundColor: '#e7f3ed' },
  heroIcon: { width: 49, height: 49, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f766e', marginBottom: 11 },
  eyebrow: { color: '#0f766e', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: '#173b31', fontSize: 29, fontWeight: '900', marginTop: 3 },
  subtitle: { color: '#52715f', fontSize: 12, textAlign: 'center', marginTop: 6 },
  createButton: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 17, padding: 13, borderRadius: 17, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e4eee6' },
  createIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f766e' },
  createCopy: { flex: 1, marginHorizontal: 11 },
  createTitle: { color: '#292524', fontSize: 13, fontWeight: '800' },
  createSubtitle: { color: '#6b625b', fontSize: 11, marginTop: 3 },
  joinCodeButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 12 },
  joinCodeText: { color: '#0f766e', fontSize: 11, fontWeight: '800' },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginTop: 25, marginBottom: 9 },
  sectionTitle: { color: '#292524', fontSize: 15, fontWeight: '900' },
  sectionCount: { color: '#0f766e', fontSize: 11, fontWeight: '800', marginLeft: 7 },
  crewList: { marginHorizontal: 12, borderRadius: 19, overflow: 'hidden', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1e8df' },
  crewRow: { flexDirection: 'row', alignItems: 'center', minHeight: 75, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f0eb' },
  crewAvatar: { width: 47, height: 47, borderRadius: 16, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginRight: 11 },
  crewAvatarFallback: { backgroundColor: '#0f766e' },
  avatarImage: { width: '100%', height: '100%' },
  crewCopy: { flex: 1, minWidth: 0 },
  crewName: { color: '#292524', fontSize: 13, fontWeight: '800' },
  crewDetail: { color: '#6b625b', fontSize: 10, marginTop: 5 },
  discoverRow: { flexDirection: 'row', alignItems: 'center', minHeight: 83, paddingHorizontal: 11, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: '#f5f0eb' },
  discoverDescription: { color: '#8b7567', fontSize: 10, lineHeight: 14, marginTop: 4 },
  joinButton: { minWidth: 52, height: 32, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#0f766e', marginLeft: 8 },
  joinButtonText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  discoveryError: { color: '#b91c1c', fontSize: 11, textAlign: 'center', paddingHorizontal: 14, marginBottom: 8 },
  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', backgroundColor: '#c2410c', marginRight: 8 },
  unreadText: { color: '#ffffff', fontSize: 9, fontWeight: '800' },
  stateCard: { alignItems: 'center', marginHorizontal: 16, paddingHorizontal: 23, paddingVertical: 27, borderRadius: 19, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1e8df' },
  emptyIcon: { width: 48, height: 48, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e7f3ed' },
  stateTitle: { color: '#292524', fontSize: 14, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  stateText: { color: '#6b625b', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  retryButton: { padding: 10, marginTop: 6 },
  retryText: { color: '#0f766e', fontSize: 12, fontWeight: '800' },
  loader: { marginTop: 35 },
  modal: { flex: 1, backgroundColor: '#fffaf5' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1e8df' },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#fff6ed' },
  modalHeading: { flex: 1, marginLeft: 10 },
  modalTitle: { color: '#292524', fontSize: 16, fontWeight: '900' },
  modalSubtitle: { color: '#6b625b', fontSize: 11, marginTop: 2 },
  submitButton: { minWidth: 70, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 13, backgroundColor: '#0f766e' },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  modalContent: { paddingHorizontal: 17, paddingTop: 19, paddingBottom: 35 },
  joinCodeContent: { paddingHorizontal: 17, paddingTop: 20 },
  fieldLabel: { color: '#292524', fontSize: 12, fontWeight: '800', marginBottom: 8 },
  descriptionLabel: { marginTop: 17 },
  nameInput: { minHeight: 46, paddingHorizontal: 13, borderWidth: 1, borderColor: '#eadfd5', borderRadius: 14, backgroundColor: '#ffffff', color: '#292524', fontSize: 14 },
  descriptionInput: { minHeight: 75, paddingHorizontal: 13, paddingVertical: 11, borderWidth: 1, borderColor: '#eadfd5', borderRadius: 14, backgroundColor: '#ffffff', color: '#292524', fontSize: 13, textAlignVertical: 'top' },
  privacyToggle: { flexDirection: 'row', alignItems: 'center', marginTop: 13, padding: 12, borderRadius: 14, backgroundColor: '#e7f3ed' },
  privacyCopy: { flex: 1, marginRight: 9 },
  privacyTitle: { color: '#14532d', fontSize: 12, fontWeight: '800' },
  privacyDescription: { color: '#52715f', fontSize: 10, marginTop: 3 },
  memberHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20 },
  selectedCount: { color: '#0f766e', fontSize: 11, fontWeight: '700', marginBottom: 8 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 48, paddingLeft: 12, paddingRight: 6, borderWidth: 1, borderColor: '#eadfd5', borderRadius: 14, backgroundColor: '#ffffff' },
  searchInput: { flex: 1, minHeight: 44, paddingVertical: 7, borderWidth: 0, backgroundColor: 'transparent', color: '#292524', fontSize: 13 },
  searchAction: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 12, backgroundColor: '#e7f3ed' },
  selectedList: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  selectedPill: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 14, backgroundColor: '#e7f3ed' },
  selectedPillText: { maxWidth: 175, color: '#14532d', fontSize: 11, fontWeight: '700' },
  results: { marginTop: 11, borderRadius: 16, overflow: 'hidden', backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1e8df' },
  hint: { color: '#6b625b', fontSize: 12, lineHeight: 18, textAlign: 'center', paddingHorizontal: 23, paddingVertical: 25 },
  resultRow: { flexDirection: 'row', alignItems: 'center', minHeight: 67, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f0eb' },
  memberAvatar: { width: 40, height: 40, borderRadius: 14, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  memberFallback: { backgroundColor: '#0f766e' },
  memberInitial: { color: '#ffffff', fontSize: 15, fontWeight: '800' },
  memberCopy: { flex: 1, minWidth: 0 },
  memberName: { color: '#292524', fontSize: 12, fontWeight: '800' },
  memberUsername: { color: '#8b7567', fontSize: 10, marginTop: 3 },
  formError: { color: '#b91c1c', fontSize: 12, lineHeight: 17, marginTop: 11 },
});
