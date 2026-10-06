import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import {
  HydratedDocument,
} from 'mongoose';

export type CustomerDocument =
  HydratedDocument<Customer>;

export type CustomerDocumentType =
  | 'CC'
  | 'CE'
  | 'NIT'
  | 'PASSPORT'
  | 'OTHER';

export type CustomerStatus =
  | 'ACTIVE'
  | 'INACTIVE';

@Schema({
  timestamps: true,
})
export class Customer {
  @Prop({
    required: true,
    enum: [
      'CC',
      'CE',
      'NIT',
      'PASSPORT',
      'OTHER',
    ],
    trim: true,
  })
  documentType: CustomerDocumentType;

  @Prop({
    required: true,
    trim: true,
    maxlength: 30,
  })
  documentNumber: string;

  @Prop({
    required: true,
    trim: true,
    maxlength: 100,
  })
  firstName: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  lastName?: string;

  @Prop({
    trim: true,
    lowercase: true,
    maxlength: 150,
  })
  email?: string;

  @Prop({
    trim: true,
    maxlength: 30,
  })
  phone?: string;

  @Prop({
    trim: true,
    maxlength: 200,
  })
  address?: string;

  @Prop({
    trim: true,
    maxlength: 100,
  })
  city?: string;

  @Prop({
    required: true,
    enum: [
      'ACTIVE',
      'INACTIVE',
    ],
    default: 'ACTIVE',
  })
  status: CustomerStatus;
}

export const CustomerSchema =
  SchemaFactory.createForClass(
    Customer,
  );