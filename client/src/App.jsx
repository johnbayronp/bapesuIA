import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ToolsPage from './components/tools/ToolsPage';
import Login from './components/auth/Login';
import ProductDescription from './components/tools/ProductDescription';
import RemoveBackground from './components/tools/RemoveBackground';
import VideoIdeas from './components/tools/VideoIdeas';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ThemeToggle from './components/themeUI/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';
import { useAuthRefresh } from "./hooks/useAuthRefresh";
import WhatsappLinkGenerator from './components/tools/WhatsappLinkGenerator';
import QrGenerator from './components/tools/QrGenerator';
import TextXVoz from './components/tools/TextXVoz';
import AdScriptLoader from './components/adsence/AdScriptLoader';


function App() {
  useAuthRefresh();
  
  return (
    <ThemeProvider>
    <AdScriptLoader/>
      <Router>
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<ToolsPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route 
                path="/tools/product-description" 
                element={
                  <ProtectedRoute>
                    <ProductDescription />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tools/remove-background" 
                element={
                  <ProtectedRoute>
                    <RemoveBackground />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tools/video-ideas" 
                element={
                  <ProtectedRoute>
                    <VideoIdeas/>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tools/whatsapp-link-generator" 
                element={
                  <ProtectedRoute>
                    <WhatsappLinkGenerator />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tools/qr-generator" 
                element={
                  <ProtectedRoute>
                    <QrGenerator/>
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/tools/text-x-voz" 
                element={
                  <ProtectedRoute>
                    <TextXVoz/>
                  </ProtectedRoute>
                } 
              />
            </Routes>
            
            
          </main>
          <ThemeToggle />
          <Footer />
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;