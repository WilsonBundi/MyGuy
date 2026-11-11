import { createElement, type ComponentProps } from 'react';

type LiveKitModule = typeof import('@livekit/react-native');

let liveKitModule: LiveKitModule | undefined;
let globalsRegistered = false;

function getLiveKit(): LiveKitModule {
  liveKitModule ??= require('@livekit/react-native') as LiveKitModule;
  if (!globalsRegistered) {
    liveKitModule.registerGlobals();
    globalsRegistered = true;
  }
  return liveKitModule;
}

export const AudioSession: LiveKitModule['AudioSession'] = new Proxy(
  {} as LiveKitModule['AudioSession'],
  {
    get(_target, property) {
      const audioSession = getLiveKit().AudioSession;
      const value = Reflect.get(audioSession, property);
      return typeof value === 'function' ? value.bind(audioSession) : value;
    },
  }
);

export function LiveKitRoom(props: ComponentProps<LiveKitModule['LiveKitRoom']>) {
  return createElement(getLiveKit().LiveKitRoom, props);
}

function lazyHook<K extends 'useDataChannel' | 'useLocalParticipant' | 'useParticipants' | 'useTracks'>(
  name: K
): LiveKitModule[K] {
  return new Proxy(function () {}, {
    apply(_target, thisArg, args) {
      return Reflect.apply(getLiveKit()[name], thisArg, args);
    },
  }) as unknown as LiveKitModule[K];
}

export const useDataChannel = lazyHook('useDataChannel');
export const useLocalParticipant = lazyHook('useLocalParticipant');
export const useParticipants = lazyHook('useParticipants');
export const useTracks = lazyHook('useTracks');

export function VideoTrack(props: ComponentProps<LiveKitModule['VideoTrack']>) {
  return createElement(getLiveKit().VideoTrack, props);
}
