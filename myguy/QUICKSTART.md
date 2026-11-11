# MyGuy Quick Start Guide

This is the fastest way to get MyGuy running on your Windows machine.

## Prerequisites (Already Installed ✅)

- ✅ Node.js v24.21.0
- ✅ PostgreSQL 18.6
- ✅ Dependencies installed

## Step 1: Create the Database

### Option A: Using pgAdmin (Easiest)

1. Open **pgAdmin** (search in Windows Start menu)
2. Connect to your PostgreSQL server
3. In the left panel, right-click on **Databases**
4. Select **Create** → **Database...**
5. Name it: `myguy`
6. Click **Save**

### Option B: Using the Batch Script

1. Open Command Prompt in the myguy folder:
```cmd
cd C:\Projects\MyGuy\myguy
setup-database.bat
```
2. Enter your PostgreSQL password when prompted

## Step 2: Set Up Environment Variables

Run the environment setup script:

```cmd
cd C:\Projects\MyGuy\myguy
setup-env.bat
```

This will:
- Ask for your PostgreSQL username and password
- Generate a secure NEXTAUTH_SECRET
- Create the `.env` file automatically

**Or do it manually:**

1. Copy `.env.example` to `.env`:
```cmd
copy .env.example .env
```

2. Edit `.env` and update:
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/myguy?schema=public"
NEXTAUTH_SECRET="YOUR_GENERATED_SECRET"
```

3. Generate a secret:
```cmd
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## Step 3: Run Database Migrations

```cmd
cd C:\Projects\MyGuy\myguy
npx prisma migrate dev --name init
```

This will create all the database tables (User, Profile, Ping, Chat, Circle, etc.)

## Step 4: Generate Prisma Client

```cmd
npx prisma generate
```

## Step 5: Start the Development Server

```cmd
npm run dev
```

## Step 6: Open MyGuy

Open your browser and go to: **http://localhost:3000**

## What You Can Do Now

1. **Sign Up** - Click "Get Started" to create an account
2. **Post a Ping** - Share your first public thought
3. **Create a Circle** - Start a community
4. **Edit Your Profile** - Customize your display name and bio
5. **View Chats** - Start messaging (create chat UI coming soon)

## Troubleshooting

### "psql: password authentication failed"
- Make sure you're using the correct PostgreSQL password
- This is the password you set when installing PostgreSQL
- If you forgot it, you can reset it in pgAdmin

### "Database myguy already exists"
- That's fine! Skip to Step 2

### "Connection refused"
- Make sure PostgreSQL service is running:
```cmd
Get-Service postgresql*
```
- If stopped, start it:
```cmd
Start-Service postgresql-x64-18
```

### Port 3000 already in use
- Stop any other app using port 3000
- Or use a different port:
```cmd
npm run dev -- -p 3001
```

## View Your Database

To see your data in a nice GUI:

```cmd
npx prisma studio
```

This opens a browser-based database viewer at http://localhost:5555

## Need Help?

- Check SETUP_GUIDE.md for detailed instructions
- Check README.md for project documentation
- Review the database schema in prisma/schema.prisma
