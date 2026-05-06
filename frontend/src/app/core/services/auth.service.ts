import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AdminLoginResponse, AuthResponse, SelectTenantResponse, Tenant, User } from '../models/models';

const TOKEN_KEY   = 'dt_access_token';
const USER_KEY    = 'dt_user';
const TENANTS_KEY = 'dt_admin_tenants';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly apiUrl = environment.apiUrl;
  private readonly currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  readonly currentUser$ = this.currentUserSubject.asObservable();

  availableTenants: Pick<Tenant, 'id' | 'nombre' | 'nit' | 'ciudad' | 'estado'>[] = this.loadTenants();

  constructor(
    private readonly http: HttpClient,
    private readonly router: Router,
  ) {}

  get currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  get isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;
    if (this.isTokenExpired(token)) {
      this.clearSession();
      return false;
    }
    return true;
  }

  get isSuperAdmin(): boolean {
    return this.currentUser?.role === 'SUPER_ADMIN';
  }

  get hasTenantSelected(): boolean {
    return !!this.currentUser?.tenantId;
  }

  get tenantId(): string {
    return this.currentUser?.tenantId ?? '';
  }

  login(email: string, password: string, tenantNit: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password, tenantNit })
      .pipe(tap((r) => this.storeSession(r.accessToken, r.user)));
  }

  register(data: {
    nombre: string;
    email: string;
    password: string;
    empresaNombre: string;
    empresaNit: string;
    empresaCiudad: string;
  }): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/auth/register`, data)
      .pipe(tap((r) => this.storeSession(r.accessToken, r.user)));
  }

  adminLogin(email: string, password: string): Observable<AdminLoginResponse> {
    return this.http
      .post<AdminLoginResponse>(`${this.apiUrl}/auth/admin/login`, { email, password })
      .pipe(
        tap((r) => {
          this.storeSession(r.accessToken, r.user);
          this.availableTenants = r.tenants;
          localStorage.setItem(TENANTS_KEY, JSON.stringify(r.tenants));
        }),
      );
  }

  selectTenant(tenantId: string): Observable<SelectTenantResponse> {
    return this.http
      .post<SelectTenantResponse>(`${this.apiUrl}/auth/admin/select-tenant/${tenantId}`, {})
      .pipe(
        tap((r) => {
          const user: User = { ...this.currentUser!, tenantId, tenantNombre: r.tenantNombre, tenantLogo: r.tenantLogo };
          this.storeSession(r.accessToken, user);
        }),
      );
  }

  switchTenant(): void {
    const stored = localStorage.getItem(TENANTS_KEY);
    this.availableTenants = stored ? (JSON.parse(stored) as typeof this.availableTenants) : [];
    void this.router.navigate(['/admin/select-tenant']);
  }

  logout(): void {
    this.clearSession();
    void this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  private storeSession(token: string, user: User): void {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private clearSession(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TENANTS_KEY);
    this.currentUserSubject.next(null);
    this.availableTenants = [];
  }

  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1])) as { exp?: number };
      if (!payload.exp) return false;
      // Add a 30-second buffer to account for clock skew
      return Date.now() >= (payload.exp - 30) * 1000;
    } catch {
      return true;
    }
  }

  private loadUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  }

  private loadTenants(): Pick<Tenant, 'id' | 'nombre' | 'nit' | 'ciudad' | 'estado'>[] {
    const raw = localStorage.getItem(TENANTS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
}
