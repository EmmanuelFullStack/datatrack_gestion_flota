import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Route, PaginatedResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class RoutesService {
  private readonly url = `${environment.apiUrl}/routes`;

  constructor(private readonly http: HttpClient) {}

  getAll(params: { page?: number; limit?: number; estado?: string; search?: string } = {}): Observable<PaginatedResponse<Route>> {
    let httpParams = new HttpParams();
    if (params.page) httpParams = httpParams.set('page', params.page);
    if (params.limit) httpParams = httpParams.set('limit', params.limit);
    if (params.estado) httpParams = httpParams.set('estado', params.estado);
    if (params.search) httpParams = httpParams.set('search', params.search);
    return this.http.get<PaginatedResponse<Route>>(this.url, { params: httpParams });
  }

  getActive(): Observable<Route[]> {
    return this.http.get<Route[]>(`${this.url}/active`);
  }

  getById(id: string): Observable<Route> {
    return this.http.get<Route>(`${this.url}/${id}`);
  }

  create(data: Partial<Route>): Observable<Route> {
    return this.http.post<Route>(this.url, data);
  }

  update(id: string, data: Partial<Route>): Observable<Route> {
    return this.http.put<Route>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }

  createLocator(routeId: string): Observable<{ locatorUrl: string }> {
    return this.http.post<{ locatorUrl: string }>(
      `${environment.apiUrl}/datatrack/routes/${routeId}/locator`,
      {},
    );
  }
}
