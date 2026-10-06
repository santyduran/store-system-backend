import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
  Types,
} from 'mongoose';

export type CreditNoteDocument =
  HydratedDocument<CreditNote>;

export type CreditNoteStatus =
  | 'DRAFT'
  | 'GENERATED'
  | 'CANCELLED';

@Schema({
  timestamps: true,
})
export class CreditNote {
  @Prop({
    type: Types.ObjectId,
    ref: 'Invoice',
    required: true,
  })
  invoiceId: Types.ObjectId;

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  creditNoteNumber: string;

  @Prop({
    required: true,
    trim: true,
    default: 'NC',
  })
  prefix: string;

  @Prop({
    required: true,
  })
  issueDate: Date;

  @Prop({
    required: true,
    trim: true,
    maxlength: 500,
  })
  reason: string;

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
  taxTotal: number;

  @Prop({
    required: true,
    min: 0,
  })
  total: number;

  @Prop({
    required: true,
    enum: [
      'DRAFT',
      'GENERATED',
      'CANCELLED',
    ],
    default: 'DRAFT',
  })
  status: CreditNoteStatus;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  createdBy: Types.ObjectId;

  @Prop()
  cancelledAt?: Date;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  cancelledBy?: Types.ObjectId;

  @Prop({
    trim: true,
    maxlength: 500,
  })
  cancellationReason?: string;
}

export const CreditNoteSchema =
  SchemaFactory.createForClass(
    CreditNote,
  );