import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema()
export class User {
  @Prop({ required: true })
  username: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isAdmin: boolean;

  @Prop({ default: Date.now })
  createdAt: Date;

  toObject(): any {
    const obj = { ...this };
    delete obj.password;
    return obj;
  }
}

export const UserSchema = SchemaFactory.createForClass(User); 