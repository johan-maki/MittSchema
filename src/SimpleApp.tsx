import { useState } from 'react';
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

// Simple test pages
const TestIndex = () => (
  <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', minHeight: '100vh' }}>
    <h1>🏠 MittSchema - Test Index</h1>
    <p>This is a simplified version of the home page.</p>
    <p>Employee seeding functions are loaded but not called.</p>
  </div>
);

const TestAuth = () => (
  <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #10b981 0%, #3b82f6 100%)', color: 'white', minHeight: '100vh' }}>
    <h1>🔐 Test Auth Page</h1>
    <p>This is a simplified authentication page.</p>
  </div>
);

function SimpleApp() {
  console.log('🔧 SimpleApp component loading...');
  
  // Test if importing the employee functions causes issues (but don't call them yet)
  console.log('📋 Employee functions imported:', {
    devEmployees: typeof addTestEmployeesForDevelopment,
    prodEmployees: typeof addSampleEmployeesForProduction
  });

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div>
            <nav style={{ padding: '1rem', background: 'rgba(0,0,0,0.1)', color: 'white' }}>
              <a href="/" style={{ margin: '0 1rem', color: 'white' }}>Home</a>
              <a href="/auth" style={{ margin: '0 1rem', color: 'white' }}>Auth</a>
            </nav>
            <Routes>
              <Route path="/" element={<TestIndex />} />
              <Route path="/auth" element={<TestAuth />} />
              <Route path="*" element={<TestIndex />} />
            </Routes>
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default SimpleApp;
