/**
 * Utility functions to manage pending actions after login/signup
 * Used for "remember action" functionality - resume user's action after authentication
 */

const PENDING_ACTION_KEY = 'pending_action';

/**
 * Store a pending action to be resumed after login
 * @param {Object} action - The action to store
 * @param {string} action.type - Type of action ('download', 'quran_read', 'quran_listen', etc.)
 * @param {Object} action.data - Additional data needed to resume the action
 */
export const setPendingAction = (action) => {
  try {
    if (typeof window === 'undefined') return;
    
    const actionData = {
      ...action,
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(PENDING_ACTION_KEY, JSON.stringify(actionData));
  } catch (error) {
  }
};

/**
 * Retrieve and remove the pending action from storage
 * @returns {Object|null} The pending action or null if none exists
 */
export const getPendingAction = () => {
  try {
    if (typeof window === 'undefined') return null;
    
    const actionStr = localStorage.getItem(PENDING_ACTION_KEY);
    if (!actionStr) return null;
    
    const action = JSON.parse(actionStr);
    
    // Check if action is not too old (max 30 minutes)
    const actionTime = new Date(action.timestamp);
    const now = new Date();
    const diffMinutes = (now - actionTime) / (1000 * 60);
    
    if (diffMinutes > 30) {
      clearPendingAction();
      return null;
    }
    
    return action;
  } catch (error) {
    return null;
  }
};

/**
 * Clear the pending action from storage
 */
export const clearPendingAction = () => {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(PENDING_ACTION_KEY);
  } catch (error) {
  }
};

/**
 * Check if there's a pending action
 * @returns {boolean}
 */
export const hasPendingAction = () => {
  try {
    if (typeof window === 'undefined') return false;
    
    return !!localStorage.getItem(PENDING_ACTION_KEY);
  } catch (error) {
    return false;
  }
};

/**
 * Action type constants
 */
export const ACTION_TYPES = {
  DOWNLOAD_BOOK: 'download_book',
  READ_BOOK: 'read_book',
  QURAN_READ: 'quran_read',
  QURAN_LISTEN: 'quran_listen',
  BOOKMARK: 'bookmark',
  REVIEW: 'review'
};

