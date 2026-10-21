import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type SupplierInvoiceItemDocument =
  HydratedDocument<SupplierInvoiceItem>;

@Schema({
  timestamps: true,
})
export class SupplierInvoiceItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'SupplierInvoice',
    required: true,
  })
  supplierInvoiceId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
    maxlength: 200,
  })
  productName: string;

  @Prop({
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    required: true,
    min: 0,
  })
  unitCost: number;

  @Prop({
    required: true,
    min: 0,
    max: 100,
  })
  taxRate: number;

  @Prop({
    required: true,
    min: 0,
  })
  subtotal: number;

  @Prop({
    required: true,
    min: 0,
  })
  taxAmount: number;

  @Prop({
    required: true,
    min: 0,
  })
  total: number;
}

export const SupplierInvoiceItemSchema =
  SchemaFactory.createForClass(
    SupplierInvoiceItem,
  );