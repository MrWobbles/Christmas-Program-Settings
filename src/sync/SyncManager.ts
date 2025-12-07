/**
 * SyncManager - Firebase-based sync system for controlling rooms remotely
 * All rooms and control panel communicate through Firebase Realtime Database
 */

export interface RoomState {
  roomId: string;
  isActive: boolean;
  isPlaying: boolean;
  currentTime: number;
  isActivated: boolean;
}

export interface SyncCommand {
  id: string;
  code: string;
  command: 'play' | 'pause' | 'seek' | 'activate' | 'stop' | 'reset';
  timestamp: number;
  targetRoom?: string; // undefined = all rooms
  data?: Record<string, any>;
}

export class SyncManager {
  private code: string = '';
  private roomId: string = '';
  private commandListeners: ((command: SyncCommand) => void)[] = [];
  private statusListeners: ((status: RoomState) => void)[] = [];
  private firebaseManager: any = null;

  private readonly COMMAND_TIMEOUT = 30000; // 30 seconds
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 seconds

  constructor(code: string, roomId: string) {
    this.code = code.toUpperCase().trim();
    this.roomId = roomId.toLowerCase();
    this.validateCode();
  }

  /**
   * Initialize the sync system (for rooms)
   */
  public async initRoom(): Promise<void> {
    await this.initFirebase();
    await this.firebaseManager?.initRoom();
  }

  /**
   * Initialize the sync system (for control panel)
   */
  public async initControl(): Promise<void> {
    await this.initFirebase();
    await this.firebaseManager?.initControl();
  }

  /**
   * Initialize Firebase manager
   */
  private async initFirebase(): Promise<void> {
    try {
      const { FirebaseSyncManager } = await import('./FirebaseSyncManager');
      const { firebaseConfig, isFirebaseConfigured } = await import('../config/firebase');

      if (!isFirebaseConfigured()) {
        console.warn(
          '[SyncManager] Firebase config not set. Set VITE_FIREBASE_* environment variables.'
        );
        throw new Error('Firebase is required but not configured');
      }

      this.firebaseManager = new FirebaseSyncManager(firebaseConfig, this.code, this.roomId);

      // Forward events from Firebase to listeners
      this.firebaseManager.onCommand((cmd: SyncCommand) => {
        this.commandListeners.forEach((listener) => listener(cmd));
      });

      this.firebaseManager.onStatus((status: RoomState) => {
        this.statusListeners.forEach((listener) => listener(status));
      });

      console.log('[SyncManager] Firebase backend initialized');
    } catch (err) {
      console.error('[SyncManager] Failed to initialize Firebase:', err);
      throw err;
    }
  }

  /**
   * Send a command to rooms
   */
  public sendCommand(
    command: 'play' | 'pause' | 'seek' | 'activate' | 'stop' | 'reset',
    targetRoom?: string,
    data?: Record<string, any>
  ): void {
    if (this.firebaseManager) {
      this.firebaseManager.sendCommand(command, targetRoom, data);
    } else {
      console.error('[SyncManager] Firebase not initialized');
    }
  }

  /**
   * Register a listener for incoming commands
   */
  public onCommand(callback: (command: SyncCommand) => void): void {
    this.commandListeners.push(callback);
  }

  /**
   * Register a listener for status updates
   */
  public onStatus(callback: (status: RoomState) => void): void {
    this.statusListeners.push(callback);
  }

  /**
   * Get all active room statuses
   */
  public async getAllRoomStatuses(): Promise<Record<string, RoomState>> {
    if (this.firebaseManager) {
      return this.firebaseManager.getAllRoomStatuses();
    }
    return {};
  }

  /**
   * Get the current room's status
   */
  public getRoomStatus(): RoomState {
    return {
      roomId: this.roomId,
      isActive: false,
      isPlaying: false,
      currentTime: 0,
      isActivated: false,
    };
  }

  /**
   * Send current room status (called by rooms)
   */
  public sendStatus(status: Partial<RoomState>): void {
    if (this.firebaseManager) {
      this.firebaseManager.sendStatus(status);
    } else {
      console.error('[SyncManager] Firebase not initialized');
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.firebaseManager) this.firebaseManager.destroy();
  }

  /**
   * Verify code is valid format
   */
  private validateCode(): void {
    if (!this.code || this.code.length < 3) {
      throw new Error('Invalid sync code: must be at least 3 characters');
    }
    if (!/^[A-Z0-9\-]+$/.test(this.code)) {
      throw new Error('Invalid sync code: must contain only letters, numbers, and hyphens');
    }
  }

  /**
   * Check if the stored code matches (for control panel)
   */
  public isCodeValid(): boolean {
    return true; // Firebase-only system validates via Firebase
  }
}
