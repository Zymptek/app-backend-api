import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { SupabaseService } from './supabase/supabase.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly supabaseService: SupabaseService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health/supabase')
  async checkSupabaseHealth() {
    try {
      const client = this.supabaseService.getClient();
      // Simple health check - just verify the client is created
      return {
        status: 'ok',
        message: 'Supabase client initialized successfully',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'error',
        message: 'Supabase client initialization failed',
        error: error.message,
        timestamp: new Date().toISOString(),
      };
    }
  }
}
