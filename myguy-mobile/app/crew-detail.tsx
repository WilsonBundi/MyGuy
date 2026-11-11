import React, { useCallback, useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ThemedTextInput } from '../src/components/ThemedTextInput';
import { useAuth } from '../src/contexts/AuthContext';
import { useChats } from '../src/contexts/ChatContext';
import { useThemedStyles } from '../src/contexts/ThemeContext';
import {
  addCrewMembers,
  getCrew,
  getCrewMembers,
  leaveCrew,
  removeCrewMember,
  resolveMediaUrl,
  searchUsers,
  updateCrew,
  updateCrewMemberRole,
  createCrewEvent,
  createCrewPoll,
  getCrewEvents,
  getCrewJoinRequests,
  getCrewPolls,
  respondToCrewEvent,
  reviewCrewJoinRequest,
  uploadMedia,
  voteCrewPoll,
  type ApiCrewEvent,
  type ApiCrewJoinRequest,
  type ApiCrewPoll,
  type ApiChat,
  type ApiUser,
} from '../src/lib/api';

type CrewMember = NonNullable<ApiChat['members']>[number];

export default function CrewDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { selectCrew, refresh } = useChats();
  const styles = useThemedStyles(baseStyles);
  const [crew, setCrew] = useState<ApiChat | null>(null);
  const [role, setRole] = useState('member');
  const [members, setMembers] = useState<CrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ApiUser[]>([]);
  const [selected, setSelected] = useState<ApiUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [events, setEvents] = useState<ApiCrewEvent[]>([]);
  const [polls, setPolls] = useState<ApiCrewPoll[]>([]);
  const [joinRequests, setJoinRequests] = useState<ApiCrewJoinRequest[]>([]);
  const [selectedPollOptions, setSelectedPollOptions] = useState<Record<string, string[]>>({});
  const [composer, setComposer] = useState<'event' | 'poll' | null>(null);
  const [eventName, setEventName] = useState('');
  const [eventWhen, setEventWhen] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptionsText, setPollOptionsText] = useState('');
  const [pollAllowsMultiple, setPollAllowsMultiple] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);

  const loadCrew = useCallback(async () => {
    if (!id) {
      setError('Crew not found.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const crewResult = await getCrew(id);
      const [memberResult, eventResult, pollResult, requestResult] = await Promise.all([
        getCrewMembers(id),
        getCrewEvents(id),
        getCrewPolls(id),
        ['owner', 'admin'].includes(crewResult.role)
          ? getCrewJoinRequests(id)
          : Promise.resolve({ requests: [] as ApiCrewJoinRequest[] }),
      ]);
      setCrew(crewResult.crew);
      setRole(crewResult.role);
      setMembers(memberResult.members);
      setEvents(eventResult.events);
      setPolls(pollResult.polls);
      setJoinRequests(requestResult.requests);
      setName(crewResult.crew.groupName || '');
      setDescription(crewResult.crew.description || '');
      setIsPrivate(crewResult.crew.isPrivate ?? false);
      setRequiresApproval(crewResult.crew.requiresApproval ?? false);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Could not load Crew details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { void loadCrew(); }, [loadCrew]);

  const isAdmin = role === 'owner' || role === 'admin';
  const isOwner = role === 'owner';

  const saveSettings = async () => {
    if (!crew || !name.trim()) {
      setError('Crew name cannot be empty.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await updateCrew(crew.id, {
        name: name.trim(),
        description: description.trim(),
        isPrivate,
        requiresApproval: !isPrivate && requiresApproval,
      });
      setCrew((current) => current ? { ...current, ...response.crew } : current);
      await refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Could not save Crew settings.');
    } finally {
      setSaving(false);
    }
  };

  const selectCrewImage = async () => {
    if (!crew || uploadingIcon) return;
    setError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError('Allow photo library access to choose a Crew image.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (result.canceled || !result.assets[0]) return;
    setUploadingIcon(true);
    try {
      const uploaded = await uploadMedia(result.assets[0], 'crew');
      const response = await updateCrew(crew.id, { groupImage: uploaded.url });
      setCrew((current) => current ? { ...current, ...response.crew } : current);
      await refresh();
    } catch (imageError) {
      setError(imageError instanceof Error ? imageError.message : 'Could not update the Crew image.');
    } finally {
      setUploadingIcon(false);
    }
  };

  const submitEvent = async () => {
    if (!crew || !eventName.trim() || !eventWhen.trim()) {
      setError('Add an event name and start time.');
      return;
    }
    const startTime = new Date(eventWhen);
    if (!Number.isFinite(startTime.getTime()) || startTime <= new Date()) {
      setError('Enter a future start time, such as 2026-10-20T18:00.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createCrewEvent(crew.id, {
        name: eventName.trim(),
        description: eventDescription.trim() || undefined,
        location: eventLocation.trim() || undefined,
        startTime: startTime.toISOString(),
      });
      setComposer(null);
      setEventName('');
      setEventWhen('');
      setEventLocation('');
      setEventDescription('');
      await loadCrew();
    } catch (eventError) {
      setError(eventError instanceof Error ? eventError.message : 'Could not create this event.');
    } finally {
      setSaving(false);
    }
  };

  const submitPoll = async () => {
    if (!crew || !pollQuestion.trim()) {
      setError('Add a question for your poll.');
      return;
    }
    const options = pollOptionsText.split(/\r?\n/).map((option) => option.trim()).filter(Boolean);
    if (options.length < 2) {
      setError('Add at least two poll choices, one per line.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await createCrewPoll(crew.id, { question: pollQuestion.trim(), options, allowsMultiple: pollAllowsMultiple });
      setComposer(null);
      setPollQuestion('');
      setPollOptionsText('');
      setPollAllowsMultiple(false);
      await loadCrew();
    } catch (pollError) {
      setError(pollError instanceof Error ? pollError.message : 'Could not create this poll.');
    } finally {
      setSaving(false);
    }
  };

  const submitPollVote = async (poll: ApiCrewPoll) => {
    if (!crew) return;
    const optionIds = selectedPollOptions[poll.id] || [];
    setSaving(true);
    setError(null);
    try {
      await voteCrewPoll(crew.id, poll.id, optionIds);
      const result = await getCrewPolls(crew.id);
      setPolls(result.polls);
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : 'Could not save your poll response.');
    } finally {
      setSaving(false);
    }
  };

  const respondToEvent = async (event: ApiCrewEvent, status: 'going' | 'interested' | 'not_going') => {
    if (!crew) return;
    setSaving(true);
    setError(null);
    try {
      await respondToCrewEvent(crew.id, event.id, status);
      const result = await getCrewEvents(crew.id);
      setEvents(result.events);
    } catch (attendanceError) {
      setError(attendanceError instanceof Error ? attendanceError.message : 'Could not update your event response.');
    } finally {
      setSaving(false);
    }
  };

  const decideJoinRequest = async (requestId: string, decision: 'approve' | 'decline') => {
    if (!crew) return;
    setSaving(true);
    setError(null);
    try {
      await reviewCrewJoinRequest(crew.id, requestId, decision);
      await loadCrew();
      await refresh();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : 'Could not review this request.');
    } finally {
      setSaving(false);
    }
  };

  const shareInvite = async () => {
    if (!crew?.inviteCode) return;
    try {
      await Share.share({
        title: `Join ${crew.groupName || 'my Crew'}`,
        message: `Join my MyGuy Crew, ${crew.groupName || 'Crew'}, with invite code: ${crew.inviteCode}`,
      });
    } catch (shareError) {
      setError(shareError instanceof Error ? shareError.message : 'Could not share this invite.');
    }
  };

  const rotateInvite = async () => {
    if (!crew) return;
    setSaving(true);
    setError(null);
    try {
      const result = await updateCrew(crew.id, { rotateInvite: true });
      setCrew((current) => current ? { ...current, ...result.crew } : current);
    } catch (rotateError) {
      setError(rotateError instanceof Error ? rotateError.message : 'Could not refresh the invite code.');
    } finally {
      setSaving(false);
    }
  };

  const findPeople = async () => {
    if (query.trim().length < 2) {
      setError('Enter at least two characters to find people.');
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const response = await searchUsers(query.trim());
      const known = new Set(members.map((member) => member.userId));
      setResults(response.users.filter((candidate) => candidate.id !== user?.id && !known.has(candidate.id)));
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : 'Could not search for people.');
    } finally {
      setSearching(false);
    }
  };

  const toggleMember = (candidate: ApiUser) => {
    setSelected((current) => current.some((member) => member.id === candidate.id)
      ? current.filter((member) => member.id !== candidate.id)
      : [...current, candidate]);
  };

  const addMembers = async () => {
    if (!crew || selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      await addCrewMembers(crew.id, selected.map((member) => member.id));
      setSelected([]);
      setResults([]);
      setQuery('');
      setAddMembersOpen(false);
      await loadCrew();
      await refresh();
    } catch (addError) {
      setError(addError instanceof Error ? addError.message : 'Could not add Crew members.');
    } finally {
      setSaving(false);
    }
  };

  const changeRole = async (memberId: string, nextRole: 'admin' | 'member') => {
    if (!crew) return;
    setSaving(true);
    setError(null);
    try {
      await updateCrewMemberRole(crew.id, memberId, nextRole);
      await loadCrew();
    } catch (roleError) {
      setError(roleError instanceof Error ? roleError.message : 'Could not update this role.');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = (memberId: string, displayName: string) => {
    if (!crew) return;
    Alert.alert('Remove from Crew?', `${displayName} will no longer see this Crew or its messages.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          setSaving(true);
          void removeCrewMember(crew.id, memberId)
            .then(async () => { await loadCrew(); await refresh(); })
            .catch((removeError: unknown) => setError(removeError instanceof Error ? removeError.message : 'Could not remove this member.'))
            .finally(() => setSaving(false));
        },
      },
    ]);
  };

  const exitCrew = () => {
    if (!crew) return;
    Alert.alert('Leave this Crew?', role === 'owner'
      ? 'Ownership will pass to an existing admin or the longest-standing member.'
      : 'You can rejoin later if the Crew is public or someone invites you.', [
      { text: 'Stay', style: 'cancel' },
      {
        text: 'Leave Crew',
        style: 'destructive',
        onPress: () => {
          setSaving(true);
          void leaveCrew(crew.id)
            .then(async () => { await refresh(); router.replace('/(tabs)/crews'); })
            .catch((leaveError: unknown) => setError(leaveError instanceof Error ? leaveError.message : 'Could not leave this Crew.'))
            .finally(() => setSaving(false));
        },
      },
    ]);
  };

  const enterConversation = async () => {
    if (!crew) return;
    setSaving(true);
    try {
      await selectCrew(crew.id);
      router.push('/chat-detail');
    } catch (openError) {
      setError(openError instanceof Error ? openError.message : 'Could not open this Crew conversation.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !crew) {
    return <View style={styles.center}><ActivityIndicator color="#0f766e" /></View>;
  }
  if (!crew) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{error || 'Crew not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.linkText}>Back to Crews</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Back to Crews" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={22} color="#292524" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Crew space</Text>
        <TouchableOpacity accessibilityRole="button" accessibilityLabel="Refresh Crew" onPress={() => void loadCrew()} style={styles.refreshButton}>
          <Ionicons name="refresh" size={19} color="#0f766e" />
        </TouchableOpacity>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={loading} onRefresh={() => void loadCrew()} tintColor="#0f766e" />}
        contentContainerStyle={styles.content}
      >
        <View style={styles.identityCard}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isAdmin ? 'Change Crew image' : 'Crew image'}
            disabled={!isAdmin || uploadingIcon}
            onPress={() => void selectCrewImage()}
            style={styles.heroIcon}
          >
            {crew.groupImage
              ? <Image source={{ uri: resolveMediaUrl(crew.groupImage) }} style={styles.heroImage} />
              : uploadingIcon
                ? <ActivityIndicator size="small" color="#ffffff" />
                : <Ionicons name={isAdmin ? 'camera' : 'people'} size={25} color="#ffffff" />}
          </TouchableOpacity>
          {isAdmin && <Text style={styles.imageHint}>{uploadingIcon ? 'Uploading image…' : 'Tap to change Crew image'}</Text>}
          <Text style={styles.crewName}>{crew.groupName || 'Crew'}</Text>
          <Text style={styles.crewMeta}>
            {members.length} members · {role === 'owner' ? 'Owner' : role === 'admin' ? 'Admin' : 'Member'}
            {crew.isPrivate ? ' · Invite-only' : ' · Public'}
          </Text>
          {!!crew.description && <Text style={styles.crewDescription}>{crew.description}</Text>}
          <TouchableOpacity accessibilityRole="button" onPress={() => void enterConversation()} style={styles.openButton}>
            {saving
              ? <ActivityIndicator size="small" color="#ffffff" />
              : <><Ionicons name="chatbubble-ellipses-outline" size={17} color="#ffffff" /><Text style={styles.openButtonText}>Open conversation</Text></>}
          </TouchableOpacity>
        </View>

        {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}

        {isAdmin && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Crew settings</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => void saveSettings()} disabled={saving} style={styles.saveButton}>
                <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.fieldLabel}>Name</Text>
            <ThemedTextInput value={name} onChangeText={setName} maxLength={40} style={styles.input} accessibilityLabel="Crew name" />
            <Text style={styles.fieldLabel}>Description</Text>
            <ThemedTextInput
              value={description}
              onChangeText={setDescription}
              placeholder="What brings this Crew together?"
              maxLength={280}
              multiline
              style={styles.descriptionInput}
              accessibilityLabel="Crew description"
            />
            <TouchableOpacity
              accessibilityRole="switch"
              accessibilityState={{ checked: isPrivate }}
              onPress={() => setIsPrivate((value) => !value)}
              style={styles.privacyRow}
            >
              <View style={styles.privacyCopy}>
                <Text style={styles.memberName}>{isPrivate ? 'Private Crew' : 'Public Crew'}</Text>
                <Text style={styles.memberSub}>{isPrivate ? 'Only invited people can join.' : 'People can find and join this Crew.'}</Text>
              </View>
              <Ionicons name={isPrivate ? 'lock-closed' : 'globe-outline'} size={19} color="#0f766e" />
            </TouchableOpacity>
            {!isPrivate && (
              <TouchableOpacity
                accessibilityRole="switch"
                accessibilityState={{ checked: requiresApproval }}
                onPress={() => setRequiresApproval((value) => !value)}
                style={styles.privacyRow}
              >
                <View style={styles.privacyCopy}>
                  <Text style={styles.memberName}>Review join requests</Text>
                  <Text style={styles.memberSub}>
                    {requiresApproval ? 'Admins approve people before they join.' : 'Anyone can join instantly.'}
                  </Text>
                </View>
                <Ionicons name={requiresApproval ? 'shield-checkmark-outline' : 'enter-outline'} size={19} color="#0f766e" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {isAdmin && joinRequests.length > 0 && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Join requests</Text>
                <Text style={styles.sectionSub}>{joinRequests.length} waiting for review</Text>
              </View>
            </View>
            {joinRequests.map((joinRequest) => {
              const displayName = joinRequest.user.profile?.displayName || joinRequest.user.username;
              return (
                <View key={joinRequest.id} style={styles.memberRow}>
                  <View style={[styles.memberAvatar, !joinRequest.user.profile?.avatar && styles.avatarFallback]}>
                    {joinRequest.user.profile?.avatar
                      ? <Image source={{ uri: resolveMediaUrl(joinRequest.user.profile.avatar) }} style={styles.avatarImage} />
                      : <Text style={styles.memberInitial}>{displayName[0]?.toUpperCase() || '?'}</Text>}
                  </View>
                  <View style={styles.memberInfo}>
                    <Text numberOfLines={1} style={styles.memberName}>{displayName}</Text>
                    <Text numberOfLines={1} style={styles.memberSub}>@{joinRequest.user.username}</Text>
                  </View>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Approve ${displayName}`}
                    disabled={saving}
                    onPress={() => void decideJoinRequest(joinRequest.id, 'approve')}
                    style={styles.approveButton}
                  >
                    <Ionicons name="checkmark" size={18} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Decline ${displayName}`}
                    disabled={saving}
                    onPress={() => void decideJoinRequest(joinRequest.id, 'decline')}
                    style={styles.removeButton}
                  >
                    <Ionicons name="close" size={17} color="#b91c1c" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Crew plans</Text>
              <Text style={styles.sectionSub}>Coordinate a time or make a group decision.</Text>
            </View>
            <View style={styles.planActions}>
              <TouchableOpacity accessibilityRole="button" onPress={() => { setComposer('event'); setError(null); }} style={styles.planAction}>
                <Ionicons name="calendar-outline" size={17} color="#0f766e" />
              </TouchableOpacity>
              <TouchableOpacity accessibilityRole="button" onPress={() => { setComposer('poll'); setError(null); }} style={styles.planAction}>
                <Ionicons name="stats-chart-outline" size={17} color="#0f766e" />
              </TouchableOpacity>
            </View>
          </View>
          {events.length === 0 && polls.length === 0 ? (
            <Text style={styles.emptyPlan}>No plans yet. Create an event or poll for your Crew.</Text>
          ) : (
            <>
              {events.map((event) => (
                <View key={event.id} style={styles.planCard}>
                  <View style={styles.planTitleRow}>
                    <Ionicons name="calendar" size={17} color="#0f766e" />
                    <Text style={styles.planTitle}>{event.name}</Text>
                  </View>
                  <Text style={styles.planDescription}>
                    {new Date(event.startTime).toLocaleString()}
                    {event.location ? ` · ${event.location}` : ''}
                  </Text>
                  {!!event.description && <Text style={styles.planDescription}>{event.description}</Text>}
                  <Text style={styles.planDescription}>{event.attendeeCount} going</Text>
                  <View style={styles.responseRow}>
                    {(['going', 'interested', 'not_going'] as const).map((status) => (
                      <TouchableOpacity
                        key={status}
                        accessibilityRole="button"
                        accessibilityState={{ selected: event.myStatus === status }}
                        disabled={saving}
                        onPress={() => void respondToEvent(event, status)}
                        style={[styles.responseButton, event.myStatus === status && styles.selectedResponse]}
                      >
                        <Text style={[styles.responseText, event.myStatus === status && styles.selectedResponseText]}>
                          {status === 'not_going' ? 'Can’t go' : status[0].toUpperCase() + status.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              ))}
              {polls.map((poll) => {
                const selectedOptions = selectedPollOptions[poll.id] ||
                  poll.options.filter((option) => option.votedByMe).map((option) => option.id);
                const closed = !!poll.endsAt && new Date(poll.endsAt) <= new Date();
                return (
                  <View key={poll.id} style={styles.planCard}>
                    <View style={styles.planTitleRow}>
                      <Ionicons name="stats-chart" size={17} color="#0f766e" />
                      <Text style={styles.planTitle}>{poll.question}</Text>
                    </View>
                    <Text style={styles.planDescription}>
                      {poll.allowsMultiple ? 'Choose any that fit' : 'Choose one'}{closed ? ' · Closed' : ''}
                    </Text>
                    {poll.options.map((option) => {
                      const selectedOption = selectedOptions.includes(option.id);
                      return (
                        <TouchableOpacity
                          key={option.id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: selectedOption }}
                          disabled={closed || saving}
                          onPress={() => setSelectedPollOptions((current) => {
                            const selectedNow = current[poll.id] ||
                              poll.options.filter((choice) => choice.votedByMe).map((choice) => choice.id);
                            const next = selectedNow.includes(option.id)
                              ? selectedNow.filter((optionId) => optionId !== option.id)
                              : poll.allowsMultiple ? [...selectedNow, option.id] : [option.id];
                            return { ...current, [poll.id]: next };
                          })}
                          style={[styles.pollOption, selectedOption && styles.selectedPollOption]}
                        >
                          <Ionicons name={selectedOption ? 'radio-button-on' : 'radio-button-off'} size={16} color="#0f766e" />
                          <Text style={styles.pollOptionText}>{option.text}</Text>
                          <Text style={styles.pollCount}>{option.voteCount}</Text>
                        </TouchableOpacity>
                      );
                    })}
                    {!closed && (
                      <TouchableOpacity
                        accessibilityRole="button"
                        disabled={saving || selectedOptions.length === 0}
                        onPress={() => void submitPollVote(poll)}
                        style={[styles.saveButton, styles.voteButton, (saving || selectedOptions.length === 0) && styles.disabledButton]}
                      >
                        <Text style={styles.saveText}>Save response</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}
            </>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>People</Text>
              <Text style={styles.sectionSub}>{members.length} in this Crew</Text>
            </View>
            {isAdmin && (
              <TouchableOpacity accessibilityRole="button" onPress={() => setAddMembersOpen(true)} style={styles.addButton}>
                <Ionicons name="person-add-outline" size={15} color="#ffffff" />
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
          {members.map((member) => {
            const profile = member.user?.profile;
            const displayName = profile?.displayName || member.user?.username || 'MyGuy member';
            const canManage = isAdmin && member.userId !== user?.id && member.role !== 'owner' && (isOwner || member.role !== 'admin');
            return (
              <View key={member.userId} style={styles.memberRow}>
                <View style={[styles.memberAvatar, !profile?.avatar && styles.avatarFallback]}>
                  {profile?.avatar
                    ? <Image source={{ uri: resolveMediaUrl(profile.avatar) }} style={styles.avatarImage} />
                    : <Text style={styles.memberInitial}>{displayName[0]?.toUpperCase() || '?'}</Text>}
                </View>
                <View style={styles.memberInfo}>
                  <Text numberOfLines={1} style={styles.memberName}>{displayName}{member.userId === user?.id ? ' (you)' : ''}</Text>
                  <Text numberOfLines={1} style={styles.memberSub}>
                    @{member.user?.username || 'member'} · {member.role || 'member'}
                  </Text>
                </View>
                {canManage && (
                  <View style={styles.memberActions}>
                    {isOwner && (
                      <TouchableOpacity
                        accessibilityRole="button"
                        accessibilityLabel={`${member.role === 'admin' ? 'Remove admin role from' : 'Make admin'} ${displayName}`}
                        onPress={() => void changeRole(member.userId, member.role === 'admin' ? 'member' : 'admin')}
                        style={styles.roleButton}
                      >
                        <Ionicons name={member.role === 'admin' ? 'shield' : 'shield-outline'} size={17} color="#0f766e" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity accessibilityRole="button" accessibilityLabel={`Remove ${displayName}`} onPress={() => removeMember(member.userId, displayName)} style={styles.removeButton}>
                      <Ionicons name="person-remove-outline" size={17} color="#b91c1c" />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Crew invite</Text>
          <Text style={styles.sectionSub}>Share the invite code with people you want to bring in.</Text>
          <View style={styles.inviteCode}>
            <Ionicons name="key-outline" size={17} color="#0f766e" />
            <Text selectable style={styles.inviteCodeText}>{crew.inviteCode || 'Invite unavailable'}</Text>
          </View>
          <View style={styles.inviteActions}>
            <TouchableOpacity accessibilityRole="button" onPress={() => void shareInvite()} style={styles.inviteButton}>
              <Ionicons name="share-outline" size={17} color="#0f766e" />
              <Text style={styles.inviteButtonText}>Share code</Text>
            </TouchableOpacity>
            {isAdmin && (
              <TouchableOpacity accessibilityRole="button" onPress={() => void rotateInvite()} disabled={saving} style={styles.inviteButton}>
                <Ionicons name="sync-outline" size={17} color="#0f766e" />
                <Text style={styles.inviteButtonText}>Refresh code</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <TouchableOpacity accessibilityRole="button" onPress={exitCrew} style={styles.leaveButton}>
          <Ionicons name="exit-outline" size={18} color="#b91c1c" />
          <Text style={styles.leaveText}>Leave Crew</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={composer !== null} animationType="slide" onRequestClose={() => setComposer(null)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close Crew plan creator" onPress={() => setComposer(null)} style={styles.backButton}>
              <Ionicons name="close" size={21} color="#292524" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>{composer === 'event' ? 'Create an event' : 'Create a poll'}</Text>
            <TouchableOpacity
              accessibilityRole="button"
              disabled={saving}
              onPress={() => void (composer === 'event' ? submitEvent() : submitPoll())}
              style={[styles.submitButton, saving && styles.disabledButton]}
            >
              {saving ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.submitText}>Create</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.addModalContent}>
            {composer === 'event' ? (
              <>
                <Text style={styles.fieldLabel}>Event name</Text>
                <ThemedTextInput
                  value={eventName}
                  onChangeText={setEventName}
                  placeholder="e.g. Saturday hike"
                  maxLength={100}
                  style={styles.input}
                  accessibilityLabel="Event name"
                />
                <Text style={styles.fieldLabel}>Start date and time</Text>
                <ThemedTextInput
                  value={eventWhen}
                  onChangeText={setEventWhen}
                  placeholder="2026-10-20T18:00"
                  style={styles.input}
                  accessibilityLabel="Event start date and time"
                  autoCapitalize="none"
                />
                <Text style={styles.fieldLabel}>Location (optional)</Text>
                <ThemedTextInput
                  value={eventLocation}
                  onChangeText={setEventLocation}
                  placeholder="Where should everyone meet?"
                  maxLength={200}
                  style={styles.input}
                  accessibilityLabel="Event location"
                />
                <Text style={styles.fieldLabel}>Details (optional)</Text>
                <ThemedTextInput
                  value={eventDescription}
                  onChangeText={setEventDescription}
                  placeholder="Add useful details"
                  maxLength={500}
                  multiline
                  style={styles.descriptionInput}
                  accessibilityLabel="Event details"
                />
              </>
            ) : (
              <>
                <Text style={styles.fieldLabel}>Question</Text>
                <ThemedTextInput
                  value={pollQuestion}
                  onChangeText={setPollQuestion}
                  placeholder="What should the Crew decide?"
                  maxLength={200}
                  style={styles.input}
                  accessibilityLabel="Poll question"
                />
                <Text style={styles.fieldLabel}>Choices (one per line)</Text>
                <ThemedTextInput
                  value={pollOptionsText}
                  onChangeText={setPollOptionsText}
                  placeholder={'Option one\nOption two'}
                  multiline
                  style={styles.descriptionInput}
                  accessibilityLabel="Poll choices"
                />
                <TouchableOpacity
                  accessibilityRole="switch"
                  accessibilityState={{ checked: pollAllowsMultiple }}
                  onPress={() => setPollAllowsMultiple((value) => !value)}
                  style={styles.privacyRow}
                >
                  <View style={styles.privacyCopy}>
                    <Text style={styles.memberName}>Allow multiple choices</Text>
                    <Text style={styles.memberSub}>{pollAllowsMultiple ? 'Members can select more than one.' : 'Members choose one option.'}</Text>
                  </View>
                  <Ionicons name={pollAllowsMultiple ? 'checkbox' : 'square-outline'} size={19} color="#0f766e" />
                </TouchableOpacity>
              </>
            )}
            {!!error && <Text accessibilityRole="alert" style={styles.errorText}>{error}</Text>}
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={addMembersOpen} animationType="slide" onRequestClose={() => setAddMembersOpen(false)}>
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close add people" onPress={() => setAddMembersOpen(false)} style={styles.backButton}>
              <Ionicons name="close" size={21} color="#292524" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Add people</Text>
            <TouchableOpacity accessibilityRole="button" disabled={!selected.length || saving} onPress={() => void addMembers()} style={[styles.submitButton, (!selected.length || saving) && styles.disabledButton]}>
              {saving ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.submitText}>Add</Text>}
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.addModalContent}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={18} color="#78716c" />
              <ThemedTextInput
                value={query}
                onChangeText={(value) => { setQuery(value); setError(null); }}
                placeholder="Search by name or username"
                accessibilityLabel="Search people to add"
                returnKeyType="search"
                onSubmitEditing={() => void findPeople()}
                style={styles.searchInput}
              />
              <TouchableOpacity accessibilityRole="button" accessibilityLabel="Find people" onPress={() => void findPeople()} disabled={searching} style={styles.searchAction}>
                {searching ? <ActivityIndicator size="small" color="#0f766e" /> : <Ionicons name="arrow-forward" size={18} color="#0f766e" />}
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionSub}>{selected.length} selected</Text>
            {results.map((candidate) => {
              const isSelected = selected.some((member) => member.id === candidate.id);
              const displayName = candidate.profile?.displayName || candidate.username;
              return (
                <TouchableOpacity key={candidate.id} onPress={() => toggleMember(candidate)} style={styles.resultRow} accessibilityRole="button" accessibilityState={{ selected: isSelected }}>
                  <View style={[styles.memberAvatar, !candidate.profile?.avatar && styles.avatarFallback]}>
                    {candidate.profile?.avatar
                      ? <Image source={{ uri: resolveMediaUrl(candidate.profile.avatar) }} style={styles.avatarImage} />
                      : <Text style={styles.memberInitial}>{displayName[0]?.toUpperCase() || '?'}</Text>}
                  </View>
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{displayName}</Text>
                    <Text style={styles.memberSub}>@{candidate.username}</Text>
                  </View>
                  <Ionicons name={isSelected ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={isSelected ? '#0f766e' : '#c4b8ae'} />
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const baseStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fffaf5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#fffaf5' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 12, paddingBottom: 11, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1e8df' },
  backButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  headerTitle: { flex: 1, color: '#292524', fontSize: 15, fontWeight: '900', marginLeft: 8 },
  refreshButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 14, paddingTop: 15, paddingBottom: 32 },
  identityCard: { alignItems: 'center', paddingHorizontal: 20, paddingVertical: 22, borderRadius: 21, backgroundColor: '#e7f3ed' },
  heroIcon: { width: 53, height: 53, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f766e' },
  heroImage: { width: '100%', height: '100%' },
  imageHint: { color: '#52715f', fontSize: 9, marginTop: 6 },
  crewName: { color: '#173b31', fontSize: 20, fontWeight: '900', textAlign: 'center', marginTop: 11 },
  crewMeta: { color: '#52715f', fontSize: 11, marginTop: 5 },
  crewDescription: { color: '#35594b', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 9 },
  openButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 41, paddingHorizontal: 16, marginTop: 16, borderRadius: 14, backgroundColor: '#0f766e' },
  openButtonText: { color: '#ffffff', fontSize: 12, fontWeight: '800' },
  errorText: { color: '#b91c1c', fontSize: 12, lineHeight: 17, textAlign: 'center', marginVertical: 9 },
  card: { padding: 14, marginTop: 13, borderRadius: 18, backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#f1e8df' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { color: '#292524', fontSize: 14, fontWeight: '900' },
  sectionSub: { color: '#847268', fontSize: 10, marginTop: 4 },
  saveButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 12, backgroundColor: '#e7f3ed' },
  saveText: { color: '#0f766e', fontSize: 11, fontWeight: '800' },
  fieldLabel: { color: '#5b514a', fontSize: 11, fontWeight: '800', marginTop: 8, marginBottom: 6 },
  input: { minHeight: 42, paddingHorizontal: 11, borderWidth: 1, borderColor: '#eadfd5', borderRadius: 12, backgroundColor: '#fffaf5', color: '#292524', fontSize: 13 },
  descriptionInput: { minHeight: 64, paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderColor: '#eadfd5', borderRadius: 12, backgroundColor: '#fffaf5', color: '#292524', fontSize: 12, textAlignVertical: 'top' },
  privacyRow: { flexDirection: 'row', alignItems: 'center', padding: 11, marginTop: 11, borderRadius: 13, backgroundColor: '#e7f3ed' },
  privacyCopy: { flex: 1, marginRight: 8 },
  planActions: { flexDirection: 'row', gap: 7 },
  planAction: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#e7f3ed' },
  emptyPlan: { color: '#847268', fontSize: 11, lineHeight: 17, paddingVertical: 8 },
  planCard: { paddingVertical: 11, borderTopWidth: 1, borderTopColor: '#f4eee8' },
  planTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  planTitle: { flex: 1, color: '#292524', fontSize: 12, fontWeight: '800' },
  planDescription: { color: '#847268', fontSize: 10, lineHeight: 15, marginTop: 5 },
  responseRow: { flexDirection: 'row', gap: 6, marginTop: 9 },
  responseButton: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 7, borderRadius: 10, backgroundColor: '#f6f3ef' },
  selectedResponse: { backgroundColor: '#0f766e' },
  responseText: { color: '#5b514a', fontSize: 9, fontWeight: '700' },
  selectedResponseText: { color: '#ffffff' },
  pollOption: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 36, paddingHorizontal: 9, marginTop: 6, borderRadius: 10, backgroundColor: '#f6f3ef' },
  selectedPollOption: { backgroundColor: '#e7f3ed' },
  pollOptionText: { flex: 1, color: '#292524', fontSize: 11 },
  pollCount: { color: '#847268', fontSize: 10, fontWeight: '700' },
  voteButton: { alignSelf: 'flex-start', marginTop: 9 },
  approveButton: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#0f766e', marginLeft: 5 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 12, backgroundColor: '#0f766e' },
  addButtonText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },
  memberRow: { flexDirection: 'row', alignItems: 'center', minHeight: 58, borderTopWidth: 1, borderTopColor: '#f4eee8' },
  memberAvatar: { width: 38, height: 38, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  avatarFallback: { backgroundColor: '#0f766e' },
  avatarImage: { width: '100%', height: '100%' },
  memberInitial: { color: '#ffffff', fontSize: 14, fontWeight: '800' },
  memberInfo: { flex: 1, minWidth: 0 },
  memberName: { color: '#292524', fontSize: 11, fontWeight: '800' },
  memberSub: { color: '#8b7567', fontSize: 9, marginTop: 3 },
  memberActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  roleButton: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#e7f3ed' },
  removeButton: { width: 31, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 10, backgroundColor: '#fff1f0' },
  inviteCode: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 11, paddingVertical: 10, marginTop: 11, borderRadius: 12, backgroundColor: '#f6f3ef' },
  inviteCodeText: { flex: 1, color: '#292524', fontSize: 11, fontWeight: '700' },
  inviteActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
  inviteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, flex: 1, minHeight: 37, borderRadius: 11, backgroundColor: '#e7f3ed' },
  inviteButtonText: { color: '#0f766e', fontSize: 10, fontWeight: '800' },
  leaveButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, minHeight: 45, marginTop: 13, borderRadius: 14, backgroundColor: '#fff1f0' },
  leaveText: { color: '#b91c1c', fontSize: 12, fontWeight: '800' },
  backLink: { padding: 12, marginTop: 8 },
  linkText: { color: '#0f766e', fontSize: 12, fontWeight: '800' },
  modal: { flex: 1, backgroundColor: '#fffaf5' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingTop: 18, paddingBottom: 12, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#f1e8df' },
  submitButton: { minWidth: 63, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#0f766e' },
  disabledButton: { opacity: 0.5 },
  submitText: { color: '#ffffff', fontSize: 11, fontWeight: '800' },
  addModalContent: { paddingHorizontal: 16, paddingTop: 15, paddingBottom: 30 },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 47, paddingLeft: 12, paddingRight: 6, borderWidth: 1, borderColor: '#eadfd5', borderRadius: 14, backgroundColor: '#ffffff' },
  searchInput: { flex: 1, minHeight: 43, paddingVertical: 7, borderWidth: 0, backgroundColor: 'transparent', color: '#292524', fontSize: 12 },
  searchAction: { width: 35, height: 35, alignItems: 'center', justifyContent: 'center', borderRadius: 11, backgroundColor: '#e7f3ed' },
  resultRow: { flexDirection: 'row', alignItems: 'center', minHeight: 58, borderBottomWidth: 1, borderBottomColor: '#f1e8df' },
});
