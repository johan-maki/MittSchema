
import { environment } from './environment';

// API endpoints configuration
// Cloud Run Scheduler API
export const SCHEDULER_API = {
  BASE_URL: environment.api.schedulerUrl,
  ENDPOINTS: {
    OPTIMIZE_SCHEDULE: "/optimize-schedule",
    HEALTH: "/health"
  }
};

// API client configuration
export const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retries: 3,
  retryDelay: 1000, // 1 second base delay
};

// Other API configurations can be added here
