import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AlarmPosition {
  passengerId?: string;
  nombre?: string;
  deviceId: string;
  lat: number;
  lon: number;
  speed: number;
  timestamp: string;
  reason: string;
}

@Injectable({ providedIn: 'root' })
export class AlarmsService {
  private readonly apiUrl = `${environment.apiUrl}/datatrack/alarms`;

  constructor(private readonly http: HttpClient) {}

  getAlarms(): Observable<AlarmPosition[]> {
    return this.http.get<AlarmPosition[]>(this.apiUrl);
  }
}
