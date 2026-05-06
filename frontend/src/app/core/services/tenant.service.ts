import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Tenant } from '../models/models';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private readonly apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private readonly http: HttpClient) {}

  getById(id: string): Observable<Tenant> {
    return this.http.get<Tenant>(`${this.apiUrl}/${id}`);
  }

  update(id: string, data: Partial<Tenant>): Observable<Tenant> {
    return this.http.put<Tenant>(`${this.apiUrl}/${id}`, data);
  }
}
