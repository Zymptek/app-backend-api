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

  it('should have withServiceRoleClient method', () => {
    expect(typeof service.withServiceRoleClient).toBe('function');
  });

  it('should have withUserClient method', () => {
    expect(typeof service.withUserClient).toBe('function');
  });

  it('should have withSupabaseUserClient method', () => {
    expect(typeof service.withSupabaseUserClient).toBe('function');
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

  describe('withUserClient', () => {
    it('should execute function within transaction with RLS context', async () => {
      const supabaseId = 'test-user-123';
      const mockResult = { id: '1', name: 'Test User' };
      
      // Mock PrismaClient and its methods
      const mockClient = {
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $transaction: jest.fn().mockImplementation(async (callback) => {
          const mockTx = {
            $executeRaw: jest.fn().mockResolvedValue(undefined),
            user: {
              findFirst: jest.fn().mockResolvedValue(mockResult),
            },
          };
          return await callback(mockTx);
        }),
      };

      // Mock PrismaClient constructor
      const originalPrismaClient = require('@prisma/client').PrismaClient;
      jest.spyOn(require('@prisma/client'), 'PrismaClient').mockImplementation(() => mockClient);

      const result = await service.withUserClient(supabaseId, async (client) => {
        return await client.user.findFirst({ where: { id: '1' } });
      });

      expect(mockClient.$connect).toHaveBeenCalled();
      expect(mockClient.$disconnect).toHaveBeenCalled();
      expect(mockClient.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockResult);

      // Verify that the transaction callback was called with the correct client
      const transactionCallback = mockClient.$transaction.mock.calls[0][0];
      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(undefined),
        user: { findFirst: jest.fn().mockResolvedValue(mockResult) },
      };
      
      await transactionCallback(mockTx);
      
      // Verify SET LOCAL was called with correct claims
      expect(mockTx.$executeRaw).toHaveBeenCalledWith(
        ['SET LOCAL "request.jwt.claims" = ', ''],
        JSON.stringify({ sub: supabaseId })
      );

      // Restore original PrismaClient
      jest.spyOn(require('@prisma/client'), 'PrismaClient').mockImplementation(originalPrismaClient);
    });

    it('should handle errors and still disconnect client', async () => {
      const supabaseId = 'test-user-123';
      const mockError = new Error('Database error');
      
      const mockClient = {
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $transaction: jest.fn().mockRejectedValue(mockError),
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      jest.spyOn(require('@prisma/client'), 'PrismaClient').mockImplementation(() => mockClient);

      await expect(
        service.withUserClient(supabaseId, async () => {
          throw mockError;
        })
      ).rejects.toThrow('Database error');

      expect(mockClient.$connect).toHaveBeenCalled();
      expect(mockClient.$disconnect).toHaveBeenCalled();

      jest.spyOn(require('@prisma/client'), 'PrismaClient').mockImplementation(originalPrismaClient);
    });
  });

  describe('withSupabaseUserClient', () => {
    it('should execute function within transaction with RLS context', async () => {
      const supabaseUserId = 'test-supabase-user-123';
      const mockResult = { id: '1', name: 'Test Supabase User' };
      
      const mockClient = {
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $transaction: jest.fn().mockImplementation(async (callback) => {
          const mockTx = {
            $executeRaw: jest.fn().mockResolvedValue(undefined),
            user: {
              findFirst: jest.fn().mockResolvedValue(mockResult),
            },
          };
          return await callback(mockTx);
        }),
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      jest.spyOn(require('@prisma/client'), 'PrismaClient').mockImplementation(() => mockClient);

      const result = await service.withSupabaseUserClient(supabaseUserId, async (client) => {
        return await client.user.findFirst({ where: { id: '1' } });
      });

      expect(mockClient.$connect).toHaveBeenCalled();
      expect(mockClient.$disconnect).toHaveBeenCalled();
      expect(mockClient.$transaction).toHaveBeenCalled();
      expect(result).toEqual(mockResult);

      // Verify that the transaction callback was called with the correct client
      const transactionCallback = mockClient.$transaction.mock.calls[0][0];
      const mockTx = {
        $executeRaw: jest.fn().mockResolvedValue(undefined),
        user: { findFirst: jest.fn().mockResolvedValue(mockResult) },
      };
      
      await transactionCallback(mockTx);
      
      // Verify SET LOCAL was called with correct claims
      expect(mockTx.$executeRaw).toHaveBeenCalledWith(
        ['SET LOCAL "request.jwt.claims" = ', ''],
        JSON.stringify({ sub: supabaseUserId })
      );

      jest.spyOn(require('@prisma/client'), 'PrismaClient').mockImplementation(originalPrismaClient);
    });

    it('should handle errors and still disconnect client', async () => {
      const supabaseUserId = 'test-supabase-user-123';
      const mockError = new Error('Database error');
      
      const mockClient = {
        $connect: jest.fn().mockResolvedValue(undefined),
        $disconnect: jest.fn().mockResolvedValue(undefined),
        $transaction: jest.fn().mockRejectedValue(mockError),
      };

      const originalPrismaClient = require('@prisma/client').PrismaClient;
      jest.spyOn(require('@prisma/client'), 'PrismaClient').mockImplementation(() => mockClient);

      await expect(
        service.withSupabaseUserClient(supabaseUserId, async () => {
          throw mockError;
        })
      ).rejects.toThrow('Database error');

      expect(mockClient.$connect).toHaveBeenCalled();
      expect(mockClient.$disconnect).toHaveBeenCalled();

      jest.spyOn(require('@prisma/client'), 'PrismaClient').mockImplementation(originalPrismaClient);
    });
  });
});
