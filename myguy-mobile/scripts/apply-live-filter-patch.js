const fs = require('fs');
const path = require('path');

const appRoot = path.resolve(__dirname, '..');
const packageRoot = path.join(appRoot, 'node_modules', '@livekit', 'react-native-webrtc');
const packageInfoPath = path.join(packageRoot, 'package.json');

if (!fs.existsSync(packageInfoPath)) {
  throw new Error('Cannot patch @livekit/react-native-webrtc: install mobile dependencies first.');
}

const packageInfo = JSON.parse(fs.readFileSync(packageInfoPath, 'utf8'));
if (packageInfo.version !== '114.1.0') {
  throw new Error(`Unsupported @livekit/react-native-webrtc version: ${packageInfo.version}`);
}

function patchTextFile(relativePath, replacements) {
  const filePath = path.join(packageRoot, relativePath);
  const original = fs.readFileSync(filePath, 'utf8');
  const newline = original.includes('\r\n') ? '\r\n' : '\n';
  let source = original.replace(/\r\n/g, '\n');

  for (const [before, after] of replacements) {
    if (source.includes(after)) continue;

    const firstIndex = source.indexOf(before);
    if (firstIndex < 0 || source.indexOf(before, firstIndex + before.length) >= 0) {
      throw new Error(`Expected one patch anchor in ${relativePath}; refusing an unsafe edit.`);
    }
    source = source.slice(0, firstIndex) + after + source.slice(firstIndex + before.length);
  }

  fs.writeFileSync(filePath, source.replace(/\n/g, newline));
}

function installNativeFile(sourceRelativePath, packageRelativePath) {
  const sourcePath = path.join(appRoot, 'native', 'live-filters', sourceRelativePath);
  const destinationPath = path.join(packageRoot, packageRelativePath);
  const expected = fs.readFileSync(sourcePath);

  if (fs.existsSync(destinationPath)) {
    if (!fs.readFileSync(destinationPath).equals(expected)) {
      throw new Error(`Refusing to overwrite a differing native file: ${packageRelativePath}`);
    }
    return;
  }

  fs.mkdirSync(path.dirname(destinationPath), { recursive: true });
  fs.copyFileSync(sourcePath, destinationPath);
}

patchTextFile('android/src/main/java/com/oney/WebRTCModule/videoEffects/VideoFrameProcessor.java', [[
  '    public VideoFrame process(VideoFrame frame, SurfaceTextureHelper textureHelper);\n}',
  '    public VideoFrame process(VideoFrame frame, SurfaceTextureHelper textureHelper);\n\n'
    + '    default void onCapturerStarted() {}\n\n'
    + '    default void onCapturerStopped() {}\n}',
]]);

patchTextFile('android/src/main/java/com/oney/WebRTCModule/videoEffects/VideoEffectProcessor.java', [[
  '    public void onCapturerStarted(boolean success) {}\n\n'
    + '    @Override\n'
    + '    public void onCapturerStopped() {}',
  '    public void onCapturerStarted(boolean success) {\n'
    + '        videoFrameProcessor.onCapturerStarted();\n'
    + '    }\n\n'
    + '    @Override\n'
    + '    public void onCapturerStopped() {\n'
    + '        videoFrameProcessor.onCapturerStopped();\n'
    + '    }',
]]);

patchTextFile('android/src/main/java/com/oney/WebRTCModule/videoEffects/ProcessorProvider.java', [
  [
    'import java.util.Map;',
    'import java.util.Map;\nimport org.webrtc.MyGuyLiveFilterProcessor;',
  ],
  [
    '    private static Map<String, VideoFrameProcessorFactoryInterface> methodMap =\n'
      + '            new HashMap<String, VideoFrameProcessorFactoryInterface>();',
    '    private static Map<String, VideoFrameProcessorFactoryInterface> methodMap =\n'
      + '            new HashMap<String, VideoFrameProcessorFactoryInterface>();\n\n'
      + '    static {\n'
      + '        for (String name : new String[] {"warm", "soft", "mono"}) {\n'
      + '            addProcessor(name, () -> new MyGuyLiveFilterProcessor(name));\n'
      + '        }\n'
      + '    }',
  ],
]);

patchTextFile('src/MediaStreamTrack.ts', [[
  '_setVideoEffect(name:string)',
  '_setVideoEffect(name: string | null)',
]]);

patchTextFile('ios/RCTWebRTC/WebRTCModule+RTCMediaStream.m', [
  [
    '#import "VideoCaptureController.h"',
    '#import "VideoCaptureController.h"\n#import "MyGuyLiveVideoEffectDelegate.h"\n\n'
      + 'static char MyGuyVideoEffectDelegateKey;',
  ],
  [
    '    RTCCameraVideoCapturer *videoCapturer = [[RTCCameraVideoCapturer alloc] initWithDelegate:videoSource];\n'
      + '    VideoCaptureController *videoCaptureController =\n'
      + '        [[VideoCaptureController alloc] initWithCapturer:videoCapturer andConstraints:constraints[@"video"]];',
    '    MyGuyLiveVideoEffectDelegate *effectDelegate =\n'
      + '        [[MyGuyLiveVideoEffectDelegate alloc] initWithSink:videoSource];\n'
      + '    RTCCameraVideoCapturer *videoCapturer =\n'
      + '        [[RTCCameraVideoCapturer alloc] initWithDelegate:effectDelegate];\n'
      + '    VideoCaptureController *videoCaptureController =\n'
      + '        [[VideoCaptureController alloc] initWithCapturer:videoCapturer andConstraints:constraints[@"video"]];\n'
      + '    objc_setAssociatedObject(\n'
      + '        videoCaptureController, &MyGuyVideoEffectDelegateKey, effectDelegate, OBJC_ASSOCIATION_RETAIN_NONATOMIC);',
  ],
  [
    'RCT_EXPORT_METHOD(mediaStreamTrackSetVolume : (nonnull NSNumber *)pcId : (nonnull NSString *)trackID : (double)volume) {',
    'RCT_EXPORT_METHOD(mediaStreamTrackSetVideoEffect : (nonnull NSString *)trackID : (NSString *)name) {\n'
      + '#if TARGET_OS_TV\n'
      + '    return;\n'
      + '#else\n'
      + '    RTCMediaStreamTrack *track = self.localTracks[trackID];\n'
      + '    if (![track isKindOfClass:[RTCVideoTrack class]]) {\n'
      + '        RCTLogError(@"[MyGuyLiveFilter] Cannot apply a video filter to track %@", trackID);\n'
      + '        return;\n'
      + '    }\n\n'
      + '    id effectDelegate = objc_getAssociatedObject(track.captureController, &MyGuyVideoEffectDelegateKey);\n'
      + '    if (![effectDelegate isKindOfClass:[MyGuyLiveVideoEffectDelegate class]]) {\n'
      + '        RCTLogError(@"[MyGuyLiveFilter] Native video filter is unavailable for track %@", trackID);\n'
      + '        return;\n'
      + '    }\n'
      + '    [(MyGuyLiveVideoEffectDelegate *)effectDelegate setEffectName:name];\n'
      + '#endif\n'
      + '}\n\n'
      + 'RCT_EXPORT_METHOD(mediaStreamTrackSetVolume : (nonnull NSNumber *)pcId : (nonnull NSString *)trackID : (double)volume) {',
  ],
]);

patchTextFile('livekit-react-native-webrtc.podspec', [[
  "s.framework           = 'AudioToolbox','AVFoundation', 'CoreAudio', 'CoreGraphics', 'CoreVideo', 'GLKit', 'VideoToolbox'",
  "s.framework           = 'AudioToolbox','AVFoundation', 'CoreAudio', 'CoreGraphics', 'CoreImage', 'CoreVideo', 'GLKit', 'VideoToolbox'",
]]);

installNativeFile(
  'android/MyGuyLiveFilterProcessor.java',
  'android/src/main/java/org/webrtc/MyGuyLiveFilterProcessor.java',
);
installNativeFile(
  'ios/MyGuyLiveVideoEffectDelegate.h',
  'ios/RCTWebRTC/MyGuyLiveVideoEffectDelegate.h',
);
installNativeFile(
  'ios/MyGuyLiveVideoEffectDelegate.m',
  'ios/RCTWebRTC/MyGuyLiveVideoEffectDelegate.m',
);

console.log('Applied MyGuy live video filter native integration.');
