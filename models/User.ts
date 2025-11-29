import mongoose, { Schema } from 'mongoose';
import type { Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  createdAt: Date;
}

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ensure model is only created once
let UserModel: mongoose.Model<IUser>;

try {
  if (mongoose.models && mongoose.models.User) {
    UserModel = mongoose.models.User as mongoose.Model<IUser>;
  } else {
    UserModel = mongoose.model<IUser>('User', UserSchema);
  }
} catch (error) {
  // Fallback for build-time evaluation issues
  UserModel = mongoose.model<IUser>('User', UserSchema);
}

export default UserModel;

