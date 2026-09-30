import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

import {
  Sale,
  SaleSchema,
} from '../sales/schemas/sale.schema.js';

import {
  SaleItem,
  SaleItemSchema,
} from '../sales/schemas/sale-item.schema.js';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Sale.name,
        schema: SaleSchema,
      },
      {
        name: SaleItem.name,
        schema: SaleItemSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}