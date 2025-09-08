import { Module, Global } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { SupabaseModule } from '../supabase/supabase.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SupabaseAuthGuard } from './guards/supabase-auth.guard';
import { AdminRoleGuard } from './guards/admin-role.guard';

@Global()
@Module({
  imports: [SupabaseModule, PrismaModule],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, SupabaseAuthGuard, AdminRoleGuard],
  exports: [AdminAuthService, SupabaseAuthGuard, AdminRoleGuard],
})
export class AdminAuthModule {}
