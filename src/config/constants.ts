/**
 * Application-wide constants
 * 
 * Centralized configuration for magic numbers and common values
 */

/**
 * Database configuration
 */
export const DATABASE_CONFIG = {
  /** Batch size for bulk inserts to prevent timeouts */
  BATCH_SIZE: 50,
  
  /** Timeout for database operations (ms) */
  OPERATION_TIMEOUT_MS: 10000,
  
  /** Maximum retries for failed database operations */
  MAX_RETRIES: 3,
} as const;

/**
 * API configuration
 */
export const API_CONFIG = {
  /** Timeout for API requests (ms) */
  REQUEST_TIMEOUT_MS: 30000,
  
  /** Maximum number of retry attempts */
  MAX_RETRIES: 3,
  
  /** Base delay between retries (ms) - uses exponential backoff */
  BASE_RETRY_DELAY_MS: 1000,
  
  /** Maximum delay cap for exponential backoff (ms) */
  MAX_RETRY_DELAY_MS: 10000,
} as const;

/**
 * Schedule generation defaults
 */
export const SCHEDULE_DEFAULTS = {
  /** Default department if none specified */
  DEFAULT_DEPARTMENT: 'Akutmottagning',
  
  /** Default minimum staff per shift */
  DEFAULT_MIN_STAFF: 1,
  
  /** Default minimum experience points per shift */
  DEFAULT_MIN_EXPERIENCE: 1,
  
  /** Default weekend penalty weight for fairness */
  DEFAULT_WEEKEND_PENALTY: 1500,
  
  /** Default fairness weight (1.0 = maximum fairness focus) */
  DEFAULT_FAIRNESS_WEIGHT: 1.0,
  
  /** Default maximum hours per nurse per period */
  DEFAULT_MAX_HOURS: 40,
  
  /** Default work percentage if not specified */
  DEFAULT_WORK_PERCENTAGE: 100,
} as const;

/**
 * UI configuration
 */
export const UI_CONFIG = {
  /** Debounce delay for search inputs (ms) */
  SEARCH_DEBOUNCE_MS: 300,
  
  /** Toast notification duration (ms) */
  TOAST_DURATION_MS: 5000,
  
  /** Loading spinner delay (ms) - prevents flash for fast operations */
  LOADING_DELAY_MS: 200,
} as const;

/**
 * Validation rules
 */
export const VALIDATION = {
  /** Maximum scheduling period in days */
  MAX_SCHEDULE_DAYS: 31,
  
  /** Minimum employee name length */
  MIN_NAME_LENGTH: 2,
  
  /** Maximum employee name length */
  MAX_NAME_LENGTH: 50,
  
  /** Valid shift types */
  VALID_SHIFT_TYPES: ['day', 'evening', 'night'] as const,
  
  /** Valid days of week */
  VALID_DAYS: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const,
} as const;
