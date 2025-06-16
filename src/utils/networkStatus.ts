export const checkNetworkStatus = async (): Promise<{
  isOnline: boolean;
  canReachSupabase: boolean;
  error?: string;
}> => {
  // In development, always return success to prevent network calls
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    console.log('🚫 Network status check bypassed in development');
    return {
      isOnline: true,
      canReachSupabase: true,
      error: undefined
    };
  }

  try {
    // Check basic internet connectivity using a simple HEAD request
    await fetch('https://httpbin.org/status/200', {
      method: 'HEAD',
      mode: 'no-cors',
      cache: 'no-cache',
    });
    
    const isOnline = true; // If we get here, we have internet
    
    // Check Supabase connectivity
    try {
      const supabaseUrl = 'https://smblztfikisrnqfjmyqj.supabase.co';
      const supabaseResponse = await fetch(
        `${supabaseUrl}/rest/v1/`,
        {
          method: 'HEAD',
          headers: {
            'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNtYmx6dGZpa2lzcm5xZmpteXFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzk4MjY4MjgsImV4cCI6MjA1NTQwMjgyOH0.yzDHEqCpNAThHKy1hNwXEUpSfgrkSchpmPuES27j8BY',
          },
        }
      );
      
      return {
        isOnline: true,
        canReachSupabase: supabaseResponse.ok,
        error: !supabaseResponse.ok ? 'Supabase server är inte tillgänglig' : undefined,
      };
    } catch (supabaseError) {
      return {
        isOnline: true,
        canReachSupabase: false,
        error: 'Supabase server är inte tillgänglig',
      };
    }
  } catch (networkError) {
    return {
      isOnline: false,
      canReachSupabase: false,
      error: 'Ingen internetanslutning',
    };
  }
};

export const getDetailedNetworkStatus = async (): Promise<string> => {
  // In development, always return success
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    console.log('🚫 Detailed network status check bypassed in development');
    return 'Anslutningen fungerar men autentisering misslyckades';
  }

  const status = await checkNetworkStatus();
  
  if (!status.isOnline) {
    return 'Ingen internetanslutning tillgänglig';
  }
  
  if (!status.canReachSupabase) {
    return 'Internetanslutning fungerar men kan inte nå Supabase servern';
  }
  
  return 'Anslutningen fungerar men autentisering misslyckades';
};
