# System Architecture - Firebase Realtime Backend

## Overview

The Remote Control System uses **Firebase Realtime Database** as its single backend. All rooms and the control panel communicate through Firebase, enabling:

- ✅ **Cross-network synchronization** - Works even if rooms are on different WiFi networks or over the internet
- ✅ **Real-time updates** - Commands execute instantly across all rooms
- ✅ **Bulletproof delivery** - No lost commands or sync issues
- ✅ **Status tracking** - Control panel sees real-time status of all connected rooms
- ✅ **Scalable** - Works with any number of rooms or control panels

## Architecture Diagram

```
Room 1 (PC/Browser)
    ├─→ Firebase Realtime DB
    │
Room 2 (PC/Browser)  ├─→ Cloud Storage
    ├─→ Firebase Realtime DB  ←─ Sync Codes & Commands
    │
Room 3 (PC/Browser)  └─ Real-time Updates
    ├─→ Firebase Realtime DB
    │
Control Panel (Browser) ←─→ Firebase Realtime DB
    │
    └─→ Status of All Rooms
```

## Firebase Database Structure

Commands flow through this Firebase Realtime Database structure:

```
christmas-program/
  ├── commands/
  │   ├── XMAS-2025/
  │   │   ├── {commandId}: {
  │   │   │   "command": "play",
  │   │   │   "targetRoom": "room-1",
  │   │   │   "timestamp": 1702000000000
  │   │   │ }
  │   └── CAROL-SYNC/
  │       └── ...
  │
  └── status/
      ├── XMAS-2025/
      │   ├── room-1: {
      │   │   "isActive": true,
      │   │   "isPlaying": true,
      │   │   "currentTime": 45.5,
      │   │   "lastUpdate": 1702000000000
      │   │ }
      │   ├── room-2: {...}
      │   └── room-3: {...}
      └── CAROL-SYNC/
          └── ...
```

## How Sync Codes Work

1. **User enters code** in control panel: `XMAS-2025`
2. **Rooms load with code** in URL: `room1.html?sync-code=XMAS-2025`
3. **All devices connect** to same Firebase path: `commands/XMAS-2025`
4. **Commands are broadcast** to that code's path
5. **Only rooms with matching code** receive the command
6. **Status updates** flow back to control panel in real-time

## Setup Steps

### 1. Create Firebase Project (5 minutes)
See [Firebase Setup Guide](FIREBASE_SETUP.md)

### 2. Configure Environment Variables
Create `.env.local` in project root:
```
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 3. Deploy & Test
- Run: `npm run dev`
- Load rooms with sync codes
- Open control panel
- Click Connect and start controlling

## Performance Characteristics

| Metric                 | Value                         |
| ---------------------- | ----------------------------- |
| Command Latency        | ~50-200ms (network dependent) |
| Status Update Interval | 1-5 seconds                   |
| Command Timeout        | 30 seconds                    |
| Max Rooms Per Code     | Unlimited                     |
| Max Active Codes       | Unlimited                     |

## Security Considerations

Firebase Realtime Database has security rules configured to:

1. **Allow read/write** only within sync code paths
2. **Prevent direct database access** without sync code
3. **Auto-expire commands** after 30 seconds
4. **Validate code format** before allowing writes

See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for detailed security rules.

## Cost Estimation

Firebase has a **free tier** that covers this use case:

- 1 GB stored data (more than enough for sync codes and commands)
- 100 connections per database
- Read/Write operations: 100 per day minimum free, scales up

**Estimated cost for Christmas program:** $0 (unless extremely high traffic)

## Troubleshooting

**Rooms not appearing in control panel:**
- Check Firebase config in `.env.local`
- Verify all rooms loaded with `?sync-code=` parameter
- Check browser console for errors
- Wait 5-10 seconds for initial sync

**Commands not executing:**
- Verify rooms are showing active in control panel
- Check Firebase connection in browser DevTools
- Ensure rooms have same sync code as control panel

**Connection errors:**
- Check internet connection
- Verify Firebase project is active
- Check environment variables
- See [FIREBASE_SETUP.md](FIREBASE_SETUP.md) troubleshooting section

## Why Firebase-Only?

Previous versions supported both localStorage (same-network) and Firebase (any-network). Firebase-only version provides:

- ✅ **Simpler codebase** - No dual-backend confusion
- ✅ **Better reliability** - Firebase handles all edge cases
- ✅ **Works everywhere** - Same code works locally, same-WiFi, or internet
- ✅ **Scalable** - No limitations based on network topology
- ✅ **Professional** - Industry-standard solution

## Setup Time Comparison

| Action                    | Time       |
| ------------------------- | ---------- |
| Firebase project creation | 5 min      |
| Security rules setup      | 2 min      |
| Environment variables     | 3 min      |
| Testing                   | 5 min      |
| **Total**                 | **15 min** |

## Next Steps

1. [Read: Firebase Setup Guide](FIREBASE_SETUP.md) - 15 minute setup
2. [Read: Quick Start Guide](QUICK_START.md) - 5 minute deployment
3. [Read: Operator Guide](OPERATOR_GUIDE.md) - Event day procedures
