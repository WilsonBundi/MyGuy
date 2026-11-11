# Live creator features

The creator controls are backed by MyGuy's API and database. Apply the new Prisma migration before deploying the backend:

```powershell
npx prisma migrate deploy
```

## Guest stage and safety

- A host can invite a MyGuy username or accept a viewer's request. Stage acceptance is limited to three co-hosts, and the backend updates LiveKit publish permissions before the guest can publish.
- Host-only safety controls pause chat, remove or ban a participant, mute a co-host's publishing permissions, and mute chat for 15 minutes. Message reports are stored in the existing report queue.
- A kick blocks rejoining for one minute. A ban lasts for the current live and can be lifted by the host.

## Store-verified gifts

Gift coins are consumable purchases. Create these product IDs as consumables in App Store Connect and Google Play, add them to the RevenueCat project, and configure the `myguy-mobile` app in RevenueCat:

| Product ID | Coins |
|---|---:|
| `myguy.coins.100` | 100 |
| `myguy.coins.550` | 550 |
| `myguy.coins.1200` | 1,200 |

Set `EXPO_PUBLIC_REVENUECAT_IOS_KEY` and `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY` in the mobile build environment. Configure the RevenueCat webhook to call `https://<api-host>/api/webhooks/revenuecat` and send the secret in the `Authorization` header; set that same value as `REVENUECAT_WEBHOOK_AUTHORIZATION` on the backend. The endpoint credits coins only from RevenueCat's verified `NON_RENEWING_PURCHASE` events and deduplicates store transactions. Do not expose RevenueCat secret API keys in the app.

The current gifts are in-app appreciation only: coins and gifts are not cash-redeemable and do not create creator payouts. A real cash-out program needs separate tax, identity-verification, fraud, and payout-provider decisions.

Real store purchases need an iOS/Android development or release build; Expo Go preview mode is not a purchase test. Rebuild the native app after adding the RevenueCat SDK.

## Private replays

Set `LIVE_REPLAY_BUCKET`, `LIVE_REPLAY_REGION`, `LIVE_REPLAY_ACCESS_KEY`, and `LIVE_REPLAY_SECRET_KEY` on the backend. `LIVE_REPLAY_ENDPOINT` is optional for S3-compatible storage. Keep the bucket private. The storage credentials must allow LiveKit Egress to write replay objects and the backend to read, sign, and delete them. Scope the credentials to the `live-replays/` prefix.

Configure a LiveKit webhook to call `https://<api-host>/api/webhooks/livekit`. It must use the same LiveKit API key and secret as the backend so the SDK can authenticate webhook signatures. The host must explicitly start recording; the replay contains the host and co-host audio/video, not audience chat. Playback is host-only and uses five-minute signed URLs. MyGuy rejects expired replays and deletes their objects when they are accessed; configure an S3 lifecycle rule to delete `live-replays/` objects after 30 days for cleanup even if the host never opens the replay page.

## Camera filters

Host video lives include three original native looks: Warm, Soft, and Mono, plus None to reset. Effects run on captured frames before LiveKit publishes them, so co-hosts, viewers, and recorded replays receive the same processed video; these are color treatments rather than face-tracking masks.

The native integration applies a version-checked patch to `@livekit/react-native-webrtc` from the mobile app's `postinstall` script. After pulling the changes, install dependencies and create a fresh EAS development build for Android or iOS. Expo Go cannot load these native processors. Verify on physical devices: Android uses an OpenGL ES frame processor; iOS uses Core Image with GPU rendering. iOS compilation and device performance still need validation on macOS/Xcode, and processing falls back to the unfiltered camera frame if a device cannot allocate a filter output buffer.
