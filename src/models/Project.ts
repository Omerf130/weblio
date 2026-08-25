import mongoose, { Schema, type InferSchemaType, type Model } from "mongoose";

const projectImageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    storageKey: {
      type: String,
      required: false,
      trim: true,
    },
    alt: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const projectSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subtitle: {
      type: String,
      default: "",
      trim: true,
    },
    homeTitle: {
      type: String,
      required: false,
      trim: true,
    },
    homeSubtitle: {
      type: String,
      required: false,
      trim: true,
    },
    image: {
      type: projectImageSchema,
      required: true,
    },
    projectUrl: {
      type: String,
      required: true,
      trim: true,
    },
    ctaLabel: {
      type: String,
      default: "Take me",
      trim: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      required: true,
    },
    showOnHome: {
      type: Boolean,
      default: false,
      required: true,
    },
    showOnProjectsPage: {
      type: Boolean,
      default: true,
      required: true,
    },
    homeOrder: {
      type: Number,
      default: 0,
      required: true,
    },
    projectsPageOrder: {
      type: Number,
      default: 0,
      required: true,
    },
    technologies: {
      type: [String],
      default: [],
    },
    seedKey: {
      type: String,
      required: false,
      trim: true,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: true,
    collection: "projects",
  }
);

projectSchema.index({ isPublished: 1, showOnHome: 1, homeOrder: 1 });
projectSchema.index({
  isPublished: 1,
  showOnProjectsPage: 1,
  projectsPageOrder: 1,
});

export type ProjectDocument = InferSchemaType<typeof projectSchema> & {
  _id: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export type ProjectModel = Model<ProjectDocument>;

export const Project =
  (mongoose.models.Project as ProjectModel | undefined) ??
  mongoose.model<ProjectDocument>("Project", projectSchema);
