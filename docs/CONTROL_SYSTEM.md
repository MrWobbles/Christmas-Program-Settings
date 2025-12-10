# Remote Control System Documentation

## Overview

The Remote Control System is a bulletproof, code-based synchronization system that allows you to control all Christmas Program rooms from a single control panel, regardless of their physical location or network setup.

## Key Features

- **Code-Based Sync**: Uses short alphanumeric codes (e.g., `CHRISTMAS-2025`) for identification
- **Bulletproof**: Implements verification checks, timestamps, and command deduplication
- **localStorage-Based**: Works across multiple browser tabs and windows using the browser's localStorage
- **No Server Required**: Operates entirely client-side for maximum reliability
- **Real-time Status**: Displays live status of all connected rooms
- **Per-Room & Global Control**: Control individual rooms or broadcast commands to all
- **Persistent Codes**: Saved codes for quick reconnection

## Architecture

### Components

1. **SyncManager** (`src/sync/SyncManager.ts`): Core synchronization engine
   - Manages commands and status updates
   - Verifies codes and timestamps
   - Prevents command replay attacks
   - Handles localStorage operations safely

2. **Control Panel** (`control.html` + `src/control.ts`): Web interface for operators
   - Connect with sync codes
   - View real-time room status
   - Send commands (play, pause, stop, reset, activate)
   - Manage multiple sync codes

3. **Room Integration** (`src/main.ts`): Integrated into each room page
   - Listens for sync commands
   - Reports status periodically (heartbeat)
   - Executes received commands

## Setup Instructions

### For Each Room Display

1. **Add Sync Code to URL**: Append the sync code as a query parameter to the room URL:
   ```
   room1.html?sync-code=CHRISTMAS-2025
   room2.html?sync-code=CHRISTMAS-2025
   room3.html?sync-code=CHRISTMAS-2025
   room4.html?sync-code=CHRISTMAS-2025
   ```

2. **Alternative (Advanced)**: Manually register codes in browser console:
   ```javascript
   const manager = new SyncManager('CHRISTMAS-2025', 'room-emmanuel');
   manager.registerCode('CHRISTMAS-2025');
   ```

### For Control Panel

1. Open `control.html` in a browser
2. Enter a sync code (e.g., `CHRISTMAS-2025`)
3. Click **Connect**
4. The panel will display all rooms currently using that code
5. Use the control buttons to manage playback

## Usage Workflow

### Initial Setup

```
1. Choose a sync code: CHRISTMAS-2025
2. Load all 4 rooms with ?sync-code=CHRISTMAS-2025
3. Open control.html
4. Enter the same code in the control panel
5. Click "Connect"
```

### Running the Program

```
1. Click "Play All" or select individual rooms
2. Monitor status in the control panel
3. Use "Pause All", "Stop All", or "Reset All" as needed
4. Individual room controls available for per-room adjustments
```

### Adding New Codes

On the control panel:
1. Enter a new sync code
2. Click "Add Code to List"
3. The code is saved for future use
4. Can quickly reconnect to saved codes

## Command Reference

### Available Commands

| Command    | Effect                                    | Target      |
| ---------- | ----------------------------------------- | ----------- |
| `play`     | Start audio playback                      | Room or All |
| `pause`    | Pause audio playback                      | Room or All |
| `stop`     | Stop and reset to beginning               | Room or All |
| `reset`    | Full reset (deactivate, reset time, stop) | Room or All |
| `activate` | Trigger room activation animation         | Room or All |

### Command Flow Example

```
User clicks "Play All"
  → Control Panel creates play command
  → localStorage updated with command
  → Each room's SyncManager detects new command
  → Command verified (code, timestamp, not duplicate)
  → Room executes: audio.play()
  → Room sends status update
  → Control Panel displays live status
```

## Security & Reliability Features

### Bulletproof Design

1. **Code Verification**
   - Codes must match exactly (case-insensitive)
   - Invalid format detected and rejected
   - 3+ character minimum

2. **Command Validation**
   - Timestamp checking (30-second timeout)
   - Duplicate prevention via command ID tracking
   - Code matching on every command

3. **Status Tracking**
   - Room heartbeats sent every 5 seconds
   - Status considered stale after 10 seconds
   - Automatic cleanup of old status data

4. **Error Handling**
   - localStorage failures handled gracefully
   - Parse errors caught and logged
   - Invalid JSON ignored safely

### Failure Scenarios

| Scenario                 | Handling                                             |
| ------------------------ | ---------------------------------------------------- |
| localStorage unavailable | Silent failure, continues operation                  |
| Network disconnect       | localStorage works across devices on same connection |
| Browser crash            | Status lost but control panel doesn't break          |
| Code typo                | Rooms won't respond to incorrect code                |
| Duplicate command        | Prevented by command ID tracking                     |
| Old command sent         | Timeout prevents execution >30 seconds old           |

## Technical Details

### localStorage Keys

- `christmas_sync_command`: Current command (shared by all)
- `christmas_sync_status_ROOMID`: Status for each room
- `christmas_sync_codes`: List of registered codes

### Status Object

```typescript
interface RoomState {
  roomId: string;              // e.g., "room-joy"
  isActive: boolean;           // Room browser tab is open
  isPlaying: boolean;          // Audio currently playing
  currentTime: number;         // Audio playback position in seconds
  isActivated: boolean;        // Room has been activated by user/control
  lastUpdate: number;          // Timestamp of last update (milliseconds)
}
```

### Command Object

```typescript
interface SyncCommand {
  id: string;                  // Unique command identifier
  code: string;               // Sync code (verified)
  command: 'play' | 'pause' | 'seek' | 'activate' | 'stop' | 'reset';
  timestamp: number;          // When command was created
  targetRoom?: string;        // Specific room or undefined for broadcast
  data?: Record<string, any>; // Optional command-specific data
}
```

## Troubleshooting

### Rooms not responding to commands

1. **Check sync code matches** - URL must have `?sync-code=YOUR-CODE`
2. **Verify browser tab is open** - Rooms must be loaded in browser
3. **Clear localStorage** - Helps recover from corrupted state:
   ```javascript
   localStorage.clear();
   // Reload the page
   ```
4. **Check browser console** - Look for error messages starting with `[Sync]`

### Control panel shows no rooms

1. **Make sure rooms are loaded** - Open each room in separate browser tab/window
2. **Use same sync code** - All rooms must use identical code
3. **Wait 5+ seconds** - Heartbeats only sent periodically
4. **Check localStorage** - Rooms write status to localStorage

### Status not updating

1. **Rooms may have crashed** - Check browser console for errors
2. **localStorage might be disabled** - Check browser privacy settings
3. **Private browsing mode** - Some browsers restrict localStorage in private mode

### Connection lost

- Simply close and reopen the control panel
- Previous codes are saved for quick reconnection
- No server involved, so no network issues to resolve

## Advanced Usage

### Command Line Connection

Connect a room via JavaScript console:

```javascript
// Load sync manager
const { SyncManager } = await import('/src/sync/SyncManager.ts');

// Connect room
const manager = new SyncManager('CHRISTMAS-2025', 'room-joy');
manager.initRoom();

// Listen for commands
manager.onCommand(cmd => console.log('Command:', cmd.command));
```

### Custom Control Panel

Create your own control interface:

```javascript
const { SyncManager } = await import('/src/sync/SyncManager.ts');
const manager = new SyncManager('CHRISTMAS-2025', 'control-panel');

// Get room statuses
const rooms = manager.getAllRoomStatuses();
console.log('Connected rooms:', rooms);

// Send command
manager.sendCommand('play', 'room-joy');
```

### Multiple Sync Codes

Register multiple codes for different groups:

```javascript
manager.registerCode('GROUP-A');
manager.registerCode('GROUP-B');

// Switch between codes
const newManager = new SyncManager('GROUP-A', 'control-panel');
```

## Performance Considerations

- **Command Check Interval**: 500ms (per room)
- **Heartbeat Interval**: 5 seconds (per room)
- **Status Retention**: 10 seconds of inactivity before removal
- **Command Timeout**: 30 seconds
- **localStorage Overhead**: <1KB per active room

## Future Enhancements

- WebSocket fallback for cross-network control
- Recording and playback of command sequences
- Advanced scheduling and automation
- Mobile control app support
- Audio sync verification

## Support

For issues or questions:
1. Check this documentation
2. Review browser console logs (prepended with `[Sync]`)
3. Check `src/sync/SyncManager.ts` for implementation details
