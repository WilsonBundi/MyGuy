import { createElement } from 'react';
import { View } from 'react-native';

const unavailable = () => {
  throw new Error('Live streaming is available in the MyGuy mobile app.');
};

export const AudioSession = {
  startAudioSession: async () => unavailable(),
  stopAudioSession: async () => unavailable(),
};

export function LiveKitRoom({ children }: { children?: React.ReactNode }) {
  return createElement(View, null, children);
}

export function useDataChannel() {
  return unavailable();
}

export function useLocalParticipant() {
  return unavailable();
}

export function useParticipants() {
  return unavailable();
}

export function useTracks() {
  return unavailable();
}

export function VideoTrack() {
  return null;
}

export function registerGlobals() {}
