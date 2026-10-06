import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  Invoice,
  InvoiceSchema,
} from './schemas/invoice.schema.js';

import {
  InvoiceItem,
  InvoiceItemSchema,
} from './schemas/invoice-item.schema.js';

import {
  InvoicesService,
} from './invoices.service.js';

import {
  InvoicePdfService,
} from './invoice-pdf.service.js';

import {
  InvoicingController,
} from './invoicing.controller.js';

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

import {
  Customer,
  CustomerSchema,
} from '../customers/schemas/customer.schema.js';

import {
  ConfigurationModule,
} from '../configuration/configuration.module.js';

import {
  MockElectronicInvoiceProvider,
} from './electronic-providers/mock-electronic-invoice.provider.js';

import {
  InvoiceProvider,
} from './electronic-providers/invoice-provider.interface.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Invoice.name,
        schema: InvoiceSchema,
      },
      {
        name: InvoiceItem.name,
        schema: InvoiceItemSchema,
      },
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
      {
        name: Customer.name,
        schema: CustomerSchema,
      },
    ]),

    ConfigurationModule,
  ],

  controllers: [
    InvoicingController,
  ],

  providers: [
    InvoicesService,

    InvoicePdfService,

    MockElectronicInvoiceProvider,

    {
      provide: 'INVOICE_PROVIDER',
      useExisting: MockElectronicInvoiceProvider,
    },
  ],

  exports: [
    InvoicesService,
    InvoicePdfService,
    'INVOICE_PROVIDER',
  ],
})
export class InvoicingModule {}