import { Alert, Platform } from 'react-native';

export function confirmSignOut(onConfirm: () => Promise<void>) {
  const title = 'Sign out?';
  const message = 'This will end your MyGuy session on this device.';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(`${title}\n\n${message}`)) {
      void onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Stay signed in', style: 'cancel' },
    { text: 'Sign out', style: 'destructive', onPress: () => void onConfirm() },
  ]);
}

export function showSignOutError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Please try again.';
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(`Could not sign out\n\n${message}`);
    return;
  }
  Alert.alert('Could not sign out', message);
}
