import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface DatatrackUnit {
  id: number;
  name: string;
  position: {
    lat: number;
    lon: number;
    speed: number;
    heading: number;
    satellites: number;
    timestamp: string;
  } | null;
}

@Injectable({ providedIn: 'root' })
export class DatatrackService {
  private readonly url = `${environment.apiUrl}/datatrack`;

  constructor(private readonly http: HttpClient) {}

  getUnits(): Observable<DatatrackUnit[]> {
    return this.http.get<DatatrackUnit[]>(`${this.url}/units`);
  }
}
