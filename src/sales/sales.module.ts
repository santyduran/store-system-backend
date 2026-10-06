import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  SalesController,
} from './sales.controller.js';

import {
  SalesService,
} from './sales.service.js';

import {
  Sale,
  SaleSchema,
} from './schemas/sale.schema.js';

import {
  SaleItem,
  SaleItemSchema,
} from './schemas/sale-item.schema.js';

import {
  PendingSale,
  PendingSaleSchema,
} from './schemas/pending-sale.schema.js';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema.js';

import {
  Customer,
  CustomerSchema,
} from '../customers/schemas/customer.schema.js';

import {
  InventoryModule,
} from '../inventory/inventory.module.js';

import {
  CashRegisterModule,
} from '../cash-register/cash-register.module.js';

@Module({
  imports: [
    InventoryModule,
    CashRegisterModule,

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
        name: PendingSale.name,
        schema: PendingSaleSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),
  ],
  controllers: [
    SalesController,
  ],
  providers: [
    SalesService,
  ],
})
export class SalesModule {}