# MyGuy Setup Guide

This guide will help you set up and run MyGuy on your local machine.

## Prerequisites

1. **Node.js 18+** - Download from https://nodejs.org/
2. **PostgreSQL** - Download from https://www.postgresql.org/download/windows/

## Installation Steps

### 1. Navigate to the Project

```bash
cd C:\Projects\MyGuy\myguy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Set Up PostgreSQL

#### Option A: Using pgAdmin (GUI)
1. Open pgAdmin
2. Create a new database named `myguy`
3. Note your connection details (host, port, username, password)

#### Option B: Using Command Line
```bash
# In Windows Command Prompt or PowerShell
psql -U postgres
CREATE DATABASE myguy;
\q
```

### 4. Configure Environment Variables

1. Copy the example environment file:
```bash
copy .env.example .env
```

2. Edit `.env` and update the following variables:

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://username:password@localhost:5432/myguy?schema=public"

# NextAuth - Generate a secret key
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-generated-secret-here"
```

3. Generate a NEXTAUTH_SECRET:
```bash
# In PowerShell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
& "C:\Program Files\nodejs\node.exe" -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Or use an online generator: https://generate-secret.vercel.app/32

### 5. Run Database Migrations

```bash
# In PowerShell
$env:Path = "C:\Program Files\nodejs;" + $env:Path
cd myguy
npx prisma migrate dev --name init
```

This will create all the database tables based on the Prisma schema.

### 6. Generate Prisma Client

```bash
npx prisma generate
```

### 7. Start the Development Server

```bash
npm run dev
```

### 8. Open in Browser

Navigate to: http://localhost:3000

## Troubleshooting

### Issue: "node is not recognized"
**Solution:** Ensure Node.js is installed and added to your PATH. Restart your terminal after installation.

### Issue: "psql: command not found"
**Solution:** Add PostgreSQL bin directory to your PATH or use pgAdmin GUI.

### Issue: Database connection error
**Solution:**
1. Verify PostgreSQL is running
2. Check your DATABASE_URL in `.env`
3. Ensure the database `myguy` exists

### Issue: Prisma migration fails
**Solution:**
1. Drop the database and recreate it:
```sql
DROP DATABASE myguy;
CREATE DATABASE myguy;
```
2. Run migrations again

### Issue: Port 3000 already in use
**Solution:**
1. Stop the process using port 3000
2. Or use a different port:
```bash
npm run dev -- -p 3001
```

## Project Structure Overview

```
myguy/
├── prisma/
│   └── schema.prisma          # Database schema (all models)
├── src/
│   ├── app/
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # Authentication endpoints
│   │   │   ├── pings/         # Pings (posts) endpoints
│   │   │   ├── chats/         # Chat endpoints
│   │   │   ├── circles/       # Circles endpoints
│   │   │   └── profile/       # Profile endpoints
│   │   ├── auth/              # Auth pages (signin, signup)
│   │   ├── create/            # Create content pages
│   │   ├── chats/             # Chat pages
│   │   ├── circles/           # Circles pages
│   │   ├── profile/           # Profile page
│   │   ├── discover/          # Discover page
│   │   ├── layout.tsx         # Root layout with navigation
│   │   └── page.tsx           # Home page (shows landing or feed)
│   ├── components/
│   │   ├── Navigation.tsx     # Main navigation component
│   │   ├── PingCard.tsx       # Individual ping display
│   │   ├── PingFeed.tsx       # Feed of pings
│   │   ├── ChatList.tsx       # List of user's chats
│   │   ├── ChatView.tsx       # Individual chat view
│   │   ├── CircleCard.tsx     # Individual circle display
│   │   ├── CircleList.tsx     # List of user's circles
│   │   ├── LandingPage.tsx    # Landing page for non-auth users
│   │   └── providers.tsx      # Session provider
│   ├── lib/
│   │   ├── auth.ts            # NextAuth configuration
│   │   └── prisma.ts          # Prisma client singleton
│   └── types/
│       └── next-auth.d.ts     # TypeScript types for NextAuth
├── .env.example               # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── README.md
```

## Database Models

### Core Models
- **User** - Authentication and user data
- **Profile** - User profile information (display name, bio, etc.)
- **Ping** - Short public posts (like tweets)
- **Moment** - Temporary photo/video updates (24h expiry)
- **Circle** - Groups and communities
- **CirclePost** - Posts within circles
- **Chat** - Private and group conversations
- **Message** - Chat messages
- **Connection** - Friend/follow relationships
- **Report** - Content moderation reports
- **Block** - User blocking
- **Like** - Likes on posts
- **Comment** - Comments on posts
- **Share** - Shares of posts

## Features Implemented

### ✅ Authentication
- User registration with email, username, password
- User login with credentials
- Session management with NextAuth.js
- Protected routes

### ✅ Pings (Posts)
- Create short public thoughts (max 500 chars)
- View feed of all pings
- Like/unlike pings
- Real-time like count updates
- Author information display
- Timestamp formatting

### ✅ Chats
- View list of all chats
- View individual chat with message history
- Send text messages
- Group and private chat support
- Message timestamps
- Last read tracking

### ✅ Circles
- Create new circles
- View list of user's circles
- Private and public circles
- Circle description and image
- Member and post counts

### ✅ Profiles
- View user profile
- Edit profile (display name, bio, location, website)
- Profile stats (followers, following, circles)
- Verification badge support
- Avatar display

### ✅ Navigation
- Responsive design (mobile and desktop)
- Active state highlighting
- Sign in/sign out functionality
- All main sections accessible

### ✅ UI/UX
- Beautiful landing page
- MyGuy brand identity (colors, terminology)
- Tailwind CSS styling
- Mobile-friendly design
- Loading states
- Error handling

## Next Steps

After setup, you can:

1. **Create an account** - Click "Get Started" on the landing page
2. **Post a Ping** - Go to Home and share your first thought
3. **Create a Circle** - Go to Circles and create a community
4. **Edit Profile** - Go to Profile and customize your display
5. **Start a Chat** - Go to Chats (chat creation UI to be added)

## Development Tips

### View Database
```bash
npx prisma studio
```
Opens a GUI to view and edit your database.

### Reset Database
```bash
npx prisma migrate reset
```
⚠️ **Warning:** This deletes all data!

### Create New Migration
```bash
npx prisma migrate dev --name your_migration_name
```

### Build for Production
```bash
npm run build
npm start
```

## Support

If you encounter issues:
1. Check the Troubleshooting section above
2. Verify all prerequisites are installed
3. Check environment variables are set correctly
4. Ensure PostgreSQL is running
5. Review the main README.md for more information
