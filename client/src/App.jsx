import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
import PublicRoute from './components/auth/PublicRoute';
import ThemeToggle from './components/themeUI/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';
import { useAuthRefresh } from "./hooks/useAuthRefresh";
import WhatsappLinkGenerator from './components/tools/WhatsappLinkGenerator';
import QrGenerator from './components/tools/QrGenerator';
import LogoStamper from './components/tools/LogoStamper';
import InvoiceGenerator from './components/tools/InvoiceGenerator';
import AdScriptLoader from './components/adsence/AdScriptLoader';
import UserProfile from './components/auth/UserProfile';
import UserProfileDebug from './components/auth/UserProfileDebug';
import UserOrders from './components/auth/UserOrders';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminMiddleware from './components/auth/AdminMiddleware';
import Store from './components/Store';
import Checkout from './components/Checkout';
import CheckoutSuccess from './components/CheckoutSuccess';
import { EcommerceProvider } from './context/EcommerceContext';
import StudioPage from './components/studio/StudioPage';
import ScriptGenerator from './components/studio/ScriptGenerator';
import VideoHook from './components/studio/VideoHook';
import ViralTitles from './components/studio/ViralTitles';
import YoutubeDescription from './components/studio/YoutubeDescription';
import ColaboraPage from './components/ColaboraPage';
import SponsorsBar from './components/common/SponsorsBar';

function App() {
  useAuthRefresh();
  
  return (
    <ThemeProvider>
    <AdScriptLoader/>
      <EcommerceProvider>
        <Router>
          <div className="flex-1 flex flex-col bg-[#f7f8fc] dark:bg-[#07070f] transition-colors duration-300 bg-grid-light dark:bg-grid">
            <Header />
            <main className="flex-1 w-full max-w-screen-xl mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<ToolsPage />} />
              {/* Tienda temporalmente oculta
              <Route path="/tienda" element={<Store />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/checkout-success" element={<CheckoutSuccess />} />
              */}
              <Route 
                path="/login" 
                element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/forgot-password" 
                element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/reset-password" 
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                } 
              />
              <Route 
                path="/change-password" 
                element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                } 
              />
              <Route path="/tools" element={<ToolsPage />} />
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/orders" 
                element={
                  <ProtectedRoute>
                    <UserOrders />
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
              <Route path="/tools/product-description" element={<ProductDescription />} />
              <Route path="/tools/remove-background" element={<RemoveBackground />} />
              <Route path="/tools/video-ideas" element={<VideoIdeas />} />
              <Route path="/tools/whatsapp-link-generator" element={<WhatsappLinkGenerator />} />
              <Route path="/tools/qr-generator" element={<QrGenerator />} />
              <Route path="/tools/logo-stamper" element={<LogoStamper />} />
              <Route path="/tools/invoice-generator" element={<InvoiceGenerator />} />

              {/* Rutas de Studio */}
              <Route path="/studio" element={<StudioPage />} />
              <Route path="/studio/script" element={<ScriptGenerator />} />
              <Route path="/studio/hook" element={<VideoHook />} />
              <Route path="/studio/titles" element={<ViralTitles />} />
              <Route path="/studio/description" element={<YoutubeDescription />} />

              {/* Colaboración */}
              <Route path="/colabora" element={<ColaboraPage />} />
              
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
           <SponsorsBar />
           <Footer />
          <ToastContainer 
            position="top-center"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </div>
        </Router>
      </EcommerceProvider>
    </ThemeProvider>
  );
}

export default App;