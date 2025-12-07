# Remote Control System - Operator's Guide

## For Event Day

### Pre-Event Setup (30 minutes before)

1. **Verify All Rooms Are Ready**
   - [ ] Open room1.html, room2.html, room3.html, room4.html in separate browser tabs
   - [ ] Each tab shows the room name and image
   - [ ] Audio is not playing (should be silent)

2. **Add Sync Code to Each Room**

   Edit each room URL and add `?sync-code=EVENTCODE`

   Example: Change
   ```
   http://192.168.1.50:5173/room1.html
   ```
   To:
   ```
   http://192.168.1.50:5173/room1.html?sync-code=CHRISTMAS2025
   ```

   Do this for all 4 rooms. You can add a note to remember your code:
   ```
   CODE: CHRISTMAS2025
   ```

3. **Open Control Panel**
   - Open a new browser tab: `http://192.168.1.50:5173/control.html`
   - This is your main control interface

4. **Connect Control Panel**
   - In the "Sync Code Setup" section, enter: `CHRISTMAS2025`
   - Click **Connect**
   - Wait 5-10 seconds

5. **Verify Connection**
   - You should see "Connected Rooms" section with all 4 rooms listed
   - Each room should show: 🟢 Active, ⏸️ Not Playing, 00:00
   - If rooms don't appear: Check URLs include `?sync-code=CHRISTMAS2025`

### During Event

#### Basic Operation

```
To start room 1:
1. Scroll to "Per-Room Controls"
2. Find "Room 1: Emmanuel"
3. Click the "Play" button

OR use "Play All" to start all rooms at once
```

#### Common Actions

**Start all rooms together**:
1. Look for "Global Commands" section
2. Click **Play All**
3. Wait 1-2 seconds for audio to start
4. Monitor status showing all rooms playing

**Pause during technical difficulty**:
1. Click **Pause All**
2. Audio stops everywhere
3. Click **Play All** when ready to resume

**Reset everything**:
1. Click **Stop All** (stops and resets to beginning)
2. All rooms go back to start
3. Click **Play All** to begin again

**Emergency stop**:
1. Click **Pause All** immediately
2. This stops all audio instantly

#### Monitoring Status

The status grid shows each room:
```
Room 1: Emmanuel
🟢 Active         (Room is open in browser)
▶️ Playing        (Audio is currently playing)
Time: 03:45       (Current playback position)
✓ Activated       (Room has been activated)
```

#### Individual Room Control

If one room has issues:

1. Find room in "Per-Room Controls"
2. Options:
   - **Play** - Start that room only
   - **Pause** - Pause that room only
   - **Stop** - Stop and reset that room
   - **Activate** - Trigger room animation
   - **Reset** - Full reset (same as stop)

### If Things Go Wrong

#### Room not playing when you click Play All

**Troubleshooting steps** (in order):

1. **Check the room is loaded**
   - Go to that room's browser tab
   - Should see room image and content
   - If blank: Reload the page

2. **Check sync code in URL**
   - Look at address bar
   - Should include: `?sync-code=CHRISTMAS2025`
   - If missing: Add it manually

3. **Restart the room**
   - Close the room tab
   - Reopen it with the sync code in URL
   - Wait 5 seconds for status to appear

4. **Reconnect control panel**
   - Click **Disconnect** in control panel
   - Close control.html tab
   - Reopen control.html
   - Enter code and click Connect again

5. **Last resort - hard reset**
   - Close ALL browser tabs (rooms and control)
   - Clear browser cache (Ctrl+Shift+Delete)
   - Reload all rooms with sync code
   - Reopen control panel

#### Audio is out of sync

**Quick fix**:
1. Click **Stop All**
2. Wait 2 seconds
3. Click **Play All**
4. All rooms restart together

**If still out of sync**:
1. Identify which room is wrong
2. Click **Stop** for that room only
3. Wait 1 second
4. Click **Play** for that room only

#### Control panel shows no rooms

**Solution**:
1. Check all room tabs are still open and showing content
2. Wait 5 seconds (rooms send status updates every 5 seconds)
3. Refresh the control panel (press F5)
4. Make sure all rooms have the correct sync code in URL

#### A room keeps crashing

**Steps**:
1. Close that room's tab completely
2. Reopen it with the sync code in URL
3. The room should reload fresh
4. It should appear in the control panel within 5 seconds
5. Test with **Play** button to verify it works

### Code Management

#### Saving Your Sync Code

The control panel automatically remembers codes:

1. First time you connect with a code, it's saved
2. Next time you open control.html, you'll see it in "Registered Codes"
3. Just click the code to quickly reconnect

#### Using a Saved Code

```
Registered Codes
├─ CHRISTMAS2025 [Connect] [Remove]
└─ XMAS-BACKUP   [Connect] [Remove]
```

Click **Connect** next to the code you want.

### Quick Reference Card

Keep this visible during the event:

```
SYNC CODE: CHRISTMAS2025

EMERGENCY STOP:
  Click "Pause All"

START ALL ROOMS:
  Click "Play All"

RESET EVERYTHING:
  Click "Stop All" then "Play All"

MONITOR STATUS:
  Check "Connected Rooms" section
  Should show all 4 rooms with 🟢 Active

INDIVIDUAL ROOM:
  Find room in "Per-Room Controls"
  Choose: Play / Pause / Stop / Activate / Reset

TROUBLESHOOTING:
  1. Check room tabs are open
  2. Wait 5 seconds for status update
  3. Refresh control panel (F5)
  4. Hard reset if needed (close all tabs, reopen)
```

### Network Checklist

Before going live, verify:

```
Control Panel PC                Room 1 PC
   ↓                             ↓
[Connected to WiFi]  ←→  [Connected to same WiFi]
192.168.1.10              192.168.1.11

Room 2 PC                     Room 3 PC
   ↓                          ↓
[Same WiFi]              [Same WiFi]
192.168.1.12             192.168.1.13

Room 4 PC
   ↓
[Same WiFi]
192.168.1.14
```

All must be on the SAME WiFi network.

### Example Event Workflow

```
3:30 PM - EVENT STARTS

Event Director:
- Opens control.html
- Enters CHRISTMAS2025
- Clicks Connect
- Sees all 4 rooms show "🟢 Active"

Event Coordinator:
- Reads script: "Room 1 begins..."
- Control Director clicks "Play All"
- OR clicks "Play" on Room 1 only

Rooms play synchronized

If issue:
- Click "Pause All" immediately
- Fix the issue
- Click "Play All" to resume

3:45 PM - Room 1 ends, Room 2 begins:
- Click "Pause All"
- Click "Play" on Room 2 only

4:00 PM - EVENT ENDS
- Click "Pause All"
- Click "Stop All"
```

### Tips for Smooth Operation

1. **Mute control panel tab** - Disable audio in the control panel tab so it doesn't interfere
2. **Full screen rooms** - Make room tabs full screen for best visibility
3. **Practice first** - Do a full dry run before the actual event
4. **Phone nearby** - Have a phone to call if issues on other side of building
5. **Secondary operator** - Have someone at the control panel who can quickly react
6. **Backup URL written** - Write down all 4 room URLs in case you need to reload
7. **Save your code** - Write down your sync code in multiple places

### Common Issues Cheat Sheet

| Issue                | Cause                  | Fix                                        |
| -------------------- | ---------------------- | ------------------------------------------ |
| No rooms appear      | URLs missing sync code | Add `?sync-code=XXX` to each room URL      |
| Audio won't start    | Sync code mismatch     | Check code in control panel matches URLs   |
| Audio out of sync    | Network delay          | Click "Stop All" then "Play All"           |
| One room crashes     | Browser error          | Reload that room tab                       |
| Control panel broken | localStorage issue     | Hard reset: close all, clear cache, reload |

### After Event

1. Note any issues that happened
2. Review console logs if bugs occurred
3. Keep the sync code for next use (it's saved)
4. Consider recording status screenshots for review

### Support Contact Info

If issues during event:
1. Check the Quick Reference Card above
2. Try the Common Issues solutions
3. Review QUICK_START.md for setup help
4. Check CONTROL_SYSTEM.md for technical details
