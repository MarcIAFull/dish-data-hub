import { ChevronRight, Home } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

export function BreadcrumbNav() {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Map route segments to readable labels
  const getLabel = (segment: string, index: number): string => {
    const labels: Record<string, string> = {
      'dashboard': 'Dashboard',
      'restaurant': 'Restaurantes',
      'new': 'Novo',
      'manage': 'Gerenciar',
      'conversations': 'Conversas',
      'orders': 'Pedidos',
      'analytics': 'Analytics',
      'agent': 'Agente IA',
      'settings': 'Configurações',
      'admin': 'Administração',
      'auth': 'Login',
    };
    
    // Check if it's a UUID (restaurant ID)
    if (segment.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return 'Editar';
    }
    
    return labels[segment] || segment;
  };

  const buildPath = (index: number): string => {
    return '/' + pathSegments.slice(0, index + 1).join('/');
  };

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Início', path: '/' },
    ...pathSegments.map((segment, index) => ({
      label: getLabel(segment, index),
      path: index === pathSegments.length - 1 ? undefined : buildPath(index),
    })),
  ];

  // Don't show breadcrumbs on home page, auth page, or public restaurant pages
  if (
    location.pathname === '/' || 
    location.pathname === '/auth' ||
    location.pathname.startsWith('/r/')
  ) {
    return null;
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground px-4 py-2 bg-muted/30 border-b">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
          {item.path ? (
            <Link
              to={item.path}
              className="hover:text-foreground transition-colors flex items-center gap-1"
            >
              {index === 0 && <Home className="h-3 w-3" />}
              {item.label}
            </Link>
          ) : (
            <span className="text-foreground font-medium flex items-center gap-1">
              {index === 0 && <Home className="h-3 w-3" />}
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
