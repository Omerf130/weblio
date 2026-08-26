import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const qualificationAnswerSchema = new Schema(
  {
    key: {
      type: String,
      required: true,
      trim: true,
    },
    question: {
      type: String,
      required: true,
      trim: true,
    },
    answer: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const qualificationSchema = new Schema(
  {
    answers: {
      type: [qualificationAnswerSchema],
      default: [],
    },
    completedAt: {
      type: Date,
      required: false,
    },
  },
  { _id: false }
);

const leadSchema = new Schema(
  {
    leadNumber: {
      type: Number,
      required: true,
      unique: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    message: {
      type: String,
      required: false,
      trim: true,
    },
    source: {
      type: String,
      enum: ["website", "landingPage"],
      required: true,
    },
    sourcePage: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["new", "contacted", "inProgress", "closed", "archived"],
      default: "new",
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
      required: true,
    },
    internalNotes: {
      type: String,
      default: "",
      trim: true,
    },
    campaign: {
      type: String,
      required: false,
      trim: true,
    },
    lastContactAt: {
      type: Date,
      required: false,
    },
    utm_source: {
      type: String,
      required: false,
      trim: true,
    },
    utm_medium: {
      type: String,
      required: false,
      trim: true,
    },
    utm_campaign: {
      type: String,
      required: false,
      trim: true,
    },
    utm_content: {
      type: String,
      required: false,
      trim: true,
    },
    clientId: {
      type: Schema.Types.ObjectId,
      required: false,
      sparse: true,
    },
    qualification: {
      type: qualificationSchema,
      required: false,
    },
    qualificationStatus: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
      required: true,
    },
  },
  {
    timestamps: true,
    collection: "leads",
  }
);

leadSchema.index({ createdAt: -1 });
leadSchema.index({ source: 1, createdAt: -1 });
leadSchema.index({ isRead: 1 });

export type LeadDocument = InferSchemaType<typeof leadSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type LeadModel = Model<LeadDocument>;

export const Lead =
  (mongoose.models.Lead as LeadModel | undefined) ??
  mongoose.model<LeadDocument>("Lead", leadSchema);
