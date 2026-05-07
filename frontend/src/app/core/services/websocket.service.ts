import { Injectable, OnDestroy } from '@angular/core';
import { Observable, Subject, BehaviorSubject } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../../environments/environment';
import { GpsUpdateEvent } from '../models/models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class WebsocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly gpsUpdates$  = new Subject<GpsUpdateEvent[]>();
  private readonly connected$   = new BehaviorSubject<boolean>(false);

  constructor(private readonly authService: AuthService) {}

  connect(): void {
    const token = this.authService.getToken();
    if (!token || this.socket?.connected) return;

    this.socket = io(`${environment.wsUrl}${environment.wsNamespace}`, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('[WS] Connected to GPS gateway');
      this.connected$.next(true);
    });

    this.socket.on('gps-update', (events: GpsUpdateEvent[]) => {
      this.gpsUpdates$.next(events);
    });

    this.socket.on('disconnect', (reason) => {
      console.warn('[WS] Disconnected:', reason);
      this.connected$.next(false);
    });

    this.socket.on('connect_error', (err) => {
      console.error('[WS] Connection error:', err.message);
      this.connected$.next(false);
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected$.next(false);
    }
  }

  subscribeToRoute(routeId: string): void {
    this.socket?.emit('subscribe-route', { routeId });
  }

  unsubscribeFromRoute(routeId: string): void {
    this.socket?.emit('unsubscribe-route', { routeId });
  }

  get gpsUpdates(): Observable<GpsUpdateEvent[]> {
    return this.gpsUpdates$.asObservable();
  }

  /** Emits true when the socket is connected, false otherwise */
  get connected(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  /** Synchronous snapshot of the current connection state */
  get isConnected(): boolean {
    return this.connected$.value;
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.gpsUpdates$.complete();
    this.connected$.complete();
  }
}
