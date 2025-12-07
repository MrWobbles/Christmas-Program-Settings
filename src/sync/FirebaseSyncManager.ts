import { initializeApp, type FirebaseApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  get,
  off,
  type Database,
  type DatabaseReference,
} from 'firebase/database';

/**
 * Firebase Sync Manager - Cloud-based synchronization for multi-network setups
 * Provides real-time command and status sync via Firebase Realtime Database
 */

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  databaseURL: string;
}

export interface FirebaseRoomState {
  roomId: string;
  isActive: boolean;
  isPlaying: boolean;
  currentTime: number;
  isActivated: boolean;
  lastUpdate: number;
}

export interface FirebaseCommand {
  id: string;
  code: string;
  command: 'play' | 'pause' | 'seek' | 'activate' | 'stop' | 'reset';
  timestamp: number;
  targetRoom?: string;
  data?: Record<string, any>;
}

export class FirebaseSyncManager {
  private initialized: boolean = false;
  private code: string = '';
  private roomId: string = '';
  private lastProcessedCommandId: string = '';
  private commandListeners: ((command: FirebaseCommand) => void)[] = [];
  private statusListeners: ((status: FirebaseRoomState) => void)[] = [];
  private app: FirebaseApp | null = null;
  private db: Database | null = null;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private commandUnsubscribe: (() => void) | null = null;
  private readonly COMMAND_TIMEOUT = 30000; // 30 seconds
  private readonly HEARTBEAT_INTERVAL = 5000; // 5 seconds
  private ready: Promise<void>;

  constructor(config: FirebaseConfig, code: string, roomId: string) {
    this.code = code.toUpperCase().trim();
    this.roomId = roomId.toLowerCase();
    this.validateCode();
    this.ready = this.initializeFirebase(config);
  }

  /**
   * Initialize Firebase
   */
  private async initializeFirebase(config: FirebaseConfig): Promise<void> {
    try {
      // Ensure process.env exists for Firebase SDK in browser bundles
      if (typeof (globalThis as any).process === 'undefined') {
        (globalThis as any).process = { env: {} } as any;
      }

      this.app = initializeApp(config);
      this.db = getDatabase(this.app, config.databaseURL);
      this.initialized = true;
      console.log('[Firebase] Initialized successfully');
    } catch (err) {
      console.error('[Firebase] Initialization failed:', err);
      throw err;
    }
  }

  /**
   * Initialize for rooms
   */
  public async initRoom(): Promise<void> {
    await this.ready;
    if (!this.initialized || !this.db) {
      console.warn('[Firebase] Not initialized, cannot start room');
      return;
    }

    // Start listening for commands
    this.setupCommandListener();

    // Start sending heartbeats
    this.heartbeatInterval = setInterval(() => this.sendHeartbeat(), this.HEARTBEAT_INTERVAL);

    // Send initial heartbeat
    this.sendHeartbeat();

    console.log('[Firebase] Room mode initialized');
  }

  /**
   * Initialize for control panel
   */
  public async initControl(): Promise<void> {
    await this.ready;
    if (!this.initialized || !this.db) {
      console.warn('[Firebase] Not initialized, cannot start control');
      return;
    }

    console.log('[Firebase] Control mode initialized');
  }

  /**
   * Send a command
   */
  public async sendCommand(
    command: 'play' | 'pause' | 'seek' | 'activate' | 'stop' | 'reset',
    targetRoom?: string,
    data?: Record<string, any>
  ): Promise<void> {
    await this.ready;
    if (!this.initialized || !this.db) {
      console.error('[Firebase] Database not initialized');
      return;
    }

    const commandObj: FirebaseCommand = {
      id: this.generateId(),
      code: this.code,
      command,
      timestamp: Date.now(),
      // Only include these if defined to satisfy RTDB validation
      ...(targetRoom ? { targetRoom } : {}),
      ...(data ? { data } : {}),
    } as FirebaseCommand;

    try {
      await set(ref(this.db, `commands/${this.code}`), commandObj);
    } catch (err) {
      console.error('[Firebase] Failed to send command:', err);
    }
  }

  /**
   * Register a listener for commands
   */
  public onCommand(callback: (command: FirebaseCommand) => void): void {
    this.commandListeners.push(callback);
  }

  /**
   * Register a listener for status
   */
  public onStatus(callback: (status: FirebaseRoomState) => void): void {
    this.statusListeners.push(callback);
  }

  /**
   * Get all room statuses
   */
  public async getAllRoomStatuses(): Promise<Record<string, FirebaseRoomState>> {
    await this.ready;
    if (!this.initialized || !this.db) {
      return {};
    }

    try {
      const snapshot = await get(ref(this.db, `status/${this.code}`));
      const statuses: Record<string, FirebaseRoomState> = {};

      if (snapshot.exists()) {
        Object.entries(snapshot.val()).forEach(([roomId, status]: any) => {
          if (Date.now() - status.lastUpdate < 10000) {
            statuses[roomId] = status as FirebaseRoomState;
          }
        });
      }

      return statuses;
    } catch (err) {
      console.error('[Firebase] Failed to get room statuses:', err);
      return {};
    }
  }

  /**
   * Send status update
   */
  public async sendStatus(status: Partial<FirebaseRoomState>): Promise<void> {
    await this.ready;
    if (!this.initialized || !this.db) {
      console.error('[Firebase] Database not initialized');
      return;
    }

    const fullStatus: FirebaseRoomState = {
      roomId: this.roomId,
      isActive: true,
      isPlaying: false,
      currentTime: 0,
      isActivated: false,
      ...status,
      lastUpdate: Date.now(),
    };

    try {
      await set(ref(this.db, `status/${this.code}/${this.roomId}`), fullStatus);
    } catch (err) {
      console.error('[Firebase] Failed to send status:', err);
    }
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
    if (this.commandUnsubscribe && this.db) {
      const commandRef: DatabaseReference = ref(this.db, `commands/${this.code}`);
      off(commandRef);
    }
  }

  /**
   * Validate code format
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
   * Setup command listener
   */
  private setupCommandListener(): void {
    if (!this.initialized || !this.db) {
      console.error('[Firebase] Cannot setup listener, not initialized');
      return;
    }

    try {
      const commandRef: DatabaseReference = ref(this.db, `commands/${this.code}`);

      this.commandUnsubscribe = onValue(commandRef, (snapshot: any) => {
        if (snapshot.exists()) {
          const command = snapshot.val() as FirebaseCommand;

          if (
            command.id === this.lastProcessedCommandId ||
            command.code !== this.code ||
            Date.now() - command.timestamp > this.COMMAND_TIMEOUT
          ) {
            return;
          }

          if (command.targetRoom && command.targetRoom !== this.roomId) {
            return;
          }

          this.lastProcessedCommandId = command.id;
          this.commandListeners.forEach((listener) => listener(command));
        }
      });
    } catch (err) {
      console.error('[Firebase] Failed to setup command listener:', err);
    }
  }

  /**
   * Send heartbeat
   */
  private sendHeartbeat(): void {
    this.sendStatus({
      isActive: true,
    });
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `${this.code}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
