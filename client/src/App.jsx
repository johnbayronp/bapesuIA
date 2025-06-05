import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ApiConnectionStatus from "./components/common/ApiConnectionStatus";
import RemoveBackground from "./components/tools/RemoveBackground";
import ProductDescription from "./components/tools/ProductDescription";
import ToolsPage from "./components/tools/ToolsPage";
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";
import ThemeToggle from "./components/ThemeToggle";
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
              <Route path="/remove-background" element={<RemoveBackground />} />
              <Route path="/product-description" element={<ProductDescription />} />
              <Route path="/tools" element={<ToolsPage />} />
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