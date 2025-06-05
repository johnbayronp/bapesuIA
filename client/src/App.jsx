import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/common/Header';
import Footer from './components/common/Footer';
import ToolsPage from './components/tools/ToolsPage';
import Login from './components/auth/Login';
import ProductDescription from './components/tools/ProductDescription';
import RemoveBackground from './components/tools/RemoveBackground';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ThemeToggle from './components/themeUI/ThemeToggle';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
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