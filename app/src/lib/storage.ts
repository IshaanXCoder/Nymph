import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

/**
 * Platform-specific storage utility
 * Uses SecureStore on mobile and localStorage on web
 */
export class Storage {
  /**
   * Set an item in storage
   */
  static async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage on web
        localStorage.setItem(key, value);
      } else {
        // Use SecureStore on mobile
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error(`Failed to set item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Get an item from storage
   */
  static async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage on web
        return localStorage.getItem(key);
      } else {
        // Use SecureStore on mobile
        return await SecureStore.getItemAsync(key);
      }
    } catch (error) {
      console.error(`Failed to get item ${key}:`, error);
      return null;
    }
  }

  /**
   * Delete an item from storage
   */
  static async deleteItem(key: string): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Use localStorage on web
        localStorage.removeItem(key);
      } else {
        // Use SecureStore on mobile
        await SecureStore.deleteItemAsync(key);
      }
    } catch (error) {
      console.error(`Failed to delete item ${key}:`, error);
      throw error;
    }
  }

  /**
   * Check if an item exists in storage
   */
  static async hasItem(key: string): Promise<boolean> {
    try {
      const value = await this.getItem(key);
      return value !== null;
    } catch (error) {
      console.error(`Failed to check item ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all items from storage
   */
  static async clear(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Clear localStorage on web
        localStorage.clear();
      } else {
        // SecureStore doesn't have a clear method, so we need to delete known keys
        // This is a limitation - we'd need to track all keys
        console.warn('SecureStore clear not implemented - would need to track all keys');
      }
    } catch (error) {
      console.error('Failed to clear storage:', error);
      throw error;
    }
  }
}
