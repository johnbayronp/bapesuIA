import React from 'react';

const LocationIndicator = ({ currentPage, icon = "📍" }) => {
  const getPageInfo = (page) => {
    const pageInfo = {
      '/': { name: 'Herramientas', icon: '🛠️' },
      '/tienda': { name: 'Tienda', icon: '🏪' },
      '/profile': { name: 'Mi Perfil', icon: '👤' },
      '/admin': { name: 'Administrador', icon: '⚙️' },
      '/checkout': { name: 'Checkout', icon: '🛒' },
      '/login': { name: 'Iniciar Sesión', icon: '🔐' }
    };
    
    return pageInfo[page] || { name: 'Página', icon: '📍' };
  };

  const pageInfo = getPageInfo(currentPage);

  return (
    <div className="absolute top-0 left-0 right-0 bg-indigo-600 text-white py-2 px-4 text-sm font-medium z-10">
      {pageInfo.icon} Estás en: <span className="font-bold">{pageInfo.name}</span>
    </div>
  );
};

export default LocationIndicator; 