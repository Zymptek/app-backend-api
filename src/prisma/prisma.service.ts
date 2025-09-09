import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * Execute a function with a service role client that bypasses RLS
   * This should be used when you need to bypass RLS (admin operations)
   * The client is automatically connected and disconnected
   */
  async withServiceRoleClient<T>(
    fn: (client: PrismaClient) => Promise<T>,
  ): Promise<T> {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    try {
      await client.$connect();
      return await fn(client);
    } finally {
      await client.$disconnect();
    }
  }

  /**
   * Execute a function with a user client that has RLS context
   * This should be used for regular user operations
   * The client is automatically connected and disconnected
   */
  async withUserClient<T>(
    supabaseId: string,
    fn: (
      client: Omit<
        PrismaClient,
        '$on' | '$connect' | '$disconnect' | '$transaction' | '$extends'
      >,
    ) => Promise<T>,
  ): Promise<T> {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    try {
      await client.$connect();

      // Execute within a transaction to ensure SET LOCAL and query are in same transaction
      return await client.$transaction(async (tx) => {
        // Set the user context for RLS policies once per transaction
        const claims = JSON.stringify({
          role: 'authenticated',
          sub: supabaseId,
        });
        await tx.$executeRaw`SET LOCAL "request.jwt.claims" = ${claims}`;

        // Execute the function with the transaction client
        return await fn(tx);
      });
    } finally {
      await client.$disconnect();
    }
  }

  /**
   * Execute a function with a Supabase user client that has RLS context
   * This should be used for operations that need Supabase user context
   * The client is automatically connected and disconnected
   */
  async withSupabaseUserClient<T>(
    supabaseUserId: string,
    fn: (
      client: Omit<
        PrismaClient,
        '$on' | '$connect' | '$disconnect' | '$transaction' | '$extends'
      >,
    ) => Promise<T>,
  ): Promise<T> {
    const client = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
    });

    try {
      await client.$connect();

      // Execute within a transaction to ensure SET LOCAL and query are in same transaction
      return await client.$transaction(async (tx) => {
        // Set the Supabase user context for RLS policies once per transaction
        const claims = JSON.stringify({ sub: supabaseUserId });
        await tx.$executeRaw`SET LOCAL "request.jwt.claims" = ${claims}`;

        // Execute the function with the transaction client
        return await fn(tx);
      });
    } finally {
      await client.$disconnect();
    }
  }

  // Legacy methods for backward compatibility - these now use the new helpers internally
  /**
   * @deprecated Use withServiceRoleClient instead to prevent connection leaks
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
   * @deprecated Use withUserClient instead to prevent connection leaks
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
    return client.$extends({
      query: {
        $allModels: {
          async $allOperations({ args, query }) {
            // Set the user context for RLS policies
            const claims = JSON.stringify({ sub: supabaseId });
            await client.$executeRaw`SET LOCAL "request.jwt.claims" = ${claims}`;
            return query(args);
          },
        },
      },
    }) as unknown as PrismaClient;
  }

  /**
   * @deprecated Use withSupabaseUserClient instead to prevent connection leaks
   */
  createSupabaseUserClient(): never {
    throw new Error(
      'createSupabaseUserClient is removed. Use prismaService.withSupabaseUserClient(id, fn) instead.',
    );
  }

  async onModuleDestroy() {
    // Disconnect when module is destroyed
    await this.$disconnect();
  }
}
