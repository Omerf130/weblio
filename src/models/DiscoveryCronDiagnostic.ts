import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";
import { DISCOVERY_CRON_DIAGNOSTIC_OUTCOMES } from "@/types/discovery-cron-diagnostic";

const discoveryCronDiagnosticSchema = new Schema(
  {
    invokedAt: { type: Date, required: true, index: true },
    outcome: {
      type: String,
      enum: DISCOVERY_CRON_DIAGNOSTIC_OUTCOMES,
      required: true,
    },
    httpStatus: { type: Number, required: true, min: 0, max: 599 },
    scheduleIsraelDateKey: {
      type: String,
      required: false,
      trim: true,
      maxlength: 10,
    },
    israelLocalTime: { type: String, required: true, trim: true, maxlength: 8 },
    vercelCronSchedule: {
      type: String,
      required: false,
      trim: true,
      maxlength: 64,
    },
    environment: { type: String, required: false, trim: true, maxlength: 32 },
    details: { type: String, required: false, trim: true, maxlength: 200 },
    discoveryRunId: { type: String, required: false, trim: true, maxlength: 64 },
  },
  { timestamps: true }
);

discoveryCronDiagnosticSchema.index({ invokedAt: -1 });

export type DiscoveryCronDiagnosticDocument = InferSchemaType<
  typeof discoveryCronDiagnosticSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const DiscoveryCronDiagnostic: Model<DiscoveryCronDiagnosticDocument> =
  (mongoose.models.DiscoveryCronDiagnostic as Model<DiscoveryCronDiagnosticDocument>) ??
  mongoose.model<DiscoveryCronDiagnosticDocument>(
    "DiscoveryCronDiagnostic",
    discoveryCronDiagnosticSchema
  );
