import { AssignToRouteUseCase } from '../assign-to-route.use-case';
import { Passenger, PassengerEstado } from '../../../domain/entities/passenger.entity';
import { Route, RouteEstado } from '../../../../routes/domain/entities/route.entity';
import { NotFoundError } from '../../../../../shared/domain/errors/not-found.error';
import { ConflictError } from '../../../../../shared/domain/errors/conflict.error';

const TENANT_ID = 'tenant-test-uuid';

const mockPassengerRepo = {
  findById: jest.fn(),
  update: jest.fn(),
  save: jest.fn(),
  findAll: jest.fn(),
  findByDeviceId: jest.fn(),
  findInTransit: jest.fn(),
  findByRoute: jest.fn(),
  findAllWithDeviceIds: jest.fn(),
  delete: jest.fn(),
  countByRoute: jest.fn(),
  countByEstado: jest.fn(),
};

const mockRouteRepo = {
  findById: jest.fn(),
  countPassengers: jest.fn(),
  findAll: jest.fn(),
  findActiveRoutes: jest.fn(),
  save: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

const activeRoute = Route.create({
  id: 'route-uuid-1',
  nombre: 'Ruta Test',
  origen: 'A',
  destino: 'B',
  capacidadMaxima: 10,
  estado: RouteEstado.ACTIVA,
  tenantId: TENANT_ID,
});

const inactiveRoute = Route.create({
  id: 'route-uuid-2',
  nombre: 'Ruta Inactiva',
  origen: 'C',
  destino: 'D',
  capacidadMaxima: 10,
  estado: RouteEstado.INACTIVA,
  tenantId: TENANT_ID,
});

const pendingPassenger = Passenger.create({
  id: 'passenger-uuid-1',
  nombre: 'Juan Test',
  documento: '123456',
  tenantId: TENANT_ID,
  estado: PassengerEstado.PENDIENTE,
});

describe('AssignToRouteUseCase', () => {
  let useCase: AssignToRouteUseCase;

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new AssignToRouteUseCase(mockPassengerRepo as any, mockRouteRepo as any);
    mockPassengerRepo.update.mockImplementation((p) => Promise.resolve(p));
  });

  // Test Case 1: Successful assignment
  it('should assign passenger to route and set estado EMBARCADO', async () => {
    mockPassengerRepo.findById.mockResolvedValue(pendingPassenger);
    mockRouteRepo.findById.mockResolvedValue(activeRoute);
    mockRouteRepo.countPassengers.mockResolvedValue(5); // Under capacity

    const result = await useCase.assign('passenger-uuid-1', 'route-uuid-1', TENANT_ID);
    expect(result.routeId).toBe('route-uuid-1');
    expect(result.estado).toBe(PassengerEstado.EMBARCADO);
  });

  // Test Case 2: Passenger not found
  it('should throw NotFoundError when passenger does not exist', async () => {
    mockPassengerRepo.findById.mockResolvedValue(null);
    mockRouteRepo.findById.mockResolvedValue(activeRoute);

    await expect(
      useCase.assign('nonexistent-passenger', 'route-uuid-1', TENANT_ID),
    ).rejects.toThrow(NotFoundError);
  });

  // Test Case 3: Route not found
  it('should throw NotFoundError when route does not exist', async () => {
    mockPassengerRepo.findById.mockResolvedValue(pendingPassenger);
    mockRouteRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.assign('passenger-uuid-1', 'nonexistent-route', TENANT_ID),
    ).rejects.toThrow(NotFoundError);
  });

  // Test Case 4: Inactive route
  it('should throw ConflictError when route is inactive', async () => {
    mockPassengerRepo.findById.mockResolvedValue(pendingPassenger);
    mockRouteRepo.findById.mockResolvedValue(inactiveRoute);

    await expect(
      useCase.assign('passenger-uuid-1', 'route-uuid-2', TENANT_ID),
    ).rejects.toThrow(ConflictError);
  });

  // Test Case 5: Route at full capacity
  it('should throw ConflictError when route is at maximum capacity', async () => {
    mockPassengerRepo.findById.mockResolvedValue(pendingPassenger);
    mockRouteRepo.findById.mockResolvedValue(activeRoute);
    mockRouteRepo.countPassengers.mockResolvedValue(10); // At capacity

    await expect(
      useCase.assign('passenger-uuid-1', 'route-uuid-1', TENANT_ID),
    ).rejects.toThrow(ConflictError);
  });

  // Test Case 6: Unassign sets estado LLEGO and clears routeId
  it('should unassign passenger and set estado LLEGO', async () => {
    const assignedPassenger = Passenger.create({
      ...pendingPassenger,
      id: pendingPassenger.id,
      routeId: 'route-uuid-1',
      estado: PassengerEstado.EN_TRANSITO,
    });
    mockPassengerRepo.findById.mockResolvedValue(assignedPassenger);

    const result = await useCase.unassign('passenger-uuid-1', TENANT_ID);
    expect(result.routeId).toBeNull();
    expect(result.estado).toBe(PassengerEstado.LLEGO);
  });

  // Test Case 7: Unassign passenger not found
  it('should throw NotFoundError when unassigning nonexistent passenger', async () => {
    mockPassengerRepo.findById.mockResolvedValue(null);

    await expect(
      useCase.unassign('nonexistent', TENANT_ID),
    ).rejects.toThrow(NotFoundError);
  });
});
