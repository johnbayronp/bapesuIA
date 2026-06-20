import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { db } from '../api/db';

// ── Módulos por plan ──────────────────────────────────────────────────
export const PLAN_MODULES = {
  free:       ['clientes', 'cobros', 'cotizaciones'],
  pro:        ['clientes', 'cobros', 'cotizaciones', 'servicios', 'inventario', 'reminders', 'analytics'],
  enterprise: ['clientes', 'cobros', 'cotizaciones', 'servicios', 'inventario', 'reminders', 'analytics', 'facturacion'],
};

export const PLAN_LABELS = {
  free:       { label: 'Gratis',     color: 'bg-gray-100 text-gray-600' },
  pro:        { label: 'Pro',        color: 'bg-yellow-100 text-yellow-700' },
  enterprise: { label: 'Enterprise', color: 'bg-violet-100 text-violet-700' },
};

const CompanyContext = createContext({
  user: null,
  profile: null,
  company: null,
  loading: true,
  isSuperAdmin: false,
  canAccess: () => true,
  refresh: async () => {},
  setCompanyId: async () => {},
});

export function CompanyProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasLoadedOnce = useRef(false);

  const loadAll = useCallback(async ({ silent = false } = {}) => {
    if (!silent && !hasLoadedOnce.current) setLoading(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);

      if (!u) {
        setProfile(null);
        setCompany(null);
        return;
      }

      // Cargar perfil del usuario (con company_id)
      const { data: p } = await db
        .from('users')
        .select('id, email, role, company_id, first_name, last_name, is_active')
        .eq('id', u.id)
        .maybeSingle();

      setProfile(p ?? null);

      // Cargar la empresa del usuario
      if (p?.company_id) {
        const { data: c } = await db
          .from('bapesu_companies')
          .select('*')
          .eq('id', p.company_id)
          .maybeSingle();
        setCompany(c ?? null);
      } else {
        setCompany(null);
      }
    } catch (err) {
      console.error('CompanyContext load error:', err);
    } finally {
      setLoading(false);
      hasLoadedOnce.current = true;
    }
  }, []);

  useEffect(() => {
    loadAll();
    const silentEvents = new Set(['TOKEN_REFRESHED', 'INITIAL_SESSION']);
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        hasLoadedOnce.current = false;
        loadAll();
        return;
      }
      loadAll({ silent: silentEvents.has(event) || hasLoadedOnce.current });
    });
    return () => subscription.unsubscribe();
  }, [loadAll]);

  // Asigna el company_id al perfil del usuario y recarga
  const setCompanyId = async (companyId) => {
    if (!user) return;
    await db
      .from('users')
      .update({ company_id: companyId, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    await loadAll({ silent: true });
  };

  const isSuperAdmin = profile?.role === 'superadmin';

  // Devuelve true si el plan de la empresa incluye el módulo (o si es superadmin)
  const canAccess = (moduleId) => {
    if (isSuperAdmin) return true;
    const plan = company?.plan ?? 'free';
    const allowed = PLAN_MODULES[plan] ?? PLAN_MODULES.free;
    return allowed.includes(moduleId);
  };

  return (
    <CompanyContext.Provider
      value={{ user, profile, company, loading, isSuperAdmin, canAccess, refresh: loadAll, setCompanyId }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
