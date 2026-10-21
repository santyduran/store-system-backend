
import {
  Module,
} from '@nestjs/common';

import {
  MongooseModule,
} from '@nestjs/mongoose';

import {
  SupplierInvoice,
  SupplierInvoiceSchema,
} from './schemas/supplier-invoice.schema.js';

import {
  SupplierInvoiceItem,
  SupplierInvoiceItemSchema,
} from './schemas/supplier-invoice-item.schema.js';

import {
  SupplierInvoicesController,
} from './supplier-invoices.controller.js';

import {
  SupplierInvoicesService,
} from './supplier-invoices.service.js';

import {
  SupplierInvoiceAttachmentService,
} from './supplier-invoice-attachment.service.js';

import {
  Provider,
  ProviderSchema,
} from '../providers/schemas/provider.schema.js';

import {
  Product,
  ProductSchema,
} from '../products/schemas/product.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SupplierInvoice.name,
        schema: SupplierInvoiceSchema,
      },
      {
        name: SupplierInvoiceItem.name,
        schema: SupplierInvoiceItemSchema,
      },
      {
        name: Provider.name,
        schema: ProviderSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],
  controllers: [
    SupplierInvoicesController,
  ],
  providers: [
    SupplierInvoicesService,
    SupplierInvoiceAttachmentService,
  ],
  exports: [
    SupplierInvoicesService,
    SupplierInvoiceAttachmentService,
  ],
})
export class SupplierInvoicesModule {}
