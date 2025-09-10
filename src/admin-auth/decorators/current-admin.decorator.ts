import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  User,
  AdminProfile,
  SellerProfile,
  BuyerProfile,
} from '@prisma/client';

export interface AdminUser extends User {
  supabaseUser?: any; // Supabase user object
  adminProfile?: AdminProfile | null;
  sellerProfile?: SellerProfile | null;
  buyerProfile?: BuyerProfile | null;
}

export const CurrentAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AdminUser => {
    const request = ctx.switchToHttp().getRequest() as { admin: AdminUser };
    return request.admin;
  },
);
