import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({
    required: true,
    enum: ['ADMIN', 'CASHIER'],
    default: 'CASHIER',
  })
  role: string;

  @Prop({
    required: true,
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'ACTIVE',
  })
  status: string;

  @Prop({
    required: false,
    type: String,
    default: null,
  })
  passwordResetToken: string | null;

  @Prop({
    required: false,
    type: Date,
    default: null,
  })
  passwordResetExpires: Date | null;
}

export const UserSchema = SchemaFactory.createForClass(User);