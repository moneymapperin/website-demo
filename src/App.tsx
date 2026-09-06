import { useEffect, useState } from 'react';
import { ComingSoonProvider } from './context/ComingSoonContext';
import { ComingSoonModal } from './components/ComingSoonModal';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { PillarsSection } from './components/PillarsSection';
import { AIAssistantSection } from './components/AIAssistantSection';
import { InsightsSection } from './components/InsightsSection';
import { CTASection } from './components/CTASection';
import { Footer } from './components/Footer'; // Added missing Footer import
import QrLoginPage from './pages/QrLoginPage'; // Import the Web QR Login Page

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    // Listen for URL route changes
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 1. If visitor goes to /qr-login or /login, render the Web QR Login Page
  if (currentPath === '/qr-login' || currentPath === '/login') {
    return <QrLoginPage />;
  }

  // 2. Otherwise, render your default MoneyMapper Landing Page
  return (
    <ComingSoonProvider>
      <div className="min-h-screen bg-background text-white flex flex-col selection:bg-brand-purple/30 selection:text-white">
        {/* Sticky Glassmorphic Navbar */}
        <Navbar />

        {/* Sections */}
        <main className="flex-1">
          <Hero />
          <PillarsSection />
          <AIAssistantSection />
          <InsightsSection />
          <CTASection />
        </main>

        {/* Footer */}
        <Footer />

        {/* Universal Coming Soon Modal */}
        <ComingSoonModal />
      </div>
    </ComingSoonProvider>
  );
}

export default App;
