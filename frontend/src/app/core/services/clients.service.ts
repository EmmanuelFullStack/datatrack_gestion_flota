import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Client, PaginatedResponse } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ClientsService {
  private readonly url = `${environment.apiUrl}/clients`;

  constructor(private readonly http: HttpClient) {}

  getAll(params: { page?: number; limit?: number; search?: string } = {}): Observable<PaginatedResponse<Client>> {
    let httpParams = new HttpParams();
    Object.entries(params).forEach(([k, v]) => { if (v != null) httpParams = httpParams.set(k, v); });
    return this.http.get<PaginatedResponse<Client>>(this.url, { params: httpParams });
  }

  getById(id: string): Observable<Client> {
    return this.http.get<Client>(`${this.url}/${id}`);
  }

  create(data: Partial<Client>): Observable<Client> {
    return this.http.post<Client>(this.url, data);
  }

  update(id: string, data: Partial<Client>): Observable<Client> {
    return this.http.put<Client>(`${this.url}/${id}`, data);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
}
