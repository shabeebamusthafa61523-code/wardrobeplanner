import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Wardrobe } from './pages/Wardrobe';
import { ClothingDetail } from './pages/ClothingDetail';
import { WeeklyPlanner } from './pages/WeeklyPlanner';
import { History } from './pages/History';
import { AIScanner } from './pages/AIScanner';
import { AdminPanel } from './pages/AdminPanel';

export function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
