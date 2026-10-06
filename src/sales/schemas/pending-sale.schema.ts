import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type PendingSaleDocument =
  HydratedDocument<PendingSale>;

@Schema({
  _id: false,
})
export class PendingSaleItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
    required: true,
  })
  productId: Types.ObjectId;

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
    max: 100,
    default: 0,
  })
  taxRate: number;
}

export const PendingSaleItemSchema =
  SchemaFactory.createForClass(
    PendingSaleItem,
  );

@Schema({
  timestamps: true,
})
export class PendingSale {
  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  pendingNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  userId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Customer',
  })
  customerId?: Types.ObjectId;

  @Prop({
    type: [
      PendingSaleItemSchema,
    ],
    required: true,
    default: [],
  })
  items: PendingSaleItem[];

  @Prop({
    required: true,
    min: 0,
    default: 0,
  })
  discount: number;

  @Prop({
    required: true,
    enum: [
      'PENDING',
      'COMPLETED',
      'CANCELLED',
    ],
    default: 'PENDING',
  })
  status: string;
}

export const PendingSaleSchema =
  SchemaFactory.createForClass(
    PendingSale,
  );