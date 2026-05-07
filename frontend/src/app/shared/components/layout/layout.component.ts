// src/app/shared/components/layout/layout.component.ts
import { Component, OnInit, OnDestroy, ViewChild, inject } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule, TitleCasePipe } from '@angular/common';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { WebsocketService } from '../../../core/services/websocket.service';
import { User } from '../../../core/models/models';

import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatButtonModule,
    MatTooltipModule,
    TitleCasePipe,
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
})
export class LayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  private authService = inject(AuthService);
  private wsService = inject(WebsocketService);
  private router = inject(Router);
  private breakpointObserver = inject(BreakpointObserver);
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  isMobile = false;
  isExpanded = true;
  isSuperAdmin = false;

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: 'dashboard', route: '/dashboard' },
    { label: 'Rutas', icon: 'route', route: '/routes' },
    { label: 'Pasajeros', icon: 'people', route: '/passengers' },
    { label: 'Mapa GPS', icon: 'map', route: '/passengers/map' },
    { label: 'Alarmas', icon: 'notifications_active', route: '/alarms' },
    { label: 'Clientes', icon: 'business', route: '/clients' },
    { label: 'Configuración', icon: 'settings', route: '/settings' },
  ];

  ngOnInit(): void {
    // Establish WebSocket connection once the user is authenticated
    this.wsService.connect();

    this.authService.currentUser$.pipe(takeUntil(this.destroy$)).subscribe((u) => {
      this.currentUser = u;
      this.isSuperAdmin = u?.role === 'SUPER_ADMIN';
    });

    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(takeUntil(this.destroy$))
      .subscribe((result) => {
        this.isMobile = result.matches;
        this.isExpanded = !this.isMobile;
      });
  }

  toggleSidenav(): void {
    if (this.isMobile) {
      this.sidenav.toggle();
    } else {
      this.isExpanded = !this.isExpanded;
    }
  }

  onNavClick(): void {
    if (this.isMobile) this.sidenav.close();
  }

  switchTenant(): void {
    this.authService.switchTenant();
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.wsService.disconnect();
  }
}
