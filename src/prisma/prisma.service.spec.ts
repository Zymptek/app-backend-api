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

  it('should create service role client', () => {
    const serviceClient = service.createServiceRoleClient();
    expect(serviceClient).toBeDefined();
    expect(serviceClient).toHaveProperty('$connect');
    expect(serviceClient).toHaveProperty('$disconnect');
  });

  it('should create user client with RLS context', () => {
    const supabaseId = 'test-user-123';
    const userClient = service.createUserClient(supabaseId);
    expect(userClient).toBeDefined();
    expect(userClient).toHaveProperty('$connect');
    expect(userClient).toHaveProperty('$disconnect');
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
