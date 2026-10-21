import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

import {
  Product,
  ProductSchema,
} from './schemas/product.schema.js';

import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema.js';

import {
  Provider,
  ProviderSchema,
} from '../providers/schemas/provider.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
      {
        name: Category.name,
        schema: CategorySchema,
      },
      {
        name: Provider.name,
        schema: ProviderSchema,
      },
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}