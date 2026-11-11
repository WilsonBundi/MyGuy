# MyGuy - Google Play Store Upload Guide

## Prerequisites

1. Google Play Developer Account ($25 fee)
2. Node.js installed
3. Expo CLI installed

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

## Step 2: Configure EAS

```bash
cd C:\Projects\MyGuy\myguy-mobile
eas build:configure
```

This will:
- Create `eas.json` (already created for you)
- Set up your Expo account
- Configure build settings

## Step 3: Login to Expo

```bash
eas login
```

You'll need to create an Expo account at https://expo.dev if you don't have one.

## Step 4: Update app.json

Make sure your `app.json` has the correct configuration:

```json
{
  "expo": {
    "name": "MyGuy",
    "slug": "myguy",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.myguy.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      },
      "package": "com.myguy.app",
      "permissions": [
        "INTERNET",
        "ACCESS_NETWORK_STATE",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE"
      ]
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

## Step 5: Build Preview APK (for testing)

```bash
eas build --platform android --profile preview
```

This will:
- Build an APK file
- Upload to EAS
- Send you a download link when done
- Takes about 10-20 minutes

## Step 6: Test the APK

1. Download the APK from the link provided
2. Install on your Android device
3. Test all features
4. Fix any bugs

## Step 7: Build Production AAB (for Play Store)

```bash
eas build --platform android --profile production
```

This will:
- Build an AAB (Android App Bundle) file
- Optimized for Play Store
- Takes about 10-20 minutes

## Step 8: Upload to Google Play Console

1. Go to https://play.google.com/console
2. Create new app
3. Fill in:
   - App name: MyGuy
   - Package name: com.myguy.app
   - App category: Social
   - Email: your email

4. Upload the AAB file from Step 7

## Step 9: Complete Store Listing

### Required Items:
- App icon (512x512 PNG)
- Feature graphic (1024x500 PNG)
- Screenshots (at least 2, phone size)
- Short description (80 characters)
- Full description
- Privacy policy URL (create one)
- Content rating questionnaire

### Screenshots needed:
- Phone (required)
- Tablet (optional)
- 7-inch tablet (optional)
- 10-inch tablet (optional)
- Wear (optional)
- TV (optional)
- Chromebook (optional)

## Step 10: Testing Tracks

1. **Internal Testing** (for your team)
   - Upload APK
   - Add testers
   - Test thoroughly

2. **Closed Testing** (for beta testers)
   - Upload APK
   - Add testers
   - Collect feedback

3. **Open Testing** (public beta)
   - Upload APK
   - Anyone can join
   - Collect feedback

## Step 11: Production Release

1. **Upload production AAB**
2. **Complete all content ratings**
3. **Submit for review**
4. **Wait for approval** (1-3 days)

## Important Notes

### Package Name
- Once set, cannot be changed
- Choose carefully: `com.myguy.app` or `com.yourcompany.myguy`

### Signing Key
- EAS will manage your signing key
- Keep your account secure
- Backup your signing key

### Version Numbers
- Increment version in `app.json` for each release
- Format: `1.0.0`, `1.0.1`, `1.1.0`, etc.

### Permissions
- Only request permissions you actually use
- Document why each permission is needed

### Privacy Policy
- Required for Play Store
- Can use a free privacy policy generator
- Host on your website or GitHub Pages

## Troubleshooting

### Build Fails
- Check logs in EAS dashboard
- Verify all dependencies are installed
- Check for TypeScript errors

### Upload Fails
- Check file size (max 150MB for AAB)
- Verify package name matches
- Check signing configuration

### Review Rejected
- Read rejection reason carefully
- Fix the issue
- Resubmit

## Cost

- Developer account: $25 (one-time)
- EAS builds: Free (with limits)
- No cost for app updates

## Timeline

- Initial setup: 1-2 hours
- Build process: 20-30 minutes
- Store listing: 2-4 hours
- Review process: 1-3 days
- Total: 2-5 days to first release

## Support

- Expo documentation: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/build/introduction
- Play Console: https://support.google.com/googleplay/android-developer
