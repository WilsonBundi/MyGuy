import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { PulseBoard } from '../src/components/PulseBoard';
import { useTheme, useThemedStyles } from '../src/contexts/ThemeContext';

export default function PulseScreen() {
  const styles = useThemedStyles(baseStyles);
  const { colors } = useTheme();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={21} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.heading}>
          <Text style={styles.title}>Pulse</Text>
          <Text style={styles.subtitle}>Photos, clips, and quick updates</Text>
        </View>
      </View>
      <PulseBoard />
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
});
