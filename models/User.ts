import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  password: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
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

if (mongoose.models.User) {
  UserModel = mongoose.models.User;
} else {
  UserModel = mongoose.model<IUser>('User', UserSchema);
}

export default UserModel;

