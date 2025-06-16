import { useState } from 'react';

export default function DebugApp() {
  const [step, setStep] = useState(1);
  
  console.log('🔧 DebugApp component loading, step:', step);

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', minHeight: '100vh' }}>
            <h1>🔧 Step 1: Basic React Component</h1>
            <p>This tests if React components render correctly.</p>
            <button onClick={() => setStep(2)} style={{ padding: '10px 20px', margin: '10px' }}>
              Next: Test Routing
            </button>
          </div>
        );
      
      case 2:
        return (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', minHeight: '100vh' }}>
            <h1>🔧 Step 2: Add React Router</h1>
            <p>Testing if React Router loads correctly...</p>
            <button onClick={() => setStep(3)} style={{ padding: '10px 20px', margin: '10px' }}>
              Next: Test TanStack Query
            </button>
            <button onClick={() => setStep(1)} style={{ padding: '10px 20px', margin: '10px' }}>
              Back
            </button>
          </div>
        );
      
      case 3:
        return (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', minHeight: '100vh' }}>
            <h1>🔧 Step 3: Add TanStack Query</h1>
            <p>Testing if TanStack Query loads correctly...</p>
            <button onClick={() => setStep(4)} style={{ padding: '10px 20px', margin: '10px' }}>
              Next: Test Supabase
            </button>
            <button onClick={() => setStep(2)} style={{ padding: '10px 20px', margin: '10px' }}>
              Back
            </button>
          </div>
        );
      
      case 4:
        return (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', minHeight: '100vh' }}>
            <h1>🔧 Step 4: Test Supabase Client</h1>
            <p>Testing if Supabase client loads correctly...</p>
            <button onClick={() => setStep(5)} style={{ padding: '10px 20px', margin: '10px' }}>
              Next: Test Full App
            </button>
            <button onClick={() => setStep(3)} style={{ padding: '10px 20px', margin: '10px' }}>
              Back
            </button>
          </div>
        );
      
      case 5:
        return (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', minHeight: '100vh' }}>
            <h1>🔧 Step 5: Full App Loading</h1>
            <p>If you see this, the issue is in the full App component.</p>
            <button onClick={() => setStep(1)} style={{ padding: '10px 20px', margin: '10px' }}>
              Start Over
            </button>
            <button onClick={() => setStep(4)} style={{ padding: '10px 20px', margin: '10px' }}>
              Back
            </button>
          </div>
        );
      
      default:
        return (
          <div style={{ padding: '2rem', textAlign: 'center', background: 'red', color: 'white', minHeight: '100vh' }}>
            <h1>❌ Error State</h1>
            <p>Something went wrong in the debug process.</p>
            <button onClick={() => setStep(1)} style={{ padding: '10px 20px', margin: '10px' }}>
              Reset
            </button>
          </div>
        );
    }
  };

  return renderStep();
}
