-- CreateEnum
CREATE TYPE "public"."UserType" AS ENUM ('buyer', 'seller', 'admin');

-- CreateEnum
CREATE TYPE "public"."UserStatus" AS ENUM ('pending_verification', 'active', 'verified', 'rejected', 'suspended');

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "firebaseUid" TEXT,
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
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."admin_profiles" (
    "user_id" TEXT NOT NULL,
    "full_name" TEXT,
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "admin_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admin_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."seller_profiles" (
    "user_id" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verification_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "business_info" JSONB,
    "certifications" JSONB,
    "verification_documents" JSONB,
    "custom_fields" JSONB,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "public"."buyer_profiles" (
    "user_id" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verification_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "procurement_info" JSONB,
    "approval_workflow" JSONB,
    "preferred_suppliers" JSONB,
    "custom_fields" JSONB,

    CONSTRAINT "buyer_profiles_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "public"."users"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- AddForeignKey
ALTER TABLE "public"."admin_profiles" ADD CONSTRAINT "admin_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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
    FOR SELECT USING (auth.uid()::text = "firebaseUid");

CREATE POLICY "Users can update own profile" ON "public"."users"
    FOR UPDATE USING (auth.uid()::text = "firebaseUid")
    WITH CHECK (auth.uid()::text = "firebaseUid");

CREATE POLICY "Allow user registration" ON "public"."users"
    FOR INSERT WITH CHECK (auth.uid()::text = "firebaseUid");

-- Admins can view and manage all users
CREATE POLICY "Admins can view all users" ON "public"."users"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "firebaseUid" = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Admins can update user management fields" ON "public"."users"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "firebaseUid" = auth.uid()::text 
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
            AND "firebaseUid" = auth.uid()::text
        )
    );

CREATE POLICY "Admins can view all admin profiles" ON "public"."admin_profiles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "firebaseUid" = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Service role full access admin profiles" ON "public"."admin_profiles"
    FOR ALL USING (auth.role() = 'service_role');

-- Seller Profiles Policies
CREATE POLICY "Users can view own seller profile" ON "public"."seller_profiles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "id" = "user_id" 
            AND "firebaseUid" = auth.uid()::text
        )
    );

CREATE POLICY "Sellers can update own profile" ON "public"."seller_profiles"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "id" = "user_id" 
            AND "firebaseUid" = auth.uid()::text
            AND "userType" = 'seller'
        )
    );

CREATE POLICY "Admins can view all seller profiles" ON "public"."seller_profiles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "firebaseUid" = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Admins can update seller profiles" ON "public"."seller_profiles"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "firebaseUid" = auth.uid()::text 
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
            AND "firebaseUid" = auth.uid()::text
        )
    );

CREATE POLICY "Buyers can update own profile" ON "public"."buyer_profiles"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "id" = "user_id" 
            AND "firebaseUid" = auth.uid()::text
            AND "userType" = 'buyer'
        )
    );

CREATE POLICY "Admins can view all buyer profiles" ON "public"."buyer_profiles"
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "firebaseUid" = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Admins can update buyer profiles" ON "public"."buyer_profiles"
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM "public"."users" 
            WHERE "firebaseUid" = auth.uid()::text 
            AND "userType" = 'admin' 
            AND "status" = 'active'
        )
    );

CREATE POLICY "Service role full access buyer profiles" ON "public"."buyer_profiles"
    FOR ALL USING (auth.role() = 'service_role');