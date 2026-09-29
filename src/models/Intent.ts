import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const intentSchema = new Schema(
  {
    provider: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 40,
    },
    externalId: {
      type: String,
      required: false,
      trim: true,
      maxlength: 256,
    },
    dedupeKey: {
      type: String,
      required: true,
      trim: true,
      maxlength: 320,
    },
    sourceType: {
      type: String,
      enum: ["search_result", "post", "comment", "page", "manual"],
      required: false,
    },
    sourcePlatform: {
      type: String,
      required: false,
      trim: true,
      maxlength: 80,
    },
    sourceUrl: {
      type: String,
      required: false,
      trim: true,
      maxlength: 2048,
    },
    title: {
      type: String,
      required: false,
      trim: true,
      maxlength: 300,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxlength: 10_000,
    },
    authorDisplayName: {
      type: String,
      required: false,
      trim: true,
      maxlength: 120,
    },
    publishedAt: {
      type: Date,
      required: false,
    },
    discoveredAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    lastSeenAt: {
      type: Date,
      required: true,
      default: () => new Date(),
    },
    discoveryCount: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    classification: {
      type: String,
      enum: ["unclassified", "explicitNeed", "possibleNeed", "irrelevant"],
      required: true,
      default: "unclassified",
    },
    classificationReason: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    classifiedAt: {
      type: Date,
      required: false,
    },
    classifierVersion: {
      type: String,
      required: false,
      trim: true,
      maxlength: 64,
    },
    status: {
      type: String,
      enum: ["new", "dismissed", "saved"],
      required: true,
      default: "new",
    },
    opportunityId: {
      type: Schema.Types.ObjectId,
      ref: "Opportunity",
      required: false,
    },
    convertedAt: {
      type: Date,
      required: false,
    },
    rawMetadata: {
      type: Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "intents",
  }
);

intentSchema.index({ dedupeKey: 1 }, { unique: true });
intentSchema.index({ status: 1, classification: 1, discoveredAt: -1 });
intentSchema.index({ provider: 1, discoveredAt: -1 });
intentSchema.index({ opportunityId: 1 }, { unique: true, sparse: true });

export type IntentDocument = InferSchemaType<typeof intentSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type IntentModel = Model<IntentDocument>;

export const Intent =
  (mongoose.models.Intent as IntentModel | undefined) ??
  mongoose.model<IntentDocument>("Intent", intentSchema);
