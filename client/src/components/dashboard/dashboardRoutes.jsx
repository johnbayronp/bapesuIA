import DashHome from './sections/DashHome';
import ClientsManager from './sections/ClientsManager';
import UsersManager from './sections/UsersManager';
import CompanySettings from './sections/CompanySettings';
import ServicesManager from './sections/services';
import Analytics from './sections/Analytics';
import Reminders from './sections/Reminders';
import InventoryModule from './sections/inventory';
import InventoryTestPanel from './sections/inventory/InventoryTestPanel';
import CobrosModule from './sections/CobrosModule';
import FacturaEditor from './sections/FacturaEditor';
import QuotationsList from './sections/QuotationsList';
import QuotationEditor from './sections/QuotationEditor';
import InvoiceEditor from './sections/InvoiceEditor';
import LockedModule from './LockedModule';

export function normalizeDashboardPath(pathname) {
  if (pathname === '/dashboard' || pathname === '/dashboard/') return '/';
  const path = pathname.replace(/^\/dashboard/, '');
  return path || '/';
}

const ROUTES = [
  { routePath: '/cobros/invoices/new', test: (p) => p === '/cobros/invoices/new' },
  { routePath: '/cobros/invoices/:id', test: (p) => /^\/cobros\/invoices\/[^/]+$/.test(p) && p !== '/cobros/invoices/new' },
  { routePath: '/cobros/facturas/new', test: (p) => p === '/cobros/facturas/new' },
  { routePath: '/cobros/facturas/:id', test: (p) => /^\/cobros\/facturas\/[^/]+$/.test(p) && p !== '/cobros/facturas/new' },
  { routePath: '/quotations/new', test: (p) => p === '/quotations/new' },
  { routePath: '/quotations/:id', test: (p) => /^\/quotations\/[^/]+$/.test(p) && p !== '/quotations/new' },
  { routePath: '/', test: (p) => p === '/' },
  { routePath: '/clients', test: (p) => p === '/clients' },
  { routePath: '/services', test: (p) => p === '/services' },
  { routePath: '/analytics', test: (p) => p === '/analytics' },
  { routePath: '/reminders', test: (p) => p === '/reminders' },
  { routePath: '/inventory', test: (p) => p === '/inventory' },
  { routePath: '/inv-test', test: (p) => p === '/inv-test' },
  { routePath: '/cobros', test: (p) => p === '/cobros' },
  { routePath: '/quotations', test: (p) => p === '/quotations' },
  { routePath: '/users', test: (p) => p === '/users' },
  { routePath: '/company', test: (p) => p === '/company' },
];

export function matchDashboardRoute(pathname) {
  const path = normalizeDashboardPath(pathname);
  return ROUTES.find((r) => r.test(path)) ?? ROUTES.find((r) => r.routePath === '/');
}

export function renderDashboardPage(pathname, { canAccess, company }) {
  const path = normalizeDashboardPath(pathname);
  const locked = (name) => <LockedModule moduleName={name} plan={company?.plan} />;

  switch (path) {
    case '/':
      return <DashHome />;
    case '/clients':
      return <ClientsManager />;
    case '/services':
      return canAccess('servicios') ? <ServicesManager /> : locked('Servicios');
    case '/analytics':
      return canAccess('analytics') ? <Analytics /> : locked('Analíticas');
    case '/reminders':
      return canAccess('reminders') ? <Reminders /> : locked('Recordatorios');
    case '/inventory':
      return canAccess('inventario') ? <InventoryModule /> : locked('Inventario');
    case '/inv-test':
      return <InventoryTestPanel />;
    case '/cobros':
      return canAccess('cobros') ? <CobrosModule /> : locked('Cobros');
    case '/quotations':
      return canAccess('cotizaciones') ? <QuotationsList /> : locked('Cotizaciones');
    case '/users':
      return <UsersManager />;
    case '/company':
      return <CompanySettings />;
    case '/cobros/invoices/new':
      return canAccess('cobros') ? <InvoiceEditor /> : locked('Cobros');
    case '/cobros/facturas/new':
      return canAccess('facturacion') ? <FacturaEditor /> : locked('Facturación');
    case '/quotations/new':
      return canAccess('cotizaciones') ? <QuotationEditor /> : locked('Cotizaciones');
    default:
      break;
  }

  if (/^\/cobros\/invoices\/[^/]+$/.test(path)) {
    return canAccess('cobros') ? <InvoiceEditor /> : locked('Cobros');
  }
  if (/^\/cobros\/facturas\/[^/]+$/.test(path)) {
    return canAccess('facturacion') ? <FacturaEditor /> : locked('Facturación');
  }
  if (/^\/quotations\/[^/]+$/.test(path)) {
    return canAccess('cotizaciones') ? <QuotationEditor /> : locked('Cotizaciones');
  }

  return <DashHome />;
}
