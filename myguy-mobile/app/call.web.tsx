import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CallWebScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <View style={styles.card}>
        <View style={styles.icon}>
          <Ionicons name="call" size={27} color="#b6f0dd" />
        </View>
        <Text style={styles.title}>Calls on MyGuy</Text>
        <Text style={styles.description}>
          Voice and video calls are available in the MyGuy mobile app. Open this conversation on
          your phone to start or answer a call.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.replace('/')}
          style={styles.button}
        >
          <Text style={styles.buttonText}>Go back</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#100f0e',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    padding: 28,
    borderRadius: 24,
    backgroundColor: '#201b18',
  },
  icon: {
    width: 62,
    height: 62,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 21,
    backgroundColor: '#183b36',
  },
  title: {
    marginTop: 20,
    color: '#f5eee8',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  description: {
    marginTop: 10,
    color: '#c2b8b1',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  button: {
    minWidth: 120,
    marginTop: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#8bd9c3',
  },
  buttonText: {
    color: '#10221e',
    fontSize: 14,
    fontWeight: '800',
  },
});
