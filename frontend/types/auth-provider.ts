export interface AuthProviderProps {
  children: React.ReactNode;
}

export interface ProtectedRouteConfig {
  routes: string[];
  fallback: string;
}

export interface PublicOnlyRouteConfig {
  routes: string[];
  fallback: string;
}
