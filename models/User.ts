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

// Lazy initialization - only create model when accessed (not during build time)
// This prevents build-time evaluation issues with mongoose Document scope
let _userModel: mongoose.Model<IUser> | null = null;

function getUserModel(): mongoose.Model<IUser> {
  if (_userModel) {
    return _userModel;
  }
  if (mongoose.models && mongoose.models.User) {
    _userModel = mongoose.models.User as mongoose.Model<IUser>;
    return _userModel;
  }
  _userModel = mongoose.model<IUser>('User', UserSchema);
  return _userModel;
}

// Export a Proxy that lazily creates the model on first access
export default new Proxy({} as mongoose.Model<IUser>, {
  get(_target, prop) {
    const model = getUserModel();
    const value = (model as any)[prop];
    if (typeof value === 'function') {
      return value.bind(model);
    }
    return value;
  }
});

