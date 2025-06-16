import { SCHEDULER_API } from "@/config/api";

export interface HealthStatus {
  isHealthy: boolean;
  database: boolean;
  api: boolean;
  message?: string;
  version?: string;
}

export const healthService = {
  /**
   * Check the health of the scheduler API
   */
  checkSchedulerHealth: async (): Promise<HealthStatus> => {
    try {
      const response = await fetch(`${SCHEDULER_API.BASE_URL}${SCHEDULER_API.ENDPOINTS.HEALTH}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          isHealthy: false,
          database: false,
          api: false,
          message: `API returned ${response.status}: ${errorText}`,
        };
      }

      const result = await response.json();
      
      return {
        isHealthy: result.status === 'healthy',
        database: result.database === 'connected',
        api: true,
        message: result.status,
        version: result.version,
      };
    } catch (error) {
      console.error('Health check failed:', error);
      
      return {
        isHealthy: false,
        database: false,
        api: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },

  /**
   * Perform a basic connectivity check
   */
  checkBasicConnectivity: async (): Promise<boolean> => {
    try {
      const response = await fetch(`${SCHEDULER_API.BASE_URL}/`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      return response.ok;
    } catch (error) {
      console.error('Basic connectivity check failed:', error);
      return false;
    }
  },
};
