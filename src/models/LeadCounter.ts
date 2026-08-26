import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const LEAD_COUNTER_ID = "leadNumber";

const leadCounterSchema = new Schema(
  {
    _id: {
      type: String,
      required: true,
      default: LEAD_COUNTER_ID,
    },
    seq: {
      type: Number,
      required: true,
      default: 1000,
    },
  },
  {
    collection: "lead_counters",
  }
);

export type LeadCounterDocument = InferSchemaType<typeof leadCounterSchema> & {
  _id: string;
};

export type LeadCounterModel = Model<LeadCounterDocument>;

export const LeadCounter =
  (mongoose.models.LeadCounter as LeadCounterModel | undefined) ??
  mongoose.model<LeadCounterDocument>("LeadCounter", leadCounterSchema);

export const LEAD_NUMBER_COUNTER_ID = LEAD_COUNTER_ID;
