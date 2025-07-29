import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ToolsPage from './components/tools/ToolsPage';
import Login from './components/auth/Login';
import ForgotPassword from './components/auth/ForgotPassword';
import ResetPassword from './components/auth/ResetPassword';
import ProductDescription from './components/tools/ProductDescription';
import RemoveBackground from './components/tools/RemoveBackground';
import VideoIdeas from './components/tools/VideoIdeas';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ThemeToggle from './components/themeUI/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';
import { useAuthRefresh } from "./hooks/useAuthRefresh";
import WhatsappLinkGenerator from './components/tools/WhatsappLinkGenerator';
import QrGenerator from './components/tools/QrGenerator';
import UserProfile from './components/auth/UserProfile';
import UserProfileDebug from './components/auth/UserProfileDebug';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminMiddleware from './components/auth/AdminMiddleware';

function App() {
  useAuthRefresh();
  
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 transition-colors duration-300">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<ToolsPage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/change-password" element={<ResetPassword />} />
              <Route path="/tools" element={<ToolsPage />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
              {/* Ruta temporal de debug */}
              <Route 
                path="/profile-debug" 
                element={
                  <ProtectedRoute>
                    <UserProfileDebug />
                  </ProtectedRoute>
                } 
              />
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
              
                            {/* Rutas del Administrador */}
              <Route 
                path="/admin/*" 
                element={
                  <ProtectedRoute>
                    <AdminMiddleware>
                      <AdminDashboard />
                    </AdminMiddleware>
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