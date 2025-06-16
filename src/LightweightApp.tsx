import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { addTestEmployeesForDevelopment } from "./utils/devEmployees";
import { addSampleEmployeesForProduction } from "./utils/productionEmployees";
import "./App.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

// Lightweight placeholder components instead of the heavy real ones
const LightIndex = () => (
  <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', minHeight: '100vh' }}>
    <h1>🏠 Vårdschema - MittSchema</h1>
    <p>Lightweight version of the schedule management system</p>
    <div style={{ marginTop: '2rem' }}>
      <a href="/auth" style={{ margin: '0 1rem', padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Authentication
      </a>
      <a href="/schedule" style={{ margin: '0 1rem', padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Schedule
      </a>
      <a href="/directory" style={{ margin: '0 1rem', padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
        Directory
      </a>
    </div>
  </div>
);

const LightAuth = () => (
  <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', color: 'white', minHeight: '100vh' }}>
    <h1>🔐 Authentication</h1>
    <p>Lightweight auth page placeholder</p>
    <a href="/" style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
      Back to Home
    </a>
  </div>
);

const LightSchedule = () => (
  <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)', color: 'white', minHeight: '100vh' }}>
    <h1>📅 Schedule</h1>
    <p>Lightweight schedule page placeholder</p>
    <a href="/" style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
      Back to Home
    </a>
  </div>
);

const LightDirectory = () => (
  <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)', color: 'white', minHeight: '100vh' }}>
    <h1>📋 Directory</h1>
    <p>Lightweight directory page placeholder</p>
    <a href="/" style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
      Back to Home
    </a>
  </div>
);

const LightNotFound = () => (
  <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #6b7280 0%, #374151 100%)', color: 'white', minHeight: '100vh' }}>
    <h1>❌ 404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/" style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.2)', color: 'white', textDecoration: 'none', borderRadius: '5px' }}>
      Back to Home
    </a>
  </div>
);

function LightweightApp() {
  console.log('🔧 LightweightApp component loading...');
  
  // Add test employees in development mode
  if (import.meta.env.DEV) {
    console.log('🔧 Development mode - adding test employees...');
    addTestEmployeesForDevelopment().catch(error => {
      console.error('Failed to add development employees:', error);
    });
  } else {
    console.log('🌐 Production mode - adding sample employees...');
    try {
      addSampleEmployeesForProduction().catch(error => {
        console.warn('Failed to add production employees (non-critical):', error);
      });
    } catch (error) {
      console.warn('Failed to call production employee function (non-critical):', error);
    }
  }

  console.log('🔧 Rendering LightweightApp component...');
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            <Route path="/" element={<LightIndex />} />
            <Route path="/auth" element={<LightAuth />} />
            <Route path="/schedule" element={<LightSchedule />} />
            <Route path="/schedule/settings" element={<LightSchedule />} />
            <Route path="/directory" element={<LightDirectory />} />
            <Route path="/employee/:id" element={<LightDirectory />} />
            <Route path="/help" element={<LightDirectory />} />
            <Route path="*" element={<LightNotFound />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default LightweightApp;
