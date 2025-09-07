import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SupabaseService } from './supabase.service';

describe('SupabaseService', () => {
  let service: SupabaseService;
  let configService: ConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SupabaseService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config = {
                SUPABASE_URL: 'https://test.supabase.co',
                SUPABASE_ANON_KEY: 'test-anon-key',
                SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<SupabaseService>(SupabaseService);
    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create Supabase client', () => {
    const client = service.getClient();
    expect(client).toBeDefined();
  });

  it('should create service role client', () => {
    const serviceClient = service.getServiceRoleClient();
    expect(serviceClient).toBeDefined();
  });
});
