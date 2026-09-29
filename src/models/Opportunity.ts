import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const opportunitySchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    businessName: {
      type: String,
      required: false,
      trim: true,
      maxlength: 200,
    },
    contactName: {
      type: String,
      required: false,
      trim: true,
      maxlength: 120,
    },
    phone: {
      type: String,
      required: false,
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      required: false,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    source: {
      type: String,
      enum: ["manual", "intent", "businessDiscovery", "referral", "other"],
      required: true,
    },
    classification: {
      type: String,
      enum: ["explicitNeed", "possibleNeed", "businessDiscovery"],
      required: true,
    },
    status: {
      type: String,
      enum: ["new", "researching", "contacted", "converted", "dismissed"],
      default: "new",
      required: true,
    },
    sourceUrl: {
      type: String,
      required: false,
      trim: true,
      maxlength: 2048,
    },
    sourcePlatform: {
      type: String,
      required: false,
      trim: true,
      maxlength: 80,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 2000,
    },
    relevanceNote: {
      type: String,
      required: false,
      trim: true,
      maxlength: 2000,
    },
    internalNotes: {
      type: String,
      default: "",
      trim: true,
      maxlength: 5000,
    },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: false,
    },
    convertedAt: {
      type: Date,
      required: false,
    },
    externalSourceId: {
      type: String,
      required: false,
      trim: true,
      maxlength: 256,
    },
    intentId: {
      type: Schema.Types.ObjectId,
      ref: "Intent",
      required: false,
    },
  },
  {
    timestamps: true,
    collection: "opportunities",
  }
);

opportunitySchema.index({ status: 1, createdAt: -1 });
opportunitySchema.index({ classification: 1, status: 1, createdAt: -1 });
opportunitySchema.index({ source: 1, createdAt: -1 });
opportunitySchema.index({ leadId: 1 }, { sparse: true });
opportunitySchema.index({ externalSourceId: 1 }, { sparse: true });
opportunitySchema.index({ intentId: 1 }, { unique: true, sparse: true });

export type OpportunityDocument = InferSchemaType<typeof opportunitySchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type OpportunityModel = Model<OpportunityDocument>;

export const Opportunity =
  (mongoose.models.Opportunity as OpportunityModel | undefined) ??
  mongoose.model<OpportunityDocument>("Opportunity", opportunitySchema);
