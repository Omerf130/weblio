import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const profileErrorSummarySchema = new Schema(
  {
    profileId: { type: String, required: true, trim: true, maxlength: 16 },
    message: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false }
);

const policySnapshotSchema = new Schema(
  {
    policyVersion: { type: Number, required: true },
    timeRange: { type: String, required: true, trim: true, maxlength: 16 },
    excludedDomainCount: { type: Number, required: true, min: 0 },
    maxProfilesPerRun: { type: Number, required: true, min: 1 },
    maxTavilyRequestsPerRun: { type: Number, required: true, min: 1 },
    maxResultsPerQuery: { type: Number, required: true, min: 1 },
    maxCandidatesPerRun: { type: Number, required: true, min: 1 },
    maxClassificationsPerRun: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const profileSummarySchema = new Schema(
  {
    profileId: { type: String, required: true, trim: true, maxlength: 16 },
    query: { type: String, required: true, trim: true, maxlength: 400 },
    raw: { type: Number, required: true, min: 0 },
    afterFilter: { type: Number, required: true, min: 0 },
    uniqueAttributed: { type: Number, required: true, min: 0 },
    created: { type: Number, required: true, min: 0 },
    rediscovered: { type: Number, required: true, min: 0 },
    classified: { type: Number, required: true, min: 0 },
    explicitNeed: { type: Number, required: true, min: 0 },
    possibleNeed: { type: Number, required: true, min: 0 },
    irrelevant: { type: Number, required: true, min: 0 },
    unclassified: { type: Number, required: true, min: 0 },
    errors: { type: Number, required: true, min: 0 },
    rejectedSafety: { type: Number, required: false, min: 0 },
    rejectedLocale: { type: Number, required: false, min: 0 },
    rejectedCareers: { type: Number, required: false, min: 0 },
    skippedNotActionable: { type: Number, required: false, min: 0 },
    skippedDeferred: { type: Number, required: false, min: 0 },
  },
  { _id: false }
);

const catalogSnapshotSchema = new Schema(
  {
    catalogVersion: { type: Number, required: true },
    environment: { type: String, required: false, trim: true, maxlength: 32 },
    catalogKind: { type: String, required: false, trim: true, maxlength: 16 },
    profileCount: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const discoveryRunSchema = new Schema(
  {
    startedAt: { type: Date, required: true },
    completedAt: { type: Date, required: false },
    status: {
      type: String,
      enum: ["running", "completed", "partial", "failed", "skipped"],
      required: true,
    },
    triggeredBy: { type: String, required: true, trim: true, maxlength: 320 },
    triggerKind: {
      type: String,
      enum: ["manual", "scheduled"],
      required: false,
    },
    scheduleIsraelDateKey: {
      type: String,
      required: false,
      trim: true,
      maxlength: 10,
    },
    activeDiscoverySlot: {
      type: String,
      required: false,
      trim: true,
      maxlength: 16,
    },
    failureCategory: { type: String, required: false, trim: true, maxlength: 64 },

    profilesConfigured: { type: Number, required: false, min: 0 },
    profilesSelected: { type: Number, required: false, min: 0 },
    selectionShortfallTotal: { type: Number, required: false, min: 0 },
    selectedProfileIds: {
      type: [String],
      required: false,
      default: undefined,
    },
    profilesSearched: { type: Number, required: false, min: 0 },
    tavilyRequests: { type: Number, required: false, min: 0 },
    tavilyHttpAttempts: { type: Number, required: false, min: 0 },
    estimatedTavilyCredits: { type: Number, required: false, min: 0 },
    rawResults: { type: Number, required: false, min: 0 },

    filteredMapping: { type: Number, required: false, min: 0 },
    filteredValidation: { type: Number, required: false, min: 0 },
    filteredDomain: { type: Number, required: false, min: 0 },
    filteredDuplicateInRun: { type: Number, required: false, min: 0 },
    filteredQualitySafety: { type: Number, required: false, min: 0 },
    filteredQualityLocale: { type: Number, required: false, min: 0 },
    filteredQualityCareers: { type: Number, required: false, min: 0 },
    skippedNotActionable: { type: Number, required: false, min: 0 },
    skippedClassificationDeferred: { type: Number, required: false, min: 0 },

    uniqueCandidates: { type: Number, required: false, min: 0 },
    candidatesLimited: { type: Number, required: false, min: 0 },

    ingestReceived: { type: Number, required: false, min: 0 },
    created: { type: Number, required: false, min: 0 },
    rediscovered: { type: Number, required: false, min: 0 },
    classified: { type: Number, required: false, min: 0 },
    unclassified: { type: Number, required: false, min: 0 },
    failed: { type: Number, required: false, min: 0 },

    classificationLimit: { type: Number, required: false, min: 0 },
    classificationLimitReached: { type: Boolean, required: false },

    profileErrorCount: { type: Number, required: false, min: 0 },
    profileErrors: {
      type: [profileErrorSummarySchema],
      required: false,
      default: undefined,
    },
    profileSummaries: {
      type: [profileSummarySchema],
      required: false,
      default: undefined,
    },

    policy: { type: policySnapshotSchema, required: true },
    catalog: { type: catalogSnapshotSchema, required: true },
  },
  {
    timestamps: true,
    collection: "discovery_runs",
  }
);

discoveryRunSchema.index({ status: 1, startedAt: -1 });
discoveryRunSchema.index({ startedAt: -1 });
discoveryRunSchema.index({ completedAt: -1 });
discoveryRunSchema.index(
  { scheduleIsraelDateKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      triggerKind: "scheduled",
      scheduleIsraelDateKey: { $type: "string" },
    },
  }
);
discoveryRunSchema.index(
  { activeDiscoverySlot: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: "running",
      activeDiscoverySlot: "global",
    },
  }
);

export type DiscoveryRunDocument = InferSchemaType<typeof discoveryRunSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type DiscoveryRunModel = Model<DiscoveryRunDocument>;

export const DiscoveryRun =
  (mongoose.models.DiscoveryRun as DiscoveryRunModel | undefined) ??
  mongoose.model<DiscoveryRunDocument>("DiscoveryRun", discoveryRunSchema);
