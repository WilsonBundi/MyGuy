# MyGuy Feature Architecture
## People. Moments. Everywhere.

### Platform Overview
MyGuy = One international social network for people, conversations, communities, and moments.

---

## 📱 Core Modules (Organized by Functionality)

### 1. STREAMS (Feed Module)
*Combines Facebook News Feed + Instagram Feed + X Timeline*

**MyGuy Terminology:**
- **Pings** - Short public thoughts (280 chars)
- **Ping Streams** - Algorithmic feed of Pings
- **Resonates** - Like/React to Pings (6 emotions: ✨ Sparkle, ❤️ Glow, 😄 Radiate, 🤯 Illuminate, 💫 Dazzle, 🔥 Ignite)
- **Echoes** - Re-post to your feed (X retweets)
- **Replies** - Comments on Pings
- **Quote Echos** - Repost with your own comment

**Features:**
- AI-powered content ranking (like Facebook EdgeRank)
- Personalized feed algorithm
- Rich media support (text, images, videos, GIFs)
- Content filters (All, Pings, Moments, Circles)
- Save for later (Bookmarks)
- Pin important Pings

---

### 2. MOMENTS (Disappearing Content)
*Combines Instagram Stories + WhatsApp Status*

**MyGuy Terminology:**
- **Moments** - Temporary photo/video updates (24h)
- **Moment Highlights** - Permanent curated collections
- **Inner Circle** - Close friends list
- **Moment Viewers** - See who viewed your moment
- **Moment Reactions** - Quick reactions to moments

**Features:**
- 24-hour expiration
- Creative tools (AR filters, stickers, text, music)
- Polls, quizzes, questions
- Add to profile highlights
- Mention friends/groups
- Reply with message
- Privacy controls (everyone, inner circle, custom)

---

### 3. CIRCLES (Communities)
*Combines Facebook Groups + Instagram Communities + X Communities*

**MyGuy Terminology:**
- **Circles** - Groups and communities
- **Circle Feeds** - Posts within circles
- **Circle Moments** - Stories for circles
- **Circle Members** - Group members
- **Circle Admins** - Group moderators
- **Discover Circles** - Find new communities

**Features:**
- Public/private circles
- Circle posts with likes/comments
- Circle events
- Circle announcements
- Member management
- Circle guidelines
- Join requests
- Circle search and discovery

---

### 4. CHATS (Messaging)
*Combines WhatsApp + Instagram DMs + X DMs*

**MyGuy Terminology:**
- **Chats** - Private messaging
- **Chat Rooms** - Group conversations
- **Whispers** - Disappearing messages
- **Chat Notes** - Note-to-self in chats
- **Chat Filters** - Organize conversations
- **Chat Pins** - Pin important chats

**Features:**
- One-on-one and group chats
- Text, photos, videos, voice notes, video notes
- End-to-end encryption
- Message reactions
- Message forwarding
- Search within chats
- Star important messages
- Disappearing messages (custom timers)
- Chat backgrounds/themes
- Polls in chats

---

### 5. ROOMS (Live Conversations)
*Combines X Spaces + Instagram Live + WhatsApp Calls*

**MyGuy Terminology:**
- **Rooms** - Live audio/video conversations
- **Room Hosts** - Moderators
- **Room Speakers** - Active participants
- **Room Listeners** - Audience
- **Room Recordings** - Save conversations
- **Room Schedules** - Planned live sessions

**Features:**
- Live audio rooms (up to 13 speakers, unlimited listeners)
- Live video rooms
- Screen sharing
- Room scheduling
- Room notifications
- Room recordings
- Room reactions
- Raise hand to speak
- Whisper to host

---

### 6. EVENTS (Gatherings)
*Combines Facebook Events + WhatsApp Events*

**MyGuy Terminology:**
- **Events** - In-person and virtual gatherings
- **Event RSVPs** - Attendance tracking
- **Event Reminders** - Notification system
- **Event Calendar** - Personal calendar
- **Event Photos** - Event albums
- **Event Discussions** - Pre/post event chat

**Features:**
- Create public/private events
- RSVP tracking
- Event reminders
- Event maps/locations
- Virtual event support
- Event photo sharing
- Event group chats
- Import to personal calendar

---

### 7. PROFILES (Identity)
*Combines Facebook Profiles + Instagram Profiles + X Profiles*

**MyGuy Terminology:**
- **Profile** - User identity space
- **Bio** - About me section
- **Profile Moments** - Story highlights
- **Profile Grid** - Content gallery
- **Connections** - Friends/followers
- **Verified Badge** - Trust indicator

**Features:**
- Display name, username, bio
- Profile picture, cover photo
- Location, website, pronouns
- Verification badge
- Follower/following counts
- Content grid (pings, moments)
- Story highlights
- Activity status
- Profile themes

---

### 8. CONNECT (Relationships)
*Combines Facebook Friends + Instagram Following + X Following*

**MyGuy Terminology:**
- **Connect** - Friend/follow system
- **Connections** - Your network
- **Connection Requests** - Pending requests
- **Suggested Connections** - People you may know
- **Block** - Block unwanted users
- **Mute** - Hide content without blocking

**Features:**
- Follow/friend system
- Connection requests
- Suggestions algorithm
- Block/mute functionality
- Connection lists (close friends, family, etc.)
- Privacy controls per connection
- See who's connected to you

---

### 9. SPOTLIGHT (Discovery)
*Combines Facebook Explore + Instagram Explore + X For You*

**MyGuy Terminology:**
- **Spotlight** - Discover trending content
- **Trending Pings** - Hot topics
- **Trending Circles** - Popular communities
- **Suggested Users** - People to follow
- **Featured Content** - Curated picks
- **Hashtag Explorer** - Topic discovery

**Features:**
- Trending topics
- Suggested content
- Hashtag pages
- Featured creators
- Explore by category
- Local discovery
- Content curation
- Personalized recommendations

---

### 10. VIDEO (Short-Form Video)
*Combines Instagram Reels + X Videos + TikTok-style*

**MyGuy Terminology:**
- **Clips** - Short-form videos (up to 3 minutes)
- **Clip Editor** - In-app editing tools
- **Clip Sound** - Audio library
- **Clip Remix** - Collaborate on videos
- **Clip Align** - Seamless transitions
- **Clip Effects** - AR filters and effects

**Features:**
- Multi-clip editing
- Audio library
- AR filters
- Text overlays
- Speed control
- Timer for hands-free recording
- Remix functionality
- Share to other platforms

---

### 11. CALLS (Real-Time Communication)
*Combines WhatsApp Calls + Instagram Video Chat + X Video*

**MyGuy Terminology:**
- **Calls** - Voice and video calls
- **Group Calls** - Multi-person calls
- **Call Links** - Shareable call URLs
- **Call Scheduling** - Plan calls ahead
- **Call History** - Past calls log
- **Screen Share** - Share your screen

**Features:**
- Voice calls (unlimited duration)
- Video calls (HD quality)
- Group calls (up to 32 people)
- Screen sharing
- Call scheduling
- Call links
- Silent calls (drop-in without ringing)
- Call effects and filters

---

### 12. NOTIFICATIONS (Alerts)
*Combines All Platform Notification Systems*

**MyGuy Terminology:**
- **Alerts** - Notification system
- **Notification Center** - All alerts in one place
- **Quiet Mode** - Mute notifications
- **Priority Alerts** - Important messages only
- **Snooze** - Temporarily mute

**Features:**
- Push notifications
- In-app notifications
- Notification categories
- Do not disturb
- Quiet hours
- Notification grouping
- Message notifications
- Event reminders
- Mention notifications

---

## 🌍 International Features

### MyGuy Translate
- **Auto-translate** - Translate posts to your language
- **Original language toggle** - See original text
- **Multi-language support** - Interface in 50+ languages
- **Location-based content** - Discover by region
- **Time-zone aware** - Time shown in user's timezone
- **Regional discovery** - Find local content and users

### International Numbers
- **Phone number signup** - Sign up with phone
- **International dialing** - Country code support
- **SMS verification** - Secure phone verification
- **Username discovery** - Find by username globally

---

## 🔒 Privacy & Safety

### Privacy Controls
- **Profile visibility** - Public, friends only, private
- **Ping privacy** - Who can see your pings
- **Moment privacy** - Inner circle, custom lists
- **Chat settings** - Who can message you
- **Story replies** - Who can reply to moments
- **Data export** - Download your data

### Content Moderation
- **Report** - Report content or users
- **Block** - Block users
- **Mute** - Mute without blocking
- **Restrict** - Limit interactions
- **Appeal process** - Challenge moderation decisions
- **Community guidelines** - Clear rules

### Safety Features
- **Two-factor authentication** - Extra security
- **Account recovery** - Secure recovery process
- **Login alerts** - Notify of new logins
- **Verified badges** - Trust indicators
- **Spam protection** - Automated spam detection

---

## 🎨 Unique MyGuy Features

### 1. Unified Content Creation
**"What do you want to share?"**
Instead of choosing between platforms, MyGuy's unified create menu lets users choose the content type:
- 📷 Moment
- 🎥 Video (Clip)
- ✍️ Ping
- 📍 Event
- 👥 Circle post
- 📡 Live Room

### 2. Relationship-Centric Design
MyGuy's unique layer is the relationship/community system that connects all content types. Every piece of content can be:
- Public (Streams)
- Private (Chats)
- Community-based (Circles)
- Temporary (Moments)
- Live (Rooms)

### 3. MyGuy Translate Signature Feature
Automatic translation across the platform:
- User A writes in Kiswahili
- User B reads in Portuguese
- User C sees in Japanese
- Without requiring users to speak the same language

---

## 📊 Technical Architecture

### Frontend
- **Web**: Next.js 15 + React + TypeScript + Tailwind CSS
- **Mobile**: React Native (future)
- **Real-time**: WebSockets + Socket.io

### Backend
- **API**: Next.js API Routes + NestJS (future)
- **Database**: PostgreSQL + Prisma ORM
- **Cache**: Redis (sessions, rate limiting)
- **Storage**: S3/Cloudinary (media)
- **Real-time**: Socket.io server
- **Translation**: Google Translate API / DeepL API

### Infrastructure
- **Authentication**: NextAuth.js
- **Video**: WebRTC for calls
- **Notifications**: FCM / APNs
- **Search**: PostgreSQL full-text search / Elasticsearch
- **Media**: FFmpeg for video processing
- **CDN**: Cloudflare / CloudFront

---

## 🗺️ Information Architecture

### Primary Navigation
**Home · Discover · Create · Circles · Chats · Profile**

### Content Hierarchy
1. **Streams** - Main feed of Pings and Clips
2. **Spotlight** - Discovery and trending
3. **Circles** - Communities
4. **Chats** - Messaging
5. **Profile** - Personal space
6. **Create** - Content creation hub

### User Flows
- **Onboarding** → Complete profile → Find connections → Join circles
- **Content Creation** → Choose type → Create → Share
- **Discovery** → Explore content → Engage → Connect
- **Communication** → Start chat → Join room → Schedule call

---

## 🎯 Distinctive Design Choices

### What We DON'T Copy
❌ Facebook's blue/white color scheme
❌ Instagram's camera logo language
❌ X's black/white branding
❌ WhatsApp's green chat identity
❌ "Like", "Tweet", "Story", "Reel", "Status" terminology
❌ Exact navigation structures
❌ Exact feed card designs
❌ Distinctive iconography
❌ Proprietary names

### What We DO Have
✅ Purple/indigo brand colors (original)
✅ Original terminology (Pings, Moments, Circles, etc.)
✅ Unified content creation model
✅ Relationship-centric architecture
✅ International-first design
✅ MyGuy Translate signature feature
✅ Dark/light mode system
✅ Unique visual language

---

## 📋 Development Roadmap

### Phase 1: Core MVP (Current)
✅ Authentication
✅ Pings (feed)
✅ Chats (messaging)
✅ Circles (communities)
✅ Profiles
✅ Dark/light mode
✅ Basic UI

### Phase 2: Content Expansion
- Moments (24h content)
- Clips (short videos)
- Events
- Rich media uploads
- Advanced feed algorithm

### Phase 3: Communication
- Rooms (live audio)
- Video/Voice calls
- Screen sharing
- Call scheduling
- Call recording

### Phase 4: International
- MyGuy Translate
- Multi-language UI
- Regional discovery
- Time-zone features
- International numbers

### Phase 5: Discovery
- Spotlight (trending)
- Hashtag system
- Content recommendations
- Suggested users
- Featured content

### Phase 6: Safety & Moderation
- Reporting system
- Blocking/muting
- Content moderation
- Privacy controls
- Two-factor auth

### Phase 7: Mobile
- React Native apps
- Push notifications
- Background sync
- Offline support

---

## 💡 Unique Value Proposition

MyGuy isn't four apps combined. It's one unified platform that asks:
**"What do you want to share?"**

And provides the right tools for every type of communication:
- Short thoughts → Pings
- Temporary moments → Moments
- Private conversations → Chats
- Community discussions → Circles
- Live conversations → Rooms
- Events → Events
- Short videos → Clips

All with international translation, privacy-first design, and a unique identity.
