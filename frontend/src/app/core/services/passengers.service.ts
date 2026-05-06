import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Passenger, PaginatedResponse, DashboardStats } from '../models/models';

@Injectable({ providedIn: 'root' })
export class PassengersService {
  private readonly url = `${environment.apiUrl}/passengers`;

  constructor(private readonly http: HttpClient) {}

  getAll(params: { page?: number; limit?: number; estado?: string; routeId?: string; search?: string } = {}): Observable<PaginatedResponse<Passenger>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) httpParams = httpParams.set(k, v); });
    return this.http.get<PaginatedResponse<Passenger>>(this.url, { params: httpParams });
  }

  getById(id: string): Observable<Passenger> {
    return this.http.get<Passenger>(`${this.url}/${id}`);
  }

  getInTransit(): Observable<Passenger[]> {
    return this.http.get<Passenger[]>(`${this.url}/in-transit`);
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.url}/dashboard-stats`);
  }

  create(data: Partial<Passenger>): Observable<Passenger> {
    return this.http.post<Passenger>(this.url, data);
  }

  update(id: string, data: Partial<Passenger>): Observable<Passenger> {
    return this.http.put<Passenger>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  assignToRoute(passengerId: string, routeId: string): Observable<Passenger> {
    return this.http.patch<Passenger>(`${this.url}/${passengerId}/assign/${routeId}`, {});
  }

  unassign(passengerId: string): Observable<Passenger> {
    return this.http.patch<Passenger>(`${this.url}/${passengerId}/unassign`, {});
  }
}
