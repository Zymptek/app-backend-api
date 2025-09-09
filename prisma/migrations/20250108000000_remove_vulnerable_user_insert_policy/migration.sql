-- Remove vulnerable client-side user registration policy
-- This policy allowed clients to insert users with arbitrary userType and status values
-- which could lead to privilege escalation (creating admin accounts)
DROP POLICY IF EXISTS "Allow user registration" ON "public"."users";

-- Note: User creation should now only be possible through:
-- 1. Service role operations (backend API)
-- 2. Admin operations (authenticated admin users)
-- 3. Secure backend endpoints that enforce proper validation and defaults
