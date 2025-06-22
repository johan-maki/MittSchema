// Environment configuration and validation
export const environment = {
  // Supabase configuration
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  },
  
  // API configuration
  api: {
    schedulerUrl: import.meta.env.VITE_SCHEDULER_API_URL || "http://localhost:8080",
  },
  
  // Development flags
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Feature flags
  features: {
    enableSchedulerAPI: import.meta.env.VITE_ENABLE_SCHEDULER_API !== 'false',
  }
};

// Validate required environment variables
export function validateEnvironment() {
  const missingVars: string[] = [];
  
  if (!environment.supabase.url) {
    missingVars.push('VITE_SUPABASE_URL');
  }
  
  if (!environment.supabase.anonKey) {
    missingVars.push('VITE_SUPABASE_ANON_KEY');
  }
  
  if (missingVars.length > 0) {
    const message = `Missing required environment variables: ${missingVars.join(', ')}`;
    console.error(message);
    
    if (environment.isProduction) {
      throw new Error(message);
    }
  }
  
  return {
    isValid: missingVars.length === 0,
    missingVars,
  };
}

// Initialize validation on module load
validateEnvironment();
