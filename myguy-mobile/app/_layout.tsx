import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../src/contexts/AuthContext';
import { PingProvider } from '../src/contexts/PingContext';
import { DiscoverProvider } from '../src/contexts/DiscoverContext';
import { ChatProvider } from '../src/contexts/ChatContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <PingProvider>
          <DiscoverProvider>
            <ChatProvider>
              <StatusBar style="light" backgroundColor="#f97316" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="signin" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen name="chat-detail" options={{ headerShown: false }} />
                <Stack.Screen name="call" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="live" options={{ headerShown: false, gestureEnabled: false }} />
                <Stack.Screen name="live-replay" options={{ headerShown: false }} />
                <Stack.Screen name="crew-detail" options={{ headerShown: false }} />
                <Stack.Screen name="hub" options={{ headerShown: false }} />
                <Stack.Screen name="settings" options={{ headerShown: false }} />
                <Stack.Screen name="pulse" options={{ headerShown: false }} />
                <Stack.Screen name="notifications" options={{ headerShown: false }} />
              </Stack>
            </ChatProvider>
          </DiscoverProvider>
        </PingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
