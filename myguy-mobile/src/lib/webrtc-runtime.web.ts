import { createElement } from 'react';
import { View } from 'react-native';

export class RTCIceCandidate {
  constructor(_candidate: unknown) {
    throw new Error('Voice and video calls are available in the MyGuy mobile app.');
  }
}

export class RTCSessionDescription {
  constructor(_description: unknown) {
    throw new Error('Voice and video calls are available in the MyGuy mobile app.');
  }
}

export class RTCPeerConnection {
  constructor(_configuration?: unknown) {
    throw new Error('Voice and video calls are available in the MyGuy mobile app.');
  }
}

export const mediaDevices = {
  getUserMedia: async (_constraints?: unknown): Promise<never> => {
    throw new Error('Voice and video calls are available in the MyGuy mobile app.');
  },
};

export function RTCView(props: { style?: object }) {
  return createElement(View, props);
}
