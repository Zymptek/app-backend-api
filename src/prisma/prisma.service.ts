import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Create a Prisma client instance with RLS context
   * This should be used when you need to bypass RLS (admin operations)
   */
  createServiceRoleClient(): PrismaClient {
    return new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });
  }

  /**
   * Create a Prisma client instance with user context for RLS
   * This should be used for regular user operations
   */
  createUserClient(supabaseId: string): PrismaClient {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Set the user context for RLS
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return client.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            // Set the user context for RLS policies
            await client.$executeRaw`SET LOCAL "request.jwt.claims" = '{"sub": "${supabaseId}"}'`;
            return query(args);
          },
        },
      },
    }) as any;
  }

  /**
   * Create a Prisma client instance with Supabase user context for RLS
   * This should be used for operations that need Supabase user context
   */
  createSupabaseUserClient(supabaseUserId: string): PrismaClient {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    // Set the Supabase user context for RLS
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return client.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            // Set the Supabase user context for RLS policies
            await client.$executeRaw`SET LOCAL "request.jwt.claims" = '{"sub": "${supabaseUserId}"}'`;
            return query(args);
          },
        },
      },
    }) as any;
  }

  async onModuleDestroy() {
    // Disconnect when module is destroyed
    await this.$disconnect();
  }
}
