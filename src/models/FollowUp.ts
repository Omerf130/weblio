import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const followUpSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    note: {
      type: String,
      required: false,
      trim: true,
      maxlength: 2000,
    },
    dueAt: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
      required: true,
    },
    completedAt: {
      type: Date,
      required: false,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: false,
    },
    opportunityId: {
      type: Schema.Types.ObjectId,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "followups",
  }
);

followUpSchema.index({ status: 1, dueAt: 1 });
followUpSchema.index({ leadId: 1 }, { sparse: true });
followUpSchema.index({ opportunityId: 1 }, { sparse: true });
followUpSchema.index({ createdAt: -1 });

export type FollowUpDocument = InferSchemaType<typeof followUpSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type FollowUpModel = Model<FollowUpDocument>;

export const FollowUp =
  (mongoose.models.FollowUp as FollowUpModel | undefined) ??
  mongoose.model<FollowUpDocument>("FollowUp", followUpSchema);
