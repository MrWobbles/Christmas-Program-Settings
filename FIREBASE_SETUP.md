# Firebase Integration Setup Guide

## Overview

The system now supports both **localStorage** (same network) and **Firebase** (any network) backends for room synchronization.

## When to Use Each

### localStorage (Default)
- ✅ All PCs on same WiFi network
- ✅ Simple setup, no external accounts needed
- ✅ Instant communication
- ❌ Doesn't work across internet

### Firebase
- ✅ Works across different networks
- ✅ Works across the internet
- ✅ Cloud-based reliability
- ❌ Requires Firebase account setup
- ❌ Small latency (cloud round-trip)

## Firebase Setup (15 minutes)

### Step 1: Create Firebase Project

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Enter project name: `Christmas-Program` (or any name)
4. Accept terms and click **"Create project"**
5. Wait for project to be created

### Step 2: Set Up Realtime Database

1. In Firebase console, click **"Realtime Database"** (left sidebar)
2. Click **"Create Database"**
3. Select **"Start in test mode"** (for now)
4. Choose region closest to you
5. Click **"Enable"**

### Step 3: Configure Security Rules

1. Click **"Rules"** tab in Realtime Database
2. Replace the entire rules with:

```json
{
  "rules": {
    "commands": {
      ".read": true,
      ".write": true,
      "$code": {
        ".validate": "newData.val().code !== null && newData.val().command !== null"
      }
    },
    "status": {
      ".read": true,
      ".write": true,
      "$code": {
        "$room": {
          ".validate": "newData.val().roomId !== null && newData.val().lastUpdate !== null"
        }
      }
    }
  }
}
```

3. Click **"Publish"**

### Step 4: Get Your Config

1. In Firebase console, click the gear icon (⚙️) → **"Project settings"**
2. Scroll down to **"Your apps"**
3. Click the **"</>Web"** button
4. You'll see your config. Copy this section:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### Step 5: Configure Environment Variables

1. In your project root, create or edit `.env.local`:

```bash
VITE_FIREBASE_API_KEY=YOUR_API_KEY
VITE_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT
VITE_FIREBASE_STORAGE_BUCKET=YOUR_PROJECT.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
VITE_FIREBASE_APP_ID=YOUR_APP_ID
```

2. Replace `YOUR_*` values with your actual Firebase credentials
3. Save the file

### Step 6: Verify Setup

1. Reload your dev server: `npm run dev`
2. Check browser console for Firebase messages
3. If configured correctly, you'll see: `[Firebase] Initialized successfully`

## Using Firebase in Your Rooms

### Option A: Use Firebase for All Rooms

Modify each room URL to use Firebase backend:

```html
<!-- In room1.html, room2.html, etc -->
<script type="module">
  import { initRoom } from '/src/main.ts';
  initRoom('firebase'); // Use Firebase backend
</script>
```

Or add parameter to URL:
```
room1.html?sync-backend=firebase&sync-code=CHRISTMAS2025
```

### Option B: Auto-Detect Best Backend

The system will automatically use Firebase if configured, fall back to localStorage:

```typescript
// In src/main.ts
const syncManager = new SyncManager(code, roomId);
// Automatically detects Firebase config and uses it
```

### Option C: Use Both (Fallback Strategy)

The default behavior tries Firebase first, falls back to localStorage:

```typescript
const syncManager = new SyncManager(code, roomId);
// If Firebase config missing or fails → uses localStorage
// If Firebase works → uses Firebase
```

## Control Panel Setup with Firebase

The control panel automatically detects and uses Firebase if available:

1. Open `control.html`
2. Enter your sync code
3. Click **"Connect"**
4. System automatically uses Firebase backend
5. Works across any network!

## Verification Checklist

- [ ] Firebase project created
- [ ] Realtime Database enabled
- [ ] Security rules configured and published
- [ ] Environment variables set in `.env.local`
- [ ] Dev server restarted: `npm run dev`
- [ ] Console shows: `[Firebase] Initialized successfully`
- [ ] Rooms load without errors
- [ ] Control panel connects successfully
- [ ] Commands sync across rooms

## Troubleshooting Firebase

### Firebase not initializing

**Check:**
1. Is `.env.local` file in project root?
2. Are all 6 environment variables set?
3. Did you restart dev server after adding .env?
4. Check browser console for errors

**Fix:**
```bash
# Verify env variables are loaded
npm run dev

# Check console for: [Firebase] Initialized successfully
```

### Security rules error

If you see: `permission denied`

1. Go to Firebase console
2. Click Realtime Database → Rules
3. Verify the JSON is valid (no syntax errors)
4. Rules must be published (not just in editor)
5. Copy/paste the rules again if unsure

### Rooms not connecting

If Firebase doesn't appear in console:

1. Check `.env.local` file exists
2. Verify all 6 variables are set
3. Check variable names match exactly (case-sensitive)
4. No trailing spaces in values
5. Restart dev server completely

### Falling back to localStorage

If you see: `Switched to localStorage backend`

1. Firebase config is incomplete/invalid
2. Check console for specific error
3. Verify environment variables
4. Consider using localStorage if Firebase not needed

## Switching Backends at Runtime

You can switch between backends programmatically:

```typescript
const syncManager = new SyncManager('XMAS', 'room-joy', 'firebase');

// Later, switch to localStorage if needed
syncManager.setSyncBackend('localStorage');

// Check current backend
const current = syncManager.getBackend(); // 'localStorage' or 'firebase'
```

## Performance Comparison

| Metric      | localStorage      | Firebase                          |
| ----------- | ----------------- | --------------------------------- |
| Latency     | <10ms             | 50-200ms                          |
| Setup       | Instant           | 15 min                            |
| Range       | Same WiFi         | Any network                       |
| Reliability | Network dependent | Cloud redundancy                  |
| Cost        | Free              | Free tier (up to 100 connections) |

## Cost Notes

Firebase Realtime Database offers:
- **Spark Plan (Free)**: Perfect for events
  - 100 simultaneous connections
  - 1 GB storage
  - No credit card needed
- **Blaze Plan (Pay-as-you-go)**: For large deployments

Your event will use minimal resources and stay free.

## Security Notes

The rules are intentionally permissive for your event setup. For production:

1. Add authentication
2. Restrict write access to authorized users
3. Add rate limiting
4. Use more restrictive validation rules

For an internal church event, the current setup is fine.

## Fallback Strategy

The system automatically handles failures:

```
User connects
    ↓
System checks Firebase config
    ├─ If configured and working → Use Firebase
    ├─ If configured but failing → Fall back to localStorage
    └─ If not configured → Use localStorage

Room initialization
    ├─ Try Firebase
    ├─ If fails → Fall back to localStorage
    └─ User never notices!
```

## API Reference

### Initialize with Firebase

```typescript
// Option 1: Explicit
import { SyncManager } from './sync/SyncManager';
const manager = new SyncManager('XMAS', 'room-joy', 'firebase');

// Option 2: Auto-detect
import { SyncManager } from './sync/SyncManager';
const manager = new SyncManager('XMAS', 'room-joy'); // Auto-selects best backend

// Option 3: Switch later
const manager = new SyncManager('XMAS', 'room-joy', 'localStorage');
manager.setSyncBackend('firebase');
```

### Environment Variables Template

Copy to `.env.local`:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

## Next Steps

1. **If using same WiFi only**: No action needed, localStorage works
2. **If need internet sync**: Complete Firebase setup steps above
3. **Test thoroughly**: Run through all controls on different networks
4. **Backup**: Write down your Firebase project ID
5. **Document**: Keep Firebase config credentials safe

## Support

- Firebase Documentation: https://firebase.google.com/docs
- Realtime Database Guide: https://firebase.google.com/docs/database
- Project Settings: https://console.firebase.google.com

For issues specific to this integration, check browser console for `[Firebase]` or `[SyncManager]` messages.
