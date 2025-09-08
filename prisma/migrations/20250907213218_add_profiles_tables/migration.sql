-- Ensure pgcrypto for gen_random_uuid
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('buyer', 'seller', 'admin');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('pending_verification', 'active', 'verified', 'rejected', 'suspended');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "supabaseId" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "userType" "public"."UserType" NOT NULL,
    "status" "public"."UserStatus" NOT NULL DEFAULT 'pending_verification',
    "firstName" TEXT,
    "lastName" TEXT,
    "companyName" TEXT,
    "phone" TEXT,
    "country" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "verificationData" JSONB,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_profiles" (
    "user_id" UUID NOT NULL,
    "full_name" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."seller_profiles" (
    "user_id" UUID NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verification_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "business_info" JSONB,
    "certifications" JSONB,
    "verification_documents" JSONB,
    "custom_fields" JSONB,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."buyer_profiles" (
    "user_id" UUID NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" UUID,
    "verification_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "procurement_info" JSONB,
    "approval_workflow" JSONB,
    "preferred_suppliers" JSONB,
    "custom_fields" JSONB,

    CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_supabaseId_key" ON "public"."users"("supabaseId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"(lower("email"));

-- AddForeignKey
ALTER TABLE "public"."admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."admin_profiles" ADD CONSTRAINT "admin_profiles_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."buyer_profiles" ADD CONSTRAINT "buyer_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enable Row Level Security on all tables
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."admin_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."seller_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."buyer_profiles" ENABLE ROW LEVEL SECURITY;


-- Users Table Policies
-- Users can read/update their own data
CREATE POLICY "Users can view own profile" ON "public"."users"
    FOR SELECT USING (auth.uid()::text = "supabaseId"::text);

CREATE POLICY "Users can update own profile" ON "public"."users"
    FOR UPDATE USING (auth.uid()::text = "supabaseId"::text)
    WITH CHECK (auth.uid()::text = "supabaseId"::text);

CREATE POLICY "Allow user registration" ON "public"."users"
    FOR INSERT WITH CHECK (auth.uid()::text = "supabaseId"::text);

-- Admins can view and manage all users
CREATE POLICY "Admins can view all users" ON "public"."users"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "supabaseId"::text = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Admins can update user management fields" ON "public"."users"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "supabaseId"::text = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "supabaseId"::text = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

-- Service role full access (for backend operations)
CREATE POLICY "Service role full access users" ON "public"."users"
    FOR ALL USING (auth.role() = 'service_role');

-- Admin Profiles Policies
CREATE POLICY "Users can view own admin profile" ON "public"."admin_profiles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "id" = "user_id" 
            AND "supabaseId"::text = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view all admin profiles" ON "public"."admin_profiles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "supabaseId"::text = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Admins can update admin profiles" ON "public"."admin_profiles"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "supabaseId"::text = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Service role full access admin profiles" ON "public"."admin_profiles"
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Seller Profiles Policies
CREATE POLICY "Users can view own seller profile" ON "public"."seller_profiles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "id" = "user_id" 
            AND "supabaseId"::text = auth.uid()::text
        )
    );

CREATE POLICY "Sellers can update own profile" ON "public"."seller_profiles"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "id" = "user_id" 
            AND "supabaseId"::text = auth.uid()::text
            AND "userType" = 'seller'
        )
    );

CREATE POLICY "Admins can view all seller profiles" ON "public"."seller_profiles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "supabaseId"::text = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Admins can update seller profiles" ON "public"."seller_profiles"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "supabaseId"::text = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Service role full access seller profiles" ON "public"."seller_profiles"
    FOR ALL USING (auth.role() = 'service_role');

-- Buyer Profiles Policies  
CREATE POLICY "Users can view own buyer profile" ON "public"."buyer_profiles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "id" = "user_id" 
            AND "supabaseId"::text = auth.uid()::text
        )
    );

CREATE POLICY "Buyers can update own profile" ON "public"."buyer_profiles"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "id" = "user_id" 
            AND "supabaseId"::text = auth.uid()::text
            AND "userType" = 'buyer'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "id" = "user_id" 
            AND "supabaseId"::text = auth.uid()::text
            AND "userType" = 'buyer'
        )
    );

CREATE POLICY "Buyers can create own profile" ON "public"."buyer_profiles"
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "id" = "user_id" 
            AND "supabaseId"::text = auth.uid()::text
            AND "userType" = 'buyer'
        )
    );

CREATE POLICY "Admins can view all buyer profiles" ON "public"."buyer_profiles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "supabaseId"::text = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Admins can update buyer profiles" ON "public"."buyer_profiles"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "supabaseId"::text = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "supabaseId"::text = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Service role full access buyer profiles" ON "public"."buyer_profiles"
    FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Generic updatedAt trigger for camelCase tables
CREATE OR REPLACE FUNCTION public.set_updated_at_camel() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW."updatedAt" = now(); RETURN NEW; END $$;

-- Generic updatedAt trigger for snake_case tables
CREATE OR REPLACE FUNCTION public.set_updated_at_snake() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

-- Add updatedAt triggers for users table (camelCase)
CREATE TRIGGER set_users_updated_at
BEFORE UPDATE ON "public"."users"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_camel();

-- Add updatedAt triggers for profile tables (snake_case)
CREATE TRIGGER set_admin_profiles_updated_at
BEFORE UPDATE ON "public"."admin_profiles"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_snake();

CREATE TRIGGER set_seller_profiles_updated_at
BEFORE UPDATE ON "public"."seller_profiles"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_snake();

CREATE TRIGGER set_buyer_profiles_updated_at
BEFORE UPDATE ON "public"."buyer_profiles"
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_snake();