import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const adminUserSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ["admin"],
      default: "admin",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
    lastLoginAt: {
      type: Date,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "adminusers",
  }
);

export type AdminUserDocument = InferSchemaType<typeof adminUserSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type AdminUserModel = Model<AdminUserDocument>;

export const AdminUser =
  (mongoose.models.AdminUser as AdminUserModel | undefined) ??
  mongoose.model<AdminUserDocument>("AdminUser", adminUserSchema);
