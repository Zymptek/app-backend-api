import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from './supabase.module';
import { SupabaseService } from './supabase.service';

describe('SupabaseModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    // Set up test environment variables
    process.env.SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_ANON_KEY = 'test-anon-key';

    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
        }),
        SupabaseModule,
      ],
    }).compile();
  });

  afterEach(() => {
    // Clean up environment variables
    delete process.env.SUPABASE_URL;
    delete process.env.SUPABASE_ANON_KEY;
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide SupabaseService', () => {
    const supabaseService = module.get<SupabaseService>(SupabaseService);
    expect(supabaseService).toBeDefined();
  });

  it('should export SupabaseService', () => {
    const supabaseService = module.get<SupabaseService>(SupabaseService);
    expect(supabaseService).toBeDefined();
  });
});
