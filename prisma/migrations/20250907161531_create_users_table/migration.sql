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
    "buyerProfile" JSONB,
    "sellerProfile" JSONB,
    "verificationData" JSONB,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "profileComplete" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_firebaseUid_key" ON "public"."users"("firebaseUid");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");
