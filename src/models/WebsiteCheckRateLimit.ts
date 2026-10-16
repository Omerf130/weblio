import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const websiteCheckRateLimitSchema = new Schema(
  {
    clientKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 128,
      unique: true,
    },
    hourBucket: {
      type: String,
      required: true,
      trim: true,
      maxlength: 16,
    },
    hourCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    dayBucket: {
      type: String,
      required: true,
      trim: true,
      maxlength: 16,
    },
    dayCount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  {
    timestamps: true,
    collection: "website_check_rate_limits",
  }
);

export type WebsiteCheckRateLimitDocument = InferSchemaType<typeof websiteCheckRateLimitSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type WebsiteCheckRateLimitModel = Model<WebsiteCheckRateLimitDocument>;

export const WebsiteCheckRateLimit =
  (mongoose.models.WebsiteCheckRateLimit as WebsiteCheckRateLimitModel | undefined) ??
  mongoose.model<WebsiteCheckRateLimitDocument>(
    "WebsiteCheckRateLimit",
    websiteCheckRateLimitSchema
  );
