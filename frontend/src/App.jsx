import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SplashScreen } from './components/SplashScreen';
import { Home } from './pages/Home';
import { Wardrobe } from './pages/Wardrobe';
import { ClothingDetail } from './pages/ClothingDetail';
import { WeeklyPlanner } from './pages/WeeklyPlanner';
import { History } from './pages/History';
import { AIScanner } from './pages/AIScanner';
import { AdminPanel } from './pages/AdminPanel';

export function App() {
  const [showSplash, setShowSplash] = useState(() => {
    // Show splash screen once per browser session
    return !sessionStorage.getItem('wardrobe_splash_seen');
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem('wardrobe_splash_seen', 'true');
    setShowSplash(false);
  };

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      {showSplash && (
        <SplashScreen
          desktopVideo="/splash.mp4"
          mobileVideo="/splashmb.mp4"
          onComplete={handleSplashComplete}
        />
      )}
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/wardrobe" element={<Wardrobe />} />
          <Route path="/wardrobe/:id" element={<ClothingDetail />} />
          <Route path="/planner" element={<WeeklyPlanner />} />
          <Route path="/history" element={<History />} />
          <Route path="/scan" element={<AIScanner />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
