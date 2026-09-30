import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { CashRegisterController } from './cash-register.controller.js';
import { CashRegisterService } from './cash-register.service.js';

import {
  CashRegister,
  CashRegisterSchema,
} from './schemas/cash-register.schema.js';

import {
  CashMovement,
  CashMovementSchema,
} from './schemas/cash-movement.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: CashRegister.name,
        schema: CashRegisterSchema,
      },
      {
        name: CashMovement.name,
        schema: CashMovementSchema,
      },
    ]),
  ],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
  exports: [CashRegisterService],
})
export class CashRegisterModule {}