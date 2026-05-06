# DataTrack Transport — Sistema Multitenancy de Gestión de Rutas GPS

Sistema web multitenancy para gestión de rutas de transporte con seguimiento GPS en tiempo real, integrando la API de Datatrack.

---

## Arquitectura

```
datatrack-transport/
├── backend/          # NestJS (Hexagonal Architecture - Ports & Adapters)
├── frontend/         # Angular 21 + Angular Material 21 + LeafletJS
├── docker-compose.yml
└── .env.example
```

### Arquitectura Hexagonal (Backend)

```
src/modules/<module>/
  ├── domain/
  │   ├── entities/          # Entidades de dominio puras (sin frameworks)
  │   ├── repositories/      # Interfaces (Puertos) de repositorios
  │   └── services/          # Interfaces (Puertos) de servicios de dominio
  ├── application/
  │   ├── use-cases/         # Casos de uso de la aplicación
  │   └── dtos/              # Data Transfer Objects con validaciones
  └── infrastructure/
      ├── persistence/       # Entidades TypeORM + implementaciones de repositorios
      ├── http/              # Controladores NestJS con Swagger
      ├── adapters/          # Adaptadores de servicios externos (Datatrack)
      ├── gateways/          # WebSocket gateways
      └── schedulers/        # Tareas programadas (sincronización GPS)
```

### Estrategia de Multitenancy

- **Aislamiento por Row-Level**: Todos los repositorios filtran por `tenantId` en cada consulta
- **tenant_id en todas las tablas**: Verificado a nivel de base de datos con FK a `tenants`
- **JWT con tenantId**: Cada token contiene el `tenantId` del usuario
- **TenantMiddleware**: Extrae y valida el `tenantId` del JWT en cada request
- **Imposibilidad de data leak**: Un tenant no puede acceder a datos de otro bajo ninguna circunstancia

### Integración Datatrack API

- **Autenticación**: Token → SID de sesión, cacheado en Redis (TTL 240s)
- **Polling GPS**: Cron job cada 30 segundos con `@nestjs/schedule`
- **Gestión de sesión**: Keep-alive automático para evitar expiración de los 5 min
- **WebSocket**: Gateway Socket.IO en namespace `/gps`, rooms por `tenantId`
- **Fallback**: Si Datatrack no responde, retorna posición GPS cacheada
- **Locator**: Generación de links de seguimiento público via `token/update`

---

## Stack Tecnológico

| Capa           | Tecnología                      |
| -------------- | ------------------------------- |
| Backend        | NestJS, TypeScript, TypeORM     |
| Base de Datos  | PostgreSQL 16                   |
| Caché/Sesiones | Redis + ioredis                 |
| Autenticación  | JWT + Passport.js               |
| WebSockets     | Socket.IO                       |
| Scheduler      | @nestjs/schedule                |
| HTTP Seguridad | Helmet, ThrottlerGuard, CORS    |
| Frontend       | Angular 21, Angular Material 21 |
| Mapas          | LeafletJS                       |
| WS Cliente     | socket.io-client                |
| Contenedores   | Docker + Docker Compose         |
| Docs API       | Swagger/OpenAPI 3.0             |

---

## Setup Local

### Prerequisitos

- Node.js 20+
- Docker + Docker Compose

### Con Docker Compose (recomendado)

```bash
# 1. Clonar el repositorio
git clone https://github.com/EmmanuelFullStack/datatrack_gestion_flota
cd datatrack-transport

# 2. Configurar variables de entorno
cp .env.example .env
# Editar .env con credenciales (especialmente JWT_SECRET y DATATRACK_TOKEN)

# 3. Ejecutar migraciones
docker compose --profile migrate up migration

# 4. Levantar todos los servicios
docker compose up -d

# Servicios disponibles:
# Frontend: http://localhost:4200
# Backend API: http://localhost:3000/api/v1
# Swagger: http://localhost:3000/api/v1/docs
# PostgreSQL: localhost:5432
# Redis: localhost:6379
```

### Build Limpio y Re-despliegue
Para asegurar que los cambios de base de datos y branding se apliquen correctamente, usa siempre esta secuencia:

```bash
# 1. Limpiar volúmenes y contenedores previos
docker compose down -v

# 2. Reconstruir imágenes (asegura migración consolidada)
docker compose build

# 3. Levantar todo el stack
docker compose up -d
```

### Incluí estas credenciales aquí solo motivo de la prueba

### Acceso Demo (Seed Data)

El sistema incluye datos pre-cargados para pruebas inmediatas:

- **Tenant 1**:

- **NIT Empresa**: `900123456-1`
- **Usuario**: `admin@empresa.com`
- **Password**: `stringst`
- **Nota**: Al entrar verá rutas creadas y alarmas activas por pasajeros sin ruta asignada o fuera de ruta.

- **Tenant 2**:

- **NIT Empresa**: `900160091`
- **Usuario**: `admin2@empresa.com`
- **Password**: `stringst`
- **Nota**: Al entrar verá un tenant nuevo.

### Este usuario puede acceder a todos los tenants para administrarlos

**SUPER ADMIN**

- **Usuario**: `admin@datatrack.com`
- **Password**: `Admin12345!`

### Setup Manual (desarrollo)

```bash
# Backend
cd backend
cp ../.env.example .env
# Editar .env con tu configuración local
npm install
npm run migration:run   # Aplicar migraciones a PostgreSQL local
npm run start:dev       # API en http://localhost:3000

# Frontend (nueva terminal)
cd frontend
npm install
npm start               # App en http://localhost:4200
```

---

## Variables de Entorno

| Variable                     | Descripción                            | Requerida      |
| ---------------------------- | -------------------------------------- | -------------- |
| `JWT_SECRET`                 | Clave secreta para JWT (mín. 32 chars) | ✅             |
| `DATATRACK_TOKEN`            | Token de API de Datatrack              | ✅             |
| `DB_HOST`                    | Host de PostgreSQL                     | ✅             |
| `DB_PASSWORD`                | Contraseña de PostgreSQL               | ✅             |
| `REDIS_HOST`                 | Host de Redis                          | ✅             |
| `DATATRACK_SESSION_TTL`      | TTL de sesión Datatrack en Redis (seg) | Defecto: 240   |
| `DATATRACK_POLL_INTERVAL_MS` | Intervalo de polling GPS (ms)          | Defecto: 30000 |

Ver `.env.example` para la lista completa.

---

## Endpoints API

### Autenticación

| Método | Endpoint                | Descripción                             |
| ------ | ----------------------- | --------------------------------------- |
| POST   | `/api/v1/auth/register` | Registrar nueva empresa + usuario admin |
| POST   | `/api/v1/auth/login`    | Login con NIT + email + contraseña      |
| GET    | `/api/v1/auth/profile`  | Perfil del usuario autenticado          |

### Rutas

| Método | Endpoint                | Descripción                        |
| ------ | ----------------------- | ---------------------------------- |
| GET    | `/api/v1/routes`        | Listar rutas del tenant (paginado) |
| POST   | `/api/v1/routes`        | Crear nueva ruta                   |
| GET    | `/api/v1/routes/active` | Rutas activas                      |
| GET    | `/api/v1/routes/:id`    | Detalle de ruta                    |
| PUT    | `/api/v1/routes/:id`    | Actualizar ruta                    |
| DELETE | `/api/v1/routes/:id`    | Eliminar ruta                      |

### Pasajeros

| Método | Endpoint                                 | Descripción                          |
| ------ | ---------------------------------------- | ------------------------------------ |
| GET    | `/api/v1/passengers`                     | Listar pasajeros (paginado, filtros) |
| POST   | `/api/v1/passengers`                     | Crear pasajero                       |
| GET    | `/api/v1/passengers/in-transit`          | Pasajeros en tránsito                |
| GET    | `/api/v1/passengers/dashboard-stats`     | Estadísticas por estado              |
| PATCH  | `/api/v1/passengers/:id/assign/:routeId` | Asignar a ruta                       |
| PATCH  | `/api/v1/passengers/:id/unassign`        | Desasignar de ruta                   |

### GPS / Datatrack

| Método | Endpoint                                    | Descripción                       |
| ------ | ------------------------------------------- | --------------------------------- |
| GET    | `/api/v1/datatrack/units`                   | Unidades GPS de Datatrack         |
| GET    | `/api/v1/datatrack/alarms`                  | Unidades sin ruta o fuera de ruta |
| POST   | `/api/v1/datatrack/routes/:routeId/locator` | Crear locator público             |

### WebSocket

- **Namespace**: `/gps`
- **Auth**: Token JWT en `socket.auth.token`
- **Rooms**: Automáticamente unido al room `tenant:{tenantId}`
- **Eventos emitidos**: `gps-update` — array de `GpsUpdateEvent`
- **Eventos recibidos**: `subscribe-route`, `unsubscribe-route`

Ver la documentación completa en `http://localhost:3000/api/v1/docs` (Swagger UI).

---

## Tests

```bash
cd backend
npm test            # Ejecutar todos los tests unitarios
npm run test:cov    # Con reporte de cobertura
```

**Cobertura de tests:**

- `LoginUseCase`: 8 casos (credenciales, tenant inactivo, usuario inactivo, JWT)
- `CreateRouteUseCase`: 7 casos (campos, tenant isolation, validaciones)
- `AssignToRouteUseCase`: 7 casos (asignación, capacidad, desasignación)
- `DatatrackHttpAdapter`: 5 casos (caché Redis, autenticación, errores, fallback)

---

## Decisiones de Arquitectura

### ¿Por qué Hexagonal?

Permite cambiar la base de datos (TypeORM → Prisma), el proveedor de caché (Redis → Memcached) o el adaptador de GPS sin tocar la lógica de negocio. Los domain entities no importan NestJS ni TypeORM.

### ¿Por qué un token global de Datatrack vs. por tenant?

La API de Datatrack provee un token único por cuenta. El sistema está diseñado para manejar múltiples tenants con el mismo token (arquitectura SaaS), donde el `device_id_datatrack` del pasajero es el discriminador que permite mapear unidades GPS a tenants.

### ¿Por qué WebSocket + polling de fallback?

El WebSocket entrega latencia <1s para actualizaciones GPS. El polling HTTP cada 30s como fallback garantiza funcionamiento aunque el cliente WebSocket se desconecte.

### Mejoras Futuras

1. **Refresh tokens** con rotación (actualmente los JWT son de 1h)
2. **Multi-cuenta Datatrack** por tenant (tabla de credenciales por tenant)
3. **Historial de viajes** con análisis de rutas y tiempos
4. **Rate limiting por tenant** además del global
5. **Métricas con Prometheus + Grafana**
6. **Event sourcing** para el historial de posiciones GPS
