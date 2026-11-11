# MyGuy Development Build Guide

## What is a Development Build?

A development build is a custom Android APK that includes:
- ✅ All native modules (WebRTC, LiveKit, etc.)
- ✅ Live streaming support
- ✅ Better performance
- ✅ Debugging tools
- ✅ Faster reloads

## Why Do You Need It?

**Expo Go** doesn't include custom native modules like WebRTC/LiveKit, so live streaming won't work.

**Development Build** includes all native modules, so live streaming will work perfectly.

## Method 1: EAS Build (Recommended - Easiest)

### Step 1: Install EAS CLI

Open Command Prompt and run:
```bash
npm install -g eas-cli
```

### Step 2: Login to Expo

```bash
eas login
```

You'll need to create an Expo account at https://expo.dev if you don't have one.

### Step 3: Configure EAS

```bash
cd C:\Projects\MyGuy\myguy-mobile
eas build:configure
```

This will set up your project for EAS builds.

### Step 4: Build Development APK

```bash
eas build --platform android --profile development
```

This will:
- Build an Android APK with all native modules
- Upload to EAS cloud
- Send you a download link via email
- Take 10-20 minutes

### Step 5: Install the APK

1. Download the APK from the link in your email
2. Install on your Android device
3. Open the app
4. Test live streaming!

## Method 2: Local Build (Advanced - More Control)

### Prerequisites

1. **Install Android Studio**
   - Download from: https://developer.android.com/studio
   - Install Android SDK
   - Set up Android environment variables

2. **Install Java JDK**
   - Download JDK 17 or later
   - Set JAVA_HOME environment variable

3. **Install Node.js**
   - Should already be installed

### Build Steps

```bash
cd C:\Projects\MyGuy\myguy-mobile

# Generate native code
npx expo prebuild

# Build Android APK
cd android
./gradlew assembleDebug

# APK location: android/app/build/outputs/apk/debug/app-debug.apk
```

## Method 3: Use the Batch File (Easiest for You)

I've created a batch file that automates EAS build:

**Run:**
```
C:\Projects\MyGuy\myguy-mobile\BUILD_DEV_ANDROID.bat
```

This will:
1. Install EAS CLI
2. Configure EAS
3. Start the build
4. Send you a download link

## What's Included in the Development Build?

✅ **LiveKit** - Live streaming
✅ **WebRTC** - Video/audio streaming
✅ **React Native Purchases** - Coin system
✅ **Live Filters** - Beauty filters
✅ **All MyGuy features** - Everything else

## Testing the Development Build

Once installed:

1. **Test Live Streaming:**
   - Go to the live screen
   - Start a live stream
   - Test video/audio
   - Test filters
   - Test chat & reactions

2. **Test Coins System:**
   - Go to a live stream
   - Open wallet
   - Test coin purchases

3. **Test All Features:**
   - Sign up/sign in
   - Post pings
   - Chat
   - Profile
   - Everything should work!

## Troubleshooting

### Build Fails

**Check the EAS dashboard:**
- Go to https://expo.dev
- Check your build logs
- Look for specific errors

**Common issues:**
- Missing dependencies → Run `npm install`
- Version conflicts → Check package.json
- Configuration errors → Check eas.json

### APK Won't Install

**Enable unknown sources:**
- Settings → Security → Unknown sources
- Allow installation from unknown sources

### Live Streaming Still Doesn't Work

**Check permissions:**
- Settings → Apps → MyGuy → Permissions
- Enable Camera, Microphone, Storage

**Check network:**
- Make sure you have good internet
- WebRTC requires stable connection

## Updating the Development Build

When you make code changes:

```bash
eas build --platform android --profile development
```

This will create a new APK with your changes.

## Cost

- **EAS builds:** Free (with monthly limits)
- No cost for development builds
- Production builds also free (with limits)

## Timeline

- First build: 20-30 minutes (EAS caches future builds)
- Subsequent builds: 10-15 minutes
- Total time to first test: ~30 minutes

## Support

- EAS documentation: https://docs.expo.dev/build/introduction
- LiveKit docs: https://docs.livekit.io
- Expo support: https://expo.dev/support

## Quick Start Summary

**Easiest path:**
```bash
# 1. Install EAS CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Build
cd C:\Projects\MyGuy\myguy-mobile
eas build --platform android --profile development

# 4. Wait 10-20 minutes
# 5. Download APK from email
# 6. Install on phone
# 7. Test live streaming!
```

**Or just run:**
```
C:\Projects\MyGuy\myguy-mobile\BUILD_DEV_ANDROID.bat
```

And follow the prompts!
