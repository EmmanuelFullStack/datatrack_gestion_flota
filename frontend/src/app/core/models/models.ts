export interface Tenant {
  id: string;
  nombre: string;
  nit: string;
  ciudad: string;
  logoUrl: string | null;
  estado: 'ACTIVO' | 'INACTIVO';
  planSuscripcion: 'BASICO' | 'PROFESIONAL' | 'ENTERPRISE';
  createdAt: string;
}

export interface User {
  id: string;
  nombre: string;
  email: string;
  role: 'TENANT_ADMIN' | 'TENANT_USER' | 'SUPER_ADMIN';
  tenantId: string | null;
  tenantNombre?: string;
  tenantLogo?: string | null;
}

export interface AuthResponse {
  accessToken: string;
  expiresIn: string;
  user: User;
}

export interface AdminLoginResponse {
  accessToken: string;
  expiresIn: string;
  user: User;
  tenants: Pick<Tenant, 'id' | 'nombre' | 'nit' | 'ciudad' | 'estado'>[];
}

export interface SelectTenantResponse {
  accessToken: string;
  expiresIn: string;
  tenantNombre: string;
  tenantLogo: string | null;
}

export interface RouteStop {
  orden: number;
  nombre: string;
  lat: number;
  lon: number;
}

export interface Route {
  id: string;
  nombre: string;
  origen: string;
  destino: string;
  distanciaKm: number | null;
  horario: { diasSemana: string[]; horaSalida: string; horaLlegada: string } | null;
  paradas: RouteStop[] | null;
  capacidadMaxima: number;
  estado: 'ACTIVA' | 'INACTIVA' | 'EN_SERVICIO';
  tenantId: string;
  createdAt: string;
}

export interface Passenger {
  id: string;
  nombre: string;
  documento: string;
  telefono: string | null;
  estado: 'PENDIENTE' | 'EMBARCADO' | 'EN_TRANSITO' | 'LLEGO';
  lat: number | null;
  lon: number | null;
  deviceIdDatatrack: string | null;
  deviceNameDatatrack: string | null;
  ultimoGpsUpdate: string | null;
  routeId: string | null;
  tenantId: string;
  createdAt: string;
}

export interface Client {
  id: string;
  nombre: string;
  documento: string;
  telefono: string | null;
  email: string | null;
  activo: boolean;
  tenantId: string;
  createdAt: string;
}

export interface GpsUpdateEvent {
  passengerId: string;
  deviceName?: string;
  lat: number;
  lon: number;
  speed: number;
  heading: number;
  estado: string;
  timestamp: string;
  tenantId: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface DashboardStats {
  inTransit: number;
  boarded: number;
  arrived: number;
  pending: number;
}
