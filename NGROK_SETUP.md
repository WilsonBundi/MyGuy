# ngrok Setup for MyGuy Mobile App

## Quick Setup (5 minutes)

### 1. Create Account
- Visit: https://ngrok.com/signup
- Sign up for free account

### 2. Get Authtoken
- Visit: https://dashboard.ngrok.com/get-started/your-authtoken
- Copy your authtoken

### 3. Install ngrok
- Download: https://ngrok.com/download
- Extract to a folder (e.g., C:\ngrok)

### 4. Authenticate
Open Command Prompt and run:
```cmd
cd C:\ngrok
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 5. Start Tunnel
```cmd
ngrok http 3000
```

### 6. Copy HTTPS URL
You'll see something like:
```
Forwarding  https://abc123-def456.ngrok-free.app -> http://localhost:3000
```

Copy the HTTPS URL: `https://abc123-def456.ngrok-free.app`

### 7. Tell Me the URL
Share the ngrok HTTPS URL and I'll update the mobile app to use it!

## Why ngrok?
- Provides HTTPS tunnel (required by Expo Go)
- Secure connection
- No firewall issues
- Works with your phone
