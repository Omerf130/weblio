import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const categoryScoresSchema = new Schema(
  {
    performance: { type: Number, required: false, default: null, min: 0, max: 100 },
    seo: { type: Number, required: false, default: null, min: 0, max: 100 },
    accessibility: { type: Number, required: false, default: null, min: 0, max: 100 },
    ux: { type: Number, required: false, default: null, min: 0, max: 100 },
    overall: { type: Number, required: false, default: null, min: 0, max: 100 },
  },
  { _id: false }
);

const scoreMetaSchema = new Schema(
  {
    availableCategories: {
      type: [String],
      required: false,
      default: undefined,
    },
    weightsUsed: {
      type: Schema.Types.Mixed,
      required: false,
      default: undefined,
    },
    lighthouseVersion: { type: String, required: false, trim: true, maxlength: 32 },
    primaryStrategy: {
      type: String,
      enum: ["mobile", "desktop"],
      required: false,
      default: "mobile",
    },
    missingLighthouseCategories: {
      type: [String],
      required: false,
      default: undefined,
    },
  },
  { _id: false }
);

const findingSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 128 },
    auditId: { type: String, required: false, trim: true, maxlength: 128 },
    status: {
      type: String,
      enum: ["positive", "warning", "neutral", "failed"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 400 },
    summary: { type: String, required: true, trim: true, maxlength: 2000 },
    details: { type: String, required: false, trim: true, maxlength: 8000 },
    score: { type: Number, required: false, default: null, min: 0, max: 1 },
    displayValue: { type: String, required: false, trim: true, maxlength: 256 },
    source: { type: String, enum: ["lighthouse"], required: false },
    localeKey: { type: String, required: false, trim: true, maxlength: 128 },
  },
  { _id: false }
);

const recommendationSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 128 },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      required: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 400 },
    summary: { type: String, required: true, trim: true, maxlength: 2000 },
    details: { type: String, required: false, trim: true, maxlength: 8000 },
    auditId: { type: String, required: false, trim: true, maxlength: 128 },
    source: { type: String, enum: ["lighthouse"], required: false },
    localeKey: { type: String, required: false, trim: true, maxlength: 128 },
  },
  { _id: false }
);

const labMetricSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 128 },
    title: { type: String, required: true, trim: true, maxlength: 256 },
    numericValue: { type: Number, required: false, default: null },
    displayValue: { type: String, required: false, trim: true, maxlength: 128 },
    score: { type: Number, required: false, default: null, min: 0, max: 1 },
  },
  { _id: false }
);

const labMetricsSchema = new Schema(
  {
    strategy: { type: String, enum: ["mobile"], required: true, default: "mobile" },
    metrics: { type: [labMetricSchema], required: true, default: () => [] },
    finalUrl: { type: String, required: false, trim: true, maxlength: 2048 },
    fetchTime: { type: String, required: false, trim: true, maxlength: 64 },
  },
  { _id: false }
);

const runErrorSchema = new Schema(
  {
    code: { type: String, required: true, trim: true, maxlength: 64 },
    messagePublic: { type: String, required: true, trim: true, maxlength: 500 },
  },
  { _id: false }
);

const clientMetaSchema = new Schema(
  {
    ipHash: { type: String, required: false, trim: true, maxlength: 128 },
    userAgent: { type: String, required: false, trim: true, maxlength: 512 },
  },
  { _id: false }
);

const aiRecommendationSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 128 },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    explanation: { type: String, required: true, trim: true, maxlength: 900 },
    action: { type: String, required: true, trim: true, maxlength: 600 },
    auditIds: { type: [String], required: true, default: [] },
    optionalMetric: { type: String, required: false, trim: true, maxlength: 128 },
  },
  { _id: false }
);

const aiInsightsSchema = new Schema(
  {
    status: {
      type: String,
      enum: ["pending", "generating", "completed", "unavailable"],
      required: true,
    },
    source: { type: String, enum: ["openai", "fallback"], required: false },
    recommendations: { type: [aiRecommendationSchema], required: true, default: () => [] },
    positiveSummary: { type: String, required: false, trim: true, maxlength: 600 },
    updatedAt: { type: Date, required: false },
  },
  { _id: false }
);

const cruxMetricSchema = new Schema(
  {
    id: { type: String, required: true, trim: true, maxlength: 128 },
    percentile: { type: Number, required: false, default: null },
    category: { type: String, required: false, trim: true, maxlength: 32 },
  },
  { _id: false }
);

const fieldDataSchema = new Schema(
  {
    available: { type: Boolean, required: true, default: false },
    origin: { type: String, required: false, trim: true, maxlength: 512 },
    metrics: { type: [cruxMetricSchema], required: false, default: undefined },
    payload: { type: Schema.Types.Mixed, required: false, default: undefined },
  },
  { _id: false }
);

const websiteAnalysisRunSchema = new Schema(
  {
    urlNormalized: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    urlHash: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
    },
    /** Set while queued/running — unique lock per URL to prevent duplicate PSI runs. */
    activeUrlHash: {
      type: String,
      required: false,
      trim: true,
      maxlength: 64,
      default: undefined,
    },
    status: {
      type: String,
      enum: ["queued", "running", "completed", "partial", "failed"],
      required: true,
      default: "queued",
    },
    phase: {
      type: String,
      enum: ["queued", "psi_mobile", "psi_desktop", "scoring", "done"],
      required: true,
      default: "queued",
    },
    scores: {
      type: categoryScoresSchema,
      required: true,
      default: () => ({
        performance: null,
        seo: null,
        accessibility: null,
        ux: null,
        overall: null,
      }),
    },
    scoreMeta: { type: scoreMetaSchema, required: false, default: undefined },
    findings: {
      type: [findingSchema],
      required: false,
      default: () => [],
    },
    recommendations: {
      type: [recommendationSchema],
      required: false,
      default: () => [],
    },
    fieldData: { type: fieldDataSchema, required: false, default: undefined },
    labMetrics: { type: labMetricsSchema, required: false, default: undefined },
    error: { type: runErrorSchema, required: false, default: undefined },
    cacheHit: { type: Boolean, required: true, default: false },
    analysisVersion: { type: Number, required: false, min: 1, max: 99 },
    leadId: {
      type: Schema.Types.ObjectId,
      ref: "Lead",
      required: false,
      default: undefined,
    },
    clientMeta: { type: clientMetaSchema, required: false, default: undefined },
    aiInsights: { type: aiInsightsSchema, required: false, default: undefined },
    startedAt: { type: Date, required: false },
    completedAt: { type: Date, required: false },
  },
  {
    timestamps: true,
    collection: "website_analysis_runs",
  }
);

websiteAnalysisRunSchema.index(
  { activeUrlHash: 1 },
  {
    unique: true,
    partialFilterExpression: { activeUrlHash: { $type: "string" } },
  }
);
websiteAnalysisRunSchema.index({ urlHash: 1, status: 1, completedAt: -1 });
websiteAnalysisRunSchema.index({ status: 1, createdAt: -1 });
websiteAnalysisRunSchema.index({ createdAt: -1 });
websiteAnalysisRunSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);

export type WebsiteAnalysisRunDocument = InferSchemaType<typeof websiteAnalysisRunSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type WebsiteAnalysisRunModel = Model<WebsiteAnalysisRunDocument>;

export const WebsiteAnalysisRun =
  (mongoose.models.WebsiteAnalysisRun as WebsiteAnalysisRunModel | undefined) ??
  mongoose.model<WebsiteAnalysisRunDocument>("WebsiteAnalysisRun", websiteAnalysisRunSchema);
