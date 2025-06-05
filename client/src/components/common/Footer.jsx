import React from 'react';

function Footer() {
  return (
    <footer className="bg-gray-800 text-white py-4 text-center">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Apoya Nuestro Proyecto</h2>
        <div className="flex flex-col md:flex-row justify-center items-center space-y-4 md:space-y-0 md:space-x-4 mt-2">
          <a href="https://biz.payulatam.com/B0f6f0aC9E25FA1" target="_blank" rel="noopener noreferrer">
            <button className="border-2 border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-gray-800 transition-colors flex items-center">
              <span className="mr-2">☕</span> $5.000
            </button>
          </a>
          <a href="https://biz.payulatam.com/B0f6f0a1C6F7613" target="_blank" rel="noopener noreferrer">
            <button className="border-2 border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-gray-800 transition-colors flex items-center">
              <span className="mr-2">☕</span> $20.000
            </button>
          </a>
          <a href="https://biz.payulatam.com/L0f6f0a9F320F05" target="_blank" rel="noopener noreferrer">
            <button className="border-2 border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-gray-800 transition-colors flex items-center">
              <span className="mr-2">☕</span> $50.000
            </button>
          </a>
          <a href="https://biz.payulatam.com/L0f6f0aED99B14C" target="_blank" rel="noopener noreferrer">
            <button className="border-2 border-white text-white px-4 py-2 rounded-lg hover:bg-white hover:text-gray-800 transition-colors flex items-center">
              <span className="mr-2">☕</span> $100.000
            </button>
          </a>
        </div>
      </div>
      <p>© 2025 BapesuTech. Todos los derechos reservados.</p>
    </footer>
  );
}

export default Footer; 