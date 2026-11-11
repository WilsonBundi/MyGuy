const { withAndroidManifest, withInfoPlist } = require('@expo/config-plugins');

module.exports = function withWebRTC(config) {
  config = withAndroidManifest(config, (mod) => {
    const permissions = mod.modResults.manifest['uses-permission'] || [];
    const required = [
      'android.permission.CAMERA',
      'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
    ];
    for (const permission of required) {
      if (!permissions.some((entry) => entry.$['android:name'] === permission)) {
        permissions.push({ $: { 'android:name': permission } });
      }
    }
    mod.modResults.manifest['uses-permission'] = permissions;
    return mod;
  });

  return withInfoPlist(config, (mod) => {
    mod.modResults.NSCameraUsageDescription =
      'MyGuy uses your camera during video calls and live streams.';
    mod.modResults.NSMicrophoneUsageDescription =
      'MyGuy uses your microphone during calls and live streams.';
    return mod;
  });
};
