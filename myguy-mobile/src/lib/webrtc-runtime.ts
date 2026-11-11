import { createElement, type ComponentProps } from 'react';

type WebRTCModule = typeof import('@livekit/react-native-webrtc');

let webRTCModule: WebRTCModule | undefined;

function getWebRTC(): WebRTCModule {
  webRTCModule ??= require('@livekit/react-native-webrtc') as WebRTCModule;
  return webRTCModule;
}

function lazyConstructor<K extends 'RTCIceCandidate' | 'RTCPeerConnection' | 'RTCSessionDescription'>(
  name: K
): WebRTCModule[K] {
  return new Proxy(function () {}, {
    construct(_target, args) {
      return Reflect.construct(getWebRTC()[name] as new (...args: never[]) => object, args);
    },
  }) as unknown as WebRTCModule[K];
}

export const RTCIceCandidate = lazyConstructor('RTCIceCandidate');
export const RTCPeerConnection = lazyConstructor('RTCPeerConnection');
export const RTCSessionDescription = lazyConstructor('RTCSessionDescription');

export function RTCView(props: ComponentProps<WebRTCModule['RTCView']>) {
  return createElement(getWebRTC().RTCView, props);
}

export const mediaDevices: WebRTCModule['mediaDevices'] = new Proxy(
  {} as WebRTCModule['mediaDevices'],
  {
    get(_target, property) {
      const devices = getWebRTC().mediaDevices;
      const value = Reflect.get(devices, property);
      return typeof value === 'function' ? value.bind(devices) : value;
    },
  }
);
