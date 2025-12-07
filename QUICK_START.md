# Remote Control System - Quick Start Guide

## Prerequisites: Firebase Setup (15 minutes)

First, follow the [Firebase Setup Guide](FIREBASE_SETUP.md) to configure your Firebase project. This is required for the remote control system to work.

Once Firebase is configured, come back to this guide.

## 5-Minute Setup

### Step 1: Choose Your Sync Code
Pick a simple code like: `CHRISTMAS2025` or `XMAS-SYNC`

### Step 2: Load All Rooms with the Sync Code

Open each room in a separate browser tab/window with the sync code in the URL:

```
http://localhost:5173/room1.html?sync-code=CHRISTMAS2025
http://localhost:5173/room2.html?sync-code=CHRISTMAS2025
http://localhost:5173/room3.html?sync-code=CHRISTMAS2025
http://localhost:5173/room4.html?sync-code=CHRISTMAS2025
```

Or if running on actual network:
```
http://192.168.1.100:5173/room1.html?sync-code=CHRISTMAS2025
http://192.168.1.100:5173/room2.html?sync-code=CHRISTMAS2025
(etc...)
```

### Step 3: Open Control Panel

Open the control panel in a new tab:
```
http://localhost:5173/control.html
```

### Step 4: Connect Control Panel

1. Enter your sync code: `CHRISTMAS2025`
2. Click **Connect**
3. Wait ~5 seconds for rooms to appear in the status panel

### Step 5: Start Controlling!

- **Play All**: Starts all connected rooms
- **Pause All**: Pauses all rooms
- **Stop All**: Stops and resets all rooms
- **Reset All**: Fully resets all rooms

For individual room control, scroll down to **Per-Room Controls**

## How It Works

All rooms communicate through **Firebase Realtime Database**. This allows:
- ✅ Rooms on different WiFi networks to sync perfectly
- ✅ Control from anywhere (same building, different building, internet)
- ✅ Real-time status updates from all rooms
- ✅ Bulletproof command delivery

## Common Scenarios

### Scenario 1: Multiple Rooms in Same Building
- Load all rooms with same sync code
- Run control panel on any PC in building
- localStorage will sync across same network

### Scenario 2: Rooms Across Different Buildings (WiFi)
- Load all rooms with same sync code
- Run control panel on any PC
- **Note**: Must be on same WiFi network for localStorage to sync
- **Alternative**: Use a shared dropbox folder or cloud sync if different networks

### Scenario 3: Quick Test
1. Open room1.html and control.html in same browser
2. Add `?sync-code=TEST` to room1 URL
3. Enter `TEST` in control panel
4. Click Connect
5. Try Play/Pause buttons

## Controlling Without Control Panel (Manual)

You can send commands directly from browser console:

```javascript
// In any room's browser console:
localStorage.setItem('christmas_sync_command', JSON.stringify({
  id: Date.now() + '-' + Math.random(),
  code: 'CHRISTMAS2025',
  command: 'play',
  timestamp: Date.now(),
  targetRoom: null
}));
```

## Reset Everything

If something goes wrong:

```javascript
// In browser console (any tab):
localStorage.clear();
location.reload();
```

## URL Format Reference

```
Base URL: http://[MACHINE_IP]:[PORT]/room#.html

Example with sync code:
http://192.168.1.50:5173/room1.html?sync-code=MYCODE

Example with multiple params:
http://192.168.1.50:5173/room1.html?sync-code=MYCODE&param2=value
```

## Verification Checklist

Before running the actual program:

- [ ] All 4 rooms loaded in browser tabs
- [ ] All rooms have same sync code in URL
- [ ] Control panel opened and connected
- [ ] Control panel shows all 4 rooms in status grid
- [ ] Test: Click "Play All" - audio should play in all rooms
- [ ] Test: Click "Pause All" - audio should pause in all rooms
- [ ] Test: Click individual room buttons - should only affect that room

## Troubleshooting Quick Fixes

| Problem                     | Fix                                              |
| --------------------------- | ------------------------------------------------ |
| Rooms not appearing         | Wait 5-10 seconds, refresh control panel         |
| Commands not working        | Check all rooms have same sync code              |
| Control panel won't connect | Check sync code spelling (case-insensitive)      |
| Audio out of sync           | Use "Stop All" then "Play All" to resync         |
| Browser crashed             | Reload tabs, localStorage automatically restores |

## Code Naming Suggestions

Choose memorable codes that identify your setup:

- Single event: `XMAS2025`, `NATIVITY`
- Location-based: `SANCTUARY`, `HALL-1`
- Date-based: `DEC-6-2025`
- Simple: `TEST`, `DEMO`, `MASTER`

## Network Setup Examples

### All on Same WiFi (Recommended)
```
Control PC (192.168.1.10)  --- WiFi ---  Room PC 1 (192.168.1.11)
                             \          / Room PC 2 (192.168.1.12)
                              \        /  Room PC 3 (192.168.1.13)
                               \      /   Room PC 4 (192.168.1.14)
```
All PCs access shared localStorage via WiFi sync.

### All on Same PC
```
Browser Tabs:
- room1.html?sync-code=XMAS
- room2.html?sync-code=XMAS
- room3.html?sync-code=XMAS
- room4.html?sync-code=XMAS
- control.html
```
All tabs share same localStorage on one machine.

### Mixed Setup
```
Control Panel (Admin PC)
    |
    +--> WiFi Network
         |
         +--> Room PC 1 (room1 & room2)
         +--> Room PC 2 (room3 & room4)
```
All PCs must be on same WiFi for localStorage sync to work.

## For Advanced Users

### Debug Mode
Check browser console for debug output:
```javascript
// In room browser console:
localStorage.getItem('christmas_sync_command')
localStorage.getItem('christmas_sync_status_room-joy')
```

### Monitor Command Flow
```javascript
// In room console, type this to log all commands:
setInterval(() => {
  const cmd = localStorage.getItem('christmas_sync_command');
  if (cmd) console.log('Command:', JSON.parse(cmd));
}, 500);
```

### Test Command Sender
```javascript
// Create a test command:
const testCmd = {
  id: 'test-' + Date.now(),
  code: 'CHRISTMAS2025',
  command: 'play',
  timestamp: Date.now()
};
localStorage.setItem('christmas_sync_command', JSON.stringify(testCmd));
```

## Support Resources

- Full documentation: See `CONTROL_SYSTEM.md`
- Implementation details: Check `src/sync/SyncManager.ts`
- Room integration: See `src/main.ts` lines 30-70
- Control panel code: See `src/control.ts`
