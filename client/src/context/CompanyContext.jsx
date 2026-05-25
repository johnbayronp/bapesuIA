import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const CompanyContext = createContext({
  user: null,
  profile: null,
  company: null,
  loading: true,
  refresh: async () => {},
  setCompanyId: async () => {},
});

export function CompanyProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [profile, setProfile] = useState(null);
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user: u } } = await supabase.auth.getUser();
      setUser(u ?? null);

      if (!u) {
        setProfile(null);
        setCompany(null);
        return;
      }

      // Cargar perfil del usuario (con company_id)
      const { data: p } = await supabase
        .from('users')
        .select('id, email, role, company_id, first_name, last_name, is_active')
        .eq('id', u.id)
        .maybeSingle();

      setProfile(p ?? null);

      // Cargar la empresa del usuario
      if (p?.company_id) {
        const { data: c } = await supabase
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
    }
  }, []);

  useEffect(() => {
    loadAll();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadAll();
    });
    return () => subscription.unsubscribe();
  }, [loadAll]);

  // Asigna el company_id al perfil del usuario y recarga
  const setCompanyId = async (companyId) => {
    if (!user) return;
    await supabase
      .from('users')
      .update({ company_id: companyId, updated_at: new Date().toISOString() })
      .eq('id', user.id);
    await loadAll();
  };

  return (
    <CompanyContext.Provider
      value={{ user, profile, company, loading, refresh: loadAll, setCompanyId }}
    >
      {children}
    </CompanyContext.Provider>
  );
}

export const useCompany = () => useContext(CompanyContext);
