import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  Customer,
  CustomerSchema,
} from './schemas/customer.schema.js';

import {
  CustomersController,
} from './customers.controller.js';

import {
  CustomersService,
} from './customers.service.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),
  ],
  controllers: [
    CustomersController,
  ],
  providers: [
    CustomersService,
  ],
  exports: [
    CustomersService,
  ],
})
export class CustomersModule {}