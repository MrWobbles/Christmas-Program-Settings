/**
 * Shared utility functions
 */

/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Copy text to clipboard with user feedback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy to clipboard:', err);
    return false;
  }
}

/**
 * Format seconds into MM:SS format
 */
export function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get an element by ID with type safety
 */
export function getElement<T extends HTMLElement>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Required DOM element not found: ${id}`);
  }
  return element as T;
}

/**
 * Query selector with type safety
 */
export function querySelector<T extends Element>(selector: string, parent: Document | Element = document): T | null {
  return parent.querySelector(selector) as T | null;
}

/**
 * Query selector that throws if not found
 */
export function querySelectorRequired<T extends Element>(selector: string, parent: Document | Element = document): T {
  const element = parent.querySelector(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element as T;
}

/**
 * Sleep for a given duration
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validate sync code format
 */
export function isValidSyncCode(code: string): boolean {
  if (!code || code.length < 3 || code.length > 20) {
    return false;
  }
  return /^[A-Z0-9\-]+$/.test(code);
}

/**
 * Safely parse localStorage JSON with validation
 */
export function parseLocalStorage<T>(key: string, defaultValue: T, validator?: (data: unknown) => data is T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    
    const data = JSON.parse(item);
    
    // If validator provided, use it to type-check
    if (validator && !validator(data)) {
      console.warn(`Invalid localStorage data for ${key}, using default`);
      return defaultValue;
    }
    
    return data as T;
  } catch (err) {
    console.error(`Failed to parse localStorage ${key}:`, err);
    return defaultValue;
  }
}
