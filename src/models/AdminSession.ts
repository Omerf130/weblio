import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const adminSessionSchema = new Schema(
  {
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    adminUserId: {
      type: Schema.Types.ObjectId,
      ref: "AdminUser",
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  {
    timestamps: true,
    collection: "adminsessions",
  }
);

export type AdminSessionDocument = InferSchemaType<typeof adminSessionSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type AdminSessionModel = Model<AdminSessionDocument>;

export const AdminSession =
  (mongoose.models.AdminSession as AdminSessionModel | undefined) ??
  mongoose.model<AdminSessionDocument>("AdminSession", adminSessionSchema);
