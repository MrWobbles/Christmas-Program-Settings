# 🚀 First Time Setup Checklist

Use this checklist the first time you set up the remote control system.

## Pre-Setup (5 minutes)

- [ ] **Choose a sync code** - Write it down here: `__________________`
  - Examples: `CHRISTMAS2025`, `XMAS-SYNC`, `EVENT-001`
  - Must be 3+ characters, letters/numbers/hyphens only

- [ ] **Get all PC IP addresses**
  - Control PC: `192.168.___._____`
  - Room 1 PC: `192.168.___._____`
  - Room 2 PC: `192.168.___._____`
  - (etc - only needed if multiple PCs)

- [ ] **Test WiFi connection** - All PCs must be on same WiFi
  - [ ] Control PC connected to WiFi: `SSID: __________________`
  - [ ] Room PCs connected to same WiFi

## Step 1: Prepare Room URLs (5 minutes)

For each room, you'll add the sync code to the URL.

### Write out your room URLs here:

**Room 1:**
```
http://[ROOM1_IP]:5173/room1.html?sync-code=YOURCODE
```
My URL: `_________________________________________________________`

**Room 2:**
```
http://[ROOM2_IP]:5173/room2.html?sync-code=YOURCODE
```
My URL: `_________________________________________________________`

**Room 3:**
```
http://[ROOM3_IP]:5173/room3.html?sync-code=YOURCODE
```
My URL: `_________________________________________________________`

**Room 4:**
```
http://[ROOM4_IP]:5173/room4.html?sync-code=YOURCODE
```
My URL: `_________________________________________________________`

**Control Panel:**
```
http://[CONTROL_IP]:5173/control.html
```
My URL: `_________________________________________________________`

### Example (if all on same PC):
- Room 1: `http://localhost:5173/room1.html?sync-code=CHRISTMAS2025`
- Room 2: `http://localhost:5173/room2.html?sync-code=CHRISTMAS2025`
- Room 3: `http://localhost:5173/room3.html?sync-code=CHRISTMAS2025`
- Room 4: `http://localhost:5173/room4.html?sync-code=CHRISTMAS2025`
- Control: `http://localhost:5173/control.html`

## Step 2: Load Room Displays (5 minutes)

- [ ] **On Room 1 PC**: Open browser tab with Room 1 URL
  - [ ] Room displays with Christmas image
  - [ ] Can see "Room 1" text
  - [ ] Audio is NOT playing
  - [ ] No error messages in console (F12)

- [ ] **On Room 2 PC**: Open browser tab with Room 2 URL
  - [ ] Room displays with Christmas image
  - [ ] Can see "Room 2" text
  - [ ] Audio is NOT playing

- [ ] **On Room 3 PC**: Open browser tab with Room 3 URL
  - [ ] Room displays with Christmas image
  - [ ] Can see "Room 3" text
  - [ ] Audio is NOT playing

- [ ] **On Room 4 PC**: Open browser tab with Room 4 URL
  - [ ] Room displays with Christmas image
  - [ ] Can see "Room 4" text
  - [ ] Audio is NOT playing

## Step 3: Open Control Panel (2 minutes)

- [ ] **On Control PC**: Open browser tab
  - [ ] Navigate to: `http://localhost:5173/control.html` (or your URL)
  - [ ] Control panel loads with purple gradient header
  - [ ] See "Sync Code Setup" section
  - [ ] See "Add Sync Code" button

## Step 4: Connect Control Panel (3 minutes)

- [ ] **In "Sync Code Setup" section**:
  - [ ] Enter your sync code (from Step 1): `__________________`
  - [ ] Click **"Connect"** button
  - [ ] Wait 5-10 seconds...

- [ ] **Verify connection**:
  - [ ] Screen changes to show "Playback Control" section
  - [ ] See "Connected Rooms" heading
  - [ ] See all 4 rooms listed (may take 5-10 seconds)
  - [ ] Each room shows:
    - [ ] Green dot (🟢 Active)
    - [ ] "⏸️ No" (not playing)
    - [ ] "Time: 00:00"
    - [ ] "✗ No" (not activated)

**If rooms don't appear**:
- Wait 10 more seconds
- Check that all room URLs include `?sync-code=YOURCODE`
- Check all rooms are loaded in browsers
- Try refreshing control panel (F5)

## Step 5: Test Play/Pause (3 minutes)

- [ ] **Test Global Play**:
  - [ ] Click "Play All" button
  - [ ] Wait 1-2 seconds
  - [ ] All rooms should play audio
  - [ ] Status should show "▶️ Yes" for all rooms

- [ ] **Test Global Pause**:
  - [ ] Click "Pause All" button
  - [ ] All rooms should stop audio immediately
  - [ ] Status should show "⏸️ No" for all rooms

- [ ] **Test Global Stop**:
  - [ ] Click "Stop All" button
  - [ ] All rooms reset to beginning (time 00:00)
  - [ ] Audio should stop

## Step 6: Test Individual Room Control (3 minutes)

- [ ] **Scroll to "Per-Room Controls"**

- [ ] **Room 1 Controls**:
  - [ ] Click "Play" - only Room 1 plays
  - [ ] Click "Pause" - only Room 1 pauses
  - [ ] Click "Stop" - only Room 1 stops
  - [ ] Click "Reset" - only Room 1 resets

- [ ] **Verify other rooms don't play**:
  - [ ] While Room 1 plays, check Room 2, 3, 4 are silent
  - [ ] Other rooms show "⏸️ No" in status

## Step 7: Test Persistence (2 minutes)

- [ ] **Close control.html tab**

- [ ] **Reopen control.html**:
  - [ ] Code setup section appears again
  - [ ] BUT: Your code appears in "Registered Codes"
  - [ ] Click the code to reconnect instantly
  - [ ] Should connect within 2 seconds

- [ ] **Verify rooms still respond**:
  - [ ] Click "Play All"
  - [ ] Rooms should play (sync still working)

## Step 8: Reload Test (2 minutes)

- [ ] **Refresh Room 1 (F5)**:
  - [ ] Room 1 reloads
  - [ ] Page shows loading
  - [ ] Room displays again

- [ ] **Check control panel**:
  - [ ] Room 1 should disappear temporarily
  - [ ] Within 5 seconds, Room 1 reappears in status
  - [ ] Shows 🟢 Active again

- [ ] **Verify still controllable**:
  - [ ] Click "Play All"
  - [ ] Room 1 should play (auto-reconnected!)

## Final Verification

Once you complete all steps, you should be able to:

- ✅ Open all 4 rooms with sync codes
- ✅ Connect control panel with same code
- ✅ See all 4 rooms in status grid
- ✅ Click "Play All" - all rooms play
- ✅ Click "Pause All" - all rooms pause
- ✅ Click "Stop All" - all rooms stop
- ✅ Control individual rooms independently
- ✅ Reload rooms - they auto-reconnect
- ✅ Code persists for next use

## Troubleshooting During Setup

### Rooms not appearing in control panel

**Try this:**

1. [ ] Verify each room tab shows content (not blank)
2. [ ] Verify each room URL has `?sync-code=YOURCODE`
3. [ ] Check all rooms use SAME code
4. [ ] Wait 10 more seconds (heartbeat takes time)
5. [ ] Refresh control panel (F5)
6. [ ] Check browser console (F12) for errors

### Audio won't play when clicking Play All

**Try this:**

1. [ ] Check room tabs are open and showing content
2. [ ] Check browser isn't muted (check speaker icon)
3. [ ] Try clicking Play on just one room
4. [ ] Check browser console for JavaScript errors
5. [ ] Try hard reset: close all tabs, clear cache, reload

### Control panel won't connect

**Try this:**

1. [ ] Clear browser cache (Ctrl+Shift+Delete)
2. [ ] Check sync code spelling
3. [ ] Reload control.html
4. [ ] Try different code (to rule out code issue)
5. [ ] Close and reopen browser entirely

### One room not responding

**Try this:**

1. [ ] Refresh that room (F5)
2. [ ] Verify its URL has sync code
3. [ ] Check browser console for errors
4. [ ] Try restarting that browser

## Save These URLs

For future use, save your connection URLs:

```
SYNC CODE: _________________________

Room 1 URL: _________________________

Room 2 URL: _________________________

Room 3 URL: _________________________

Room 4 URL: _________________________

Control URL: _________________________
```

## You're Done! 🎉

If you successfully completed all 8 steps and all verifications pass:

✨ **You're ready for the event!** ✨

The system is tested and working. You can now:
- Run full dress rehearsal
- Control the actual event
- Feel confident with the system

## Cheat Sheet for Future Use

Once set up once, next time is much faster:

1. Open all 4 rooms with sync code URLs
2. Open control.html
3. Your code appears in "Registered Codes"
4. Click code to connect (instant!)
5. All rooms appear in status
6. Start controlling!

---

**Questions?** See [QUICK_START.md](QUICK_START.md) or [OPERATOR_GUIDE.md](OPERATOR_GUIDE.md)
