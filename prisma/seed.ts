import { PrismaClient, UserType, UserStatus } from '@prisma/client';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.development' });

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Create Supabase admin client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function main() {
  try {
    console.log('🌱 Seeding admin user...');
    
    // Validate required environment variables
    const requiredEnvVars = {
      ADMIN_EMAIL: process.env.ADMIN_EMAIL,
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
      ADMIN_FIRST_NAME: process.env.ADMIN_FIRST_NAME,
      ADMIN_LAST_NAME: process.env.ADMIN_LAST_NAME,
      ADMIN_COMPANY: process.env.ADMIN_COMPANY,
      ADMIN_COUNTRY: process.env.ADMIN_COUNTRY,
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
    };

    const missingVars = Object.entries(requiredEnvVars)
      .filter(([key, value]) => !value)
      .map(([key]) => key);

    if (missingVars.length > 0) {
      console.error('❌ Missing required environment variables:');
      missingVars.forEach(varName => console.error(`   - ${varName}`));
      console.error('\n📝 Please set all required environment variables in your .env.development file');
      console.error('   Example:');
      console.error('   ADMIN_EMAIL="admin@zymptek.com"');
      console.error('   ADMIN_PASSWORD="your-secure-password"');
      console.error('   ADMIN_FIRST_NAME="Admin"');
      console.error('   ADMIN_LAST_NAME="User"');
      console.error('   ADMIN_COMPANY="Zymptek Inc"');
      console.error('   ADMIN_COUNTRY="US"');
      console.error('   SUPABASE_URL="https://your-project.supabase.co"');
      console.error('   SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"');
      console.error('   DATABASE_URL="postgresql://..."');
      process.exit(1);
    }

    // Get admin credentials from environment variables (now guaranteed to exist)
    const adminEmail = process.env.ADMIN_EMAIL!;
    const adminPassword = process.env.ADMIN_PASSWORD!;
    const adminFirstName = process.env.ADMIN_FIRST_NAME!;
    const adminLastName = process.env.ADMIN_LAST_NAME!;
    const adminCompany = process.env.ADMIN_COMPANY!;
    const adminCountry = process.env.ADMIN_COUNTRY!;

    console.log('📧 Admin Email: [REDACTED]');
    console.log('🏢 Admin Company:', adminCompany);
    
    // Add small delay to avoid prepared statement conflicts
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ Starting database operations...');

    // Check if admin user already exists
    const existingAdmin = await prisma.user.findFirst({
      where: {
        email: adminEmail,
        userType: UserType.admin,
      },
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists: [REDACTED]');
      console.log('🔑 Supabase ID: [REDACTED]');
      return;
    }

    console.log('🚀 Creating admin user in Supabase Auth...');
    
    // Create user in Supabase Auth first
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
      user_metadata: {
        userType: 'admin',
        fullName: `${adminFirstName} ${adminLastName}`
      }
    });

    if (authError) {
      console.error('❌ Error creating user in Supabase Auth:', authError);
      throw authError;
    }

    console.log('✅ User created in Supabase Auth:', authData.user?.id);

    // Create admin user in database with real Supabase ID
    let adminUser;
    try {
      adminUser = await prisma.user.create({
        data: {
          supabaseId: authData.user!.id, // Real Supabase UID
          email: adminEmail,
          firstName: adminFirstName,
          lastName: adminLastName,
          userType: UserType.admin,
          status: UserStatus.active,
          emailVerified: true,
          profileComplete: true,
          companyName: adminCompany,
          country: adminCountry,
          verificationData: {},
          adminProfile: {
            create: {
              fullName: `${adminFirstName} ${adminLastName}`,
              permissions: ['read', 'write', 'admin'],
              isActive: true,
              adminNotes: 'System administrator account created via seed',
            },
          },
        },
        include: {
          adminProfile: true,
        },
      });
    } catch (dbErr) {
      // rollback Supabase user to keep systems consistent
      await supabase.auth.admin.deleteUser(authData.user!.id).catch(() => undefined);
      throw dbErr;
    }

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: [REDACTED]');
    console.log('🔑 Password: [REDACTED]');
    console.log('🆔 Database ID:', adminUser.id);
    console.log('🔑 Supabase ID: [REDACTED]');
    console.log('👤 Admin Profile: [REDACTED]');

    console.log('\n🎉 Admin user setup complete!');
    console.log('📧 Email: [REDACTED]');
    console.log('🔑 Password: [REDACTED]');
    console.log('✅ Ready for authentication testing!');

  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('❌ Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
      console.log('✅ Database connection closed');
    } catch (error) {
      console.error('❌ Error closing database connection:', error);
    }
  });
