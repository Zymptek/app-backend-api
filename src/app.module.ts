import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SupabaseModule } from './supabase/supabase.module';
import { PrismaModule } from './prisma/prisma.module';
import { AdminAuthModule } from './admin-auth/auth.module';
import { AdminModule } from './admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        process.env.VERCEL
          ? '.env.vercel'
          : `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
      expandVariables: true,
    }),
    SupabaseModule,
    PrismaModule,
    AdminAuthModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
