/**
 * Dedicated MongoDB model for the main Weblio campaign landing page only (/build-your-dream).
 * Do NOT reuse for future Landing Builder — that will have its own separate model.
 */
import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

export const BUILD_YOUR_DREAM_LANDING_KEY = "build-your-dream";

const landingImageSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    url: { type: String, required: true, trim: true },
    storageKey: { type: String, required: false, trim: true },
    alt: { type: String, required: true, trim: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    priority: { type: Boolean, required: false },
  },
  { _id: false }
);

const landingCtaSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    action: {
      type: String,
      enum: ["scroll-to-form", "submit"],
      required: true,
    },
  },
  { _id: false }
);

const benefitItemSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    icon: {
      type: String,
      enum: ["sparkles", "zap", "rocket", "heart", "star"],
      required: true,
    },
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const processStepSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    stepNumber: { type: Number, required: true },
    title: { type: String, required: true, trim: true },
    text: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const faqItemSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    question: { type: String, required: true, trim: true },
    answer: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const qualificationQuestionSchema = new Schema(
  {
    id: { type: String, required: true, trim: true },
    type: { type: String, enum: ["text"], required: true },
    question: { type: String, required: true, trim: true },
    placeholder: { type: String, required: true, trim: true },
    required: { type: Boolean, required: true },
  },
  { _id: false }
);

const leadFormFieldSchema = new Schema(
  {
    label: { type: String, required: true, trim: true },
    placeholder: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const buildYourDreamLandingSchema = new Schema(
  {
    singletonKey: {
      type: String,
      required: true,
      unique: true,
      default: BUILD_YOUR_DREAM_LANDING_KEY,
    },
    meta: {
      title: { type: String, required: true, trim: true },
      description: { type: String, required: true, trim: true },
      ogImage: { type: landingImageSchema, required: false },
    },
    images: {
      hero: { type: landingImageSchema, required: true },
      splitPrimary: { type: landingImageSchema, required: true },
      splitSecondary: { type: landingImageSchema, required: true },
    },
    hero: {
      eyebrow: { type: String, required: true, trim: true },
      title: { type: String, required: true, trim: true },
      subtitle: { type: String, required: true, trim: true },
      ctaPrimary: { type: landingCtaSchema, required: true },
      ctaSecondary: { type: landingCtaSchema, required: true },
    },
    benefits: {
      title: { type: String, required: true, trim: true },
      subtitle: { type: String, required: true, trim: true },
      items: { type: [benefitItemSchema], required: true },
      cta: { type: landingCtaSchema, required: true },
    },
    splitPrimary: {
      id: { type: String, required: true, trim: true },
      title: { type: String, required: true, trim: true },
      text: { type: String, required: true, trim: true },
      cta: { type: landingCtaSchema, required: true },
    },
    process: {
      title: { type: String, required: true, trim: true },
      subtitle: { type: String, required: true, trim: true },
      steps: { type: [processStepSchema], required: true },
    },
    ctaBanner: {
      title: { type: String, required: true, trim: true },
      text: { type: String, required: true, trim: true },
      cta: { type: landingCtaSchema, required: true },
    },
    splitSecondary: {
      id: { type: String, required: true, trim: true },
      title: { type: String, required: true, trim: true },
      text: { type: String, required: true, trim: true },
      cta: { type: landingCtaSchema, required: true },
      reversed: { type: Boolean, default: true },
    },
    faq: {
      title: { type: String, required: true, trim: true },
      items: { type: [faqItemSchema], required: true },
    },
    leadForm: {
      title: { type: String, required: true, trim: true },
      subtitle: { type: String, required: true, trim: true },
      submitLabel: { type: String, required: true, trim: true },
      submittingLabel: { type: String, required: true, trim: true },
      fields: {
        name: { type: leadFormFieldSchema, required: true },
        phone: { type: leadFormFieldSchema, required: true },
        email: { type: leadFormFieldSchema, required: true },
        message: { type: leadFormFieldSchema, required: true },
      },
      errorMessage: { type: String, required: true, trim: true },
    },
    finalCta: {
      title: { type: String, required: true, trim: true },
      text: { type: String, required: true, trim: true },
      cta: { type: landingCtaSchema, required: true },
    },
    thankYou: {
      stepLabel: { type: String, required: true, trim: true },
      title: { type: String, required: true, trim: true },
      subtitle: { type: String, required: true, trim: true },
      nextStepsTitle: { type: String, required: true, trim: true },
      nextSteps: { type: [String], required: true },
      qualification: {
        title: { type: String, required: true, trim: true },
        subtitle: { type: String, required: true, trim: true },
        submitLabel: { type: String, required: true, trim: true },
        submittingLabel: { type: String, required: true, trim: true },
        questions: { type: [qualificationQuestionSchema], required: true },
      },
      completedTitle: { type: String, required: true, trim: true },
      completedText: { type: String, required: true, trim: true },
      errorMessage: { type: String, required: true, trim: true },
    },
  },
  {
    timestamps: true,
    collection: "build_your_dream_landing",
  }
);

export type BuildYourDreamLandingDocument = InferSchemaType<
  typeof buildYourDreamLandingSchema
> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type BuildYourDreamLandingModel = Model<BuildYourDreamLandingDocument>;

export const BuildYourDreamLanding =
  (mongoose.models.BuildYourDreamLanding as BuildYourDreamLandingModel | undefined) ??
  mongoose.model<BuildYourDreamLandingDocument>(
    "BuildYourDreamLanding",
    buildYourDreamLandingSchema
  );
