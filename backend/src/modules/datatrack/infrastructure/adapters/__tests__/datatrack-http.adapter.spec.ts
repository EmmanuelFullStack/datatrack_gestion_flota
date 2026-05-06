import { DatatrackHttpAdapter } from '../datatrack-http.adapter';
import axios from 'axios';

// Redis Mock
const mockRedis = {
  get: jest.fn(),
  setex: jest.fn(),
  del: jest.fn(),
  expire: jest.fn(),
};

// Config Mock
const mockConfigService = {
  get: jest.fn().mockImplementation((key: string) => {
    const config: Record<string, any> = {
      'datatrack.baseUrl': 'https://api.datatrack.app/api',
      'datatrack.token': 'test-token-12345',
      'datatrack.sessionTtl': 240,
    };
    return config[key];
  }),
};

// Mock axios BEFORE anything else
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('DatatrackHttpAdapter', () => {
  let adapter: DatatrackHttpAdapter;
  const mockAxiosInstance = {
    get: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
    
    adapter = new DatatrackHttpAdapter(mockConfigService as any, mockRedis as any);
  });

  // Test Case 1: Returns cached SID from Redis
  it('should return cached SID without API call', async () => {
    mockRedis.get.mockResolvedValue('cached-sid-123');
    const sid = await adapter.authenticate();
    expect(sid).toBe('cached-sid-123');
    expect(mockAxiosInstance.get).not.toHaveBeenCalled();
  });

  // Test Case 2: Authenticates and caches SID when cache is empty
  it('should authenticate and cache SID when Redis is empty', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockAxiosInstance.get.mockResolvedValue({ data: { eid: 'fresh-sid-456' } });

    const sid = await adapter.authenticate();
    expect(sid).toBe('fresh-sid-456');
    expect(mockRedis.setex).toHaveBeenCalledWith('datatrack:session:sid', 240, 'fresh-sid-456');
  });

  // Test Case 3: Throws on authentication failure
  it('should throw when Datatrack returns error', async () => {
    mockRedis.get.mockResolvedValue(null);
    mockAxiosInstance.get.mockResolvedValue({ data: { error: 1 } });

    await expect(adapter.authenticate()).rejects.toThrow();
  });

  // Test Case 4: getAllUnits maps response to DatatrackUnit VOs
  it('should return mapped DatatrackUnit array from getAllUnits', async () => {
    mockAxiosInstance.get.mockResolvedValue({
      data: {
        items: [
          { id: 12345, nm: 'Bus 01', pos: { x: -74.07, y: 4.71, s: 30, c: 90, sc: 8, t: 1700000000 } },
          { id: 67890, nm: 'Bus 02', pos: null },
        ],
      },
    });

    const units = await adapter.getAllUnits('test-sid');
    expect(units).toHaveLength(2);
    expect(units[0].id).toBe(12345);
    expect(units[0].name).toBe('Bus 01');
    expect(units[0].hasValidPosition()).toBe(true);
    expect(units[1].hasValidPosition()).toBe(false);
  });

  // Test Case 5: Returns empty array on getAllUnits failure
  it('should return empty array when Datatrack API call fails', async () => {
    mockAxiosInstance.get.mockRejectedValue(new Error('Network error'));

    const units = await adapter.getAllUnits('test-sid');
    expect(units).toEqual([]);
  });
});
