// Network interceptor to block all Supabase calls and external scheduler API in development
console.log('🚫 Loading network interceptor...');

if (typeof window !== 'undefined') {
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    console.log('🚫 Installing aggressive network interceptor to block external calls');
    
    // Block fetch requests
    const originalFetch = window.fetch;
    window.fetch = function(...args) {
      const [url] = args;
      
      // Block any calls to Supabase domains AND external scheduler API
      if (typeof url === 'string' && (
        url.includes('supabase.co') || 
        url.includes('supabase.com') ||
        url.includes('scheduler3-723515091945.europe-north2.run.app')
      )) {
        console.warn('🚫 BLOCKED external API call:', url);
        return Promise.reject(new Error('External network calls are disabled in development - using local generation'));
      }
      
      return originalFetch.apply(this, args);
    };
    
    // Block XMLHttpRequest as well
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function(method, url, ...args) {
      if (typeof url === 'string' && (
        url.includes('supabase.co') || 
        url.includes('supabase.com') ||
        url.includes('scheduler3-723515091945.europe-north2.run.app')
      )) {
        console.warn('🚫 BLOCKED external XHR call:', url);
        throw new Error('External network calls are disabled in development - using local generation');
      }
      return originalOpen.call(this, method, url, ...args);
    };
    
    console.log('✅ Network interceptor installed successfully - all external calls blocked');
  }
}
