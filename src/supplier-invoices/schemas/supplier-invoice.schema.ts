
import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type SupplierInvoiceDocument =
  HydratedDocument<SupplierInvoice>;

export type SupplierInvoiceStatus =
  | 'PENDING'
  | 'PAID'
  | 'OVERDUE'
  | 'CANCELLED';

export type SupplierInvoicePaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'TRANSFER';

@Schema({
  _id: false,
})
export class SupplierInvoiceAttachment {
  @Prop({
    trim: true,
    maxlength: 255,
  })
  fileName: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  mimeType: string;

  @Prop({
    trim: true,
  })
  fileUrl: string;

  @Prop({
    trim: true,
    maxlength: 255,
  })
  storedFileName: string;

  @Prop({
    min: 0,
  })
  fileSize: number;

  @Prop()
  uploadedAt: Date;
}

export const SupplierInvoiceAttachmentSchema =
  SchemaFactory.createForClass(
    SupplierInvoiceAttachment,
  );

@Schema({
  timestamps: true,
})
export class SupplierInvoice {
  @Prop({
    required: true,
    unique: true,
    trim: true,
    maxlength: 50,
  })
  invoiceNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Provider',
    required: true,
  })
  providerId: Types.ObjectId;

  @Prop({
    required: true,
  })
  issueDate: Date;

  @Prop()
  dueDate?: Date;

  @Prop({
    required: true,
    min: 0,
  })
  subtotal: number;

  @Prop({
    required: true,
    min: 0,
  })
  taxTotal: number;

  @Prop({
    required: true,
    min: 0,
  })
  total: number;

  @Prop({
    required: true,
    enum: [
      'PENDING',
      'PAID',
      'OVERDUE',
      'CANCELLED',
    ],
    default: 'PENDING',
  })
  status: SupplierInvoiceStatus;

  @Prop({
    enum: [
      'CASH',
      'CARD',
      'TRANSFER',
    ],
  })
  paymentMethod?: SupplierInvoicePaymentMethod;

  @Prop()
  paymentDate?: Date;

  @Prop({
    trim: true,
    maxlength: 1000,
  })
  observations?: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  supplierInvoiceNumber?: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  authorizationNumber?: string;

  @Prop({
    type: SupplierInvoiceAttachmentSchema,
    required: false,
    default: null,
  })
  attachment?: SupplierInvoiceAttachment | null;
}

export const SupplierInvoiceSchema =
  SchemaFactory.createForClass(
    SupplierInvoice,
  );
