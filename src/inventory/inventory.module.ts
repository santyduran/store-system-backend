import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { InventoryController } from './inventory.controller.js';
import { InventoryService } from './inventory.service.js';

import {
  InventoryMovement,
  InventoryMovementSchema,
} from './schemas/inventory-movement.schema.js';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: InventoryMovement.name,
        schema: InventoryMovementSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [InventoryController],
  providers: [InventoryService],
  exports: [InventoryService],
})
export class InventoryModule {}