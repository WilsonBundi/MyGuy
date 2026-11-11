import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useThemedStyles } from '../../src/contexts/ThemeContext';

const creationPaths = [
  {
    title: 'Share a thought',
    description: 'Write a quick update, story, opinion, or original idea.',
    icon: 'chatbubble-ellipses-outline' as const,
    draft: '',
    attachment: false,
  },
  {
    title: 'Share a photo',
    description: 'Choose a gallery photo or take one with your camera.',
    icon: 'image-outline' as const,
    draft: '',
    attachment: true,
  },
  {
    title: 'Post a clip',
    description: 'Choose a clip or record a new video up to 60 seconds.',
    icon: 'videocam-outline' as const,
    draft: '',
    attachment: true,
  },
  {
    title: 'Ask the community',
    description: 'Start with a question and invite people to share their perspective.',
    icon: 'help-circle-outline' as const,
    draft: 'Community question: ',
    attachment: false,
  },
  {
    title: 'Share a civic idea',
    description: 'Talk about local issues, public life, or a change you would like to see.',
    icon: 'earth-outline' as const,
    draft: 'A thought about our community: ',
    attachment: false,
  },
];

export default function CreateScreen() {
  const styles = useThemedStyles(baseStyles);
  return (
    <SafeAreaView edges={['top']} style={styles.container}>
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MAKE IT YOURS</Text>
      <Text style={styles.title}>What would you like to share?</Text>
      <Text style={styles.subtitle}>
        MyGuy is a place for original voices: quick moments, photos, clips, and ideas worth discussing.
      </Text>

      <View style={styles.options}>
        {creationPaths.map((path) => (
          <TouchableOpacity
            key={path.title}
            accessibilityRole="button"
            style={styles.option}
            onPress={() => router.push({
              pathname: '/(tabs)/home',
              params: {
                compose: 'true',
                ...(path.attachment ? { attachment: 'true' } : {}),
                ...(path.draft ? { draft: path.draft } : {}),
              },
            })}
          >
            <View style={styles.optionIcon}>
              <Ionicons name={path.icon} size={23} color="#c2410c" />
            </View>
            <View style={styles.optionCopy}>
              <Text style={styles.optionTitle}>{path.title}</Text>
              <Text style={styles.optionDescription}>{path.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={19} color="#a8a29e" />
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.note}>
        <Ionicons name="chatbubbles-outline" size={20} color="#c2410c" />
        <Text style={styles.noteText}>
          Every shared Ping can collect reactions and replies. Viewers can also open a private conversation with its author.
        </Text>
      </View>

      <View style={styles.tip}>
        <View style={styles.tipIcon}>
          <Ionicons name="bulb-outline" size={19} color="#8c4e2e" />
        </View>
        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>A good post starts a conversation</Text>
          <Text style={styles.tipText}>Share your own words. Add media, edit before posting, and invite replies.</Text>
        </View>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fffaf5',
  },
  content: {
    paddingHorizontal: 18,
    paddingTop: 26,
    paddingBottom: 32,
  },
  eyebrow: {
    color: '#c2410c',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    color: '#292524',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 32,
    marginTop: 8,
  },
  subtitle: {
    color: '#78716c',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 20,
  },
  options: {
    gap: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f1e8df',
    borderRadius: 18,
    padding: 15,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff1e5',
    marginRight: 12,
  },
  optionCopy: {
    flex: 1,
    marginRight: 8,
  },
  optionTitle: {
    color: '#292524',
    fontSize: 15,
    fontWeight: '700',
  },
  optionDescription: {
    color: '#78716c',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff1e5',
    borderRadius: 16,
    padding: 14,
    marginTop: 20,
  },
  noteText: {
    flex: 1,
    color: '#7c2d12',
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 10,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 12,
    paddingHorizontal: 3,
  },
  tipIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f4e7dc',
    marginRight: 10,
  },
  tipCopy: { flex: 1, paddingTop: 1 },
  tipTitle: { color: '#5b4538', fontSize: 12, fontWeight: '800' },
  tipText: { color: '#78716c', fontSize: 11, lineHeight: 16, marginTop: 3 },
});
