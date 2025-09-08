import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { PrismaService } from '../prisma/prisma.service';

describe('AdminModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      providers: [
        {
          provide: PrismaService,
          useValue: {
            user: {
              count: jest.fn(),
            },
          },
        },
        AdminController,
      ],
    }).compile();
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide AdminController', () => {
    const adminController = module.get<AdminController>(AdminController);
    expect(adminController).toBeDefined();
  });
});
