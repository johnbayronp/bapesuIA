import { useRef, useState, useEffect, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { registerDashboardCacheEvict } from './routeCacheApi';
import { matchDashboardRoute, normalizeDashboardPath } from './dashboardRoutes';

const MAX_CACHE = 20;

/**
 * Mantiene montadas las secciones ya visitadas del dashboard (keep-alive).
 * Al volver a una sección, conserva modales, formularios, filtros y pestañas internas.
 */
export default function DashboardRouteCache({ renderPage }) {
  const location = useLocation();
  const cacheRef = useRef(new Map());
  const orderRef = useRef([]);
  const [, setCacheVersion] = useState(0);

  const evictRoute = useCallback((pathKey) => {
    if (!cacheRef.current.has(pathKey)) return;
    cacheRef.current.delete(pathKey);
    orderRef.current = orderRef.current.filter((k) => k !== pathKey);
    setCacheVersion((v) => v + 1);
  }, []);

  useEffect(() => registerDashboardCacheEvict(evictRoute), [evictRoute]);

  const pathKey = normalizeDashboardPath(location.pathname);
  const matched = matchDashboardRoute(location.pathname);

  if (!cacheRef.current.has(pathKey)) {
    cacheRef.current.set(pathKey, {
      routePath: matched.routePath,
      location: { ...location },
      element: renderPage(location.pathname),
    });
    orderRef.current.push(pathKey);
    while (orderRef.current.length > MAX_CACHE) {
      const evict = orderRef.current.shift();
      cacheRef.current.delete(evict);
    }
  }

  return (
    <>
      {[...cacheRef.current.entries()].map(([key, { routePath, location: frozenLoc, element }]) => {
        const active = key === pathKey;
        return (
          <div key={key} hidden={!active} className={active ? undefined : 'hidden'}>
            <Routes location={active ? location : frozenLoc}>
              <Route path={routePath} element={element} />
            </Routes>
          </div>
        );
      })}
    </>
  );
}
