import { CreateRouteUseCase } from '../create-route.use-case';
import { ROUTE_REPOSITORY } from '../../../domain/repositories/route.repository.port';
import { Route, RouteEstado } from '../../../domain/entities/route.entity';

const mockRouteRepo = {
  save: jest.fn(),
  findById: jest.fn(),
  findAll: jest.fn(),
  findActiveRoutes: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  countPassengers: jest.fn(),
};

const validDto = {
  nombre: 'Ruta Norte Centro',
  origen: 'Terminal Norte',
  destino: 'Centro',
  distanciaKm: 12.5,
  capacidadMaxima: 40,
};

describe('CreateRouteUseCase', () => {
  let useCase: CreateRouteUseCase;
  const TENANT_ID = 'tenant-test-uuid';

  beforeEach(() => {
    jest.clearAllMocks();
    useCase = new CreateRouteUseCase(mockRouteRepo as any);
    mockRouteRepo.save.mockImplementation((route) => Promise.resolve(route));
  });

  // Test Case 1: Creates route with correct tenant isolation
  it('should create route bound to correct tenantId', async () => {
    const result = await useCase.execute(TENANT_ID, validDto);
    expect(result.tenantId).toBe(TENANT_ID);
    expect(mockRouteRepo.save).toHaveBeenCalledTimes(1);
  });

  // Test Case 2: Default estado is ACTIVA
  it('should default route estado to ACTIVA', async () => {
    const result = await useCase.execute(TENANT_ID, validDto);
    expect(result.estado).toBe(RouteEstado.ACTIVA);
  });

  // Test Case 3: Custom estado is respected
  it('should use provided estado when specified', async () => {
    const dto = { ...validDto, estado: RouteEstado.INACTIVA };
    const result = await useCase.execute(TENANT_ID, dto);
    expect(result.estado).toBe(RouteEstado.INACTIVA);
  });

  // Test Case 4: Route has generated UUID
  it('should generate a UUID id for the route', async () => {
    const result = await useCase.execute(TENANT_ID, validDto);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe('string');
    expect(result.id.length).toBeGreaterThan(0);
  });

  // Test Case 5: Route fields are persisted correctly
  it('should persist all provided fields', async () => {
    const result = await useCase.execute(TENANT_ID, validDto);
    expect(result.nombre).toBe(validDto.nombre);
    expect(result.origen).toBe(validDto.origen);
    expect(result.destino).toBe(validDto.destino);
    expect(Number(result.distanciaKm)).toBe(validDto.distanciaKm);
    expect(result.capacidadMaxima).toBe(validDto.capacidadMaxima);
  });

  // Test Case 6: Route without optional fields
  it('should create route without distanciaKm and horario', async () => {
    const minimalDto = {
      nombre: 'Ruta Simple',
      origen: 'A',
      destino: 'B',
      capacidadMaxima: 30,
    };
    const result = await useCase.execute(TENANT_ID, minimalDto);
    expect(result.distanciaKm).toBeNull();
    expect(result.horario).toBeNull();
  });

  // Test Case 7: Repository save is called with the right arguments
  it('should call repository save exactly once', async () => {
    await useCase.execute(TENANT_ID, validDto);
    expect(mockRouteRepo.save).toHaveBeenCalledTimes(1);
    const savedRoute = mockRouteRepo.save.mock.calls[0][0] as Route;
    expect(savedRoute).toBeInstanceOf(Route);
  });
});
