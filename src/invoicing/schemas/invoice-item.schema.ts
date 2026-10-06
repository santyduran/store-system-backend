import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type InvoiceItemDocument =
  HydratedDocument<InvoiceItem>;

@Schema({
  timestamps: true,
})
export class InvoiceItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Invoice',
    required: true,
  })
  invoiceId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
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
  unitPrice: number;

  @Prop({
    required: true,
    min: 0,
  })
  subtotal: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  taxRate: number;

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  taxAmount: number;

  @Prop({
    required: true,
    min: 0,
  })
  total: number;
}

export const InvoiceItemSchema =
  SchemaFactory.createForClass(
    InvoiceItem,
  );