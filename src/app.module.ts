import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ProductsModule } from './products/products.module.js';
import { UsersModule } from './users/users.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { InventoryModule } from './inventory/inventory.module.js';
import { SalesModule } from './sales/sales.module.js';
import { CashRegisterModule } from './cash-register/cash-register.module.js';
import { ReportsModule } from './reports/reports.module.js';
import { ConfigurationModule } from './configuration/configuration.module.js';
import { CustomersModule } from './customers/customers.module.js';
import { InvoicingModule } from './invoicing/invoicing.module.js';
import { CreditNotesModule } from './credit-notes/credit-notes.module.js';
import { DebitNotesModule } from './debit-notes/debit-notes.module.js';

export const { ObserveModule, ObserveInstrument } =
  createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    ProductsModule,

    UsersModule,

    AuthModule,

    CategoriesModule,

    InventoryModule,

    SalesModule,

    CashRegisterModule,

    ReportsModule,

    ConfigurationModule,

    CustomersModule,

    InvoicingModule,

    CreditNotesModule,

    DebitNotesModule,
  ],
  controllers: [
    AppController,
  ],
  providers: [
    AppService,
  ],
})
export class AppModule {}