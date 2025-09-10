import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    // Set up test environment variables
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';

    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.DATABASE_URL;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should have withServiceRoleClient method', () => {
    expect(typeof service.withServiceRoleClient).toBe('function');
  });

  it('should have withUserClient method', () => {
    expect(typeof service.withUserClient).toBe('function');
  });

  it('should have withSupabaseUserClient method', () => {
    expect(typeof service.withSupabaseUserClient).toBe('function');
  });

  it('should throw error when createSupabaseUserClient is called', () => {
    expect(() => {
      service.createSupabaseUserClient();
    }).toThrow(
      'createSupabaseUserClient is removed. Use prismaService.withSupabaseUserClient(id, fn) instead.',
    );
  });

  it('should connect on module init', async () => {
    // Mock the $connect method
    const mockConnect = jest.fn().mockResolvedValue(undefined);
    service.$connect = mockConnect;

    await service.onModuleInit();
    expect(mockConnect).toHaveBeenCalled();
  });

  it('should disconnect on module destroy', async () => {
    // Mock the $disconnect method
    const mockDisconnect = jest.fn().mockResolvedValue(undefined);
    service.$disconnect = mockDisconnect;

    await service.onModuleDestroy();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
