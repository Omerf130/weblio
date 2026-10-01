/** Strict JSON Schema for OpenAI Responses API — single text draft. */
export const MARKETING_CONTENT_JSON_SCHEMA = {
  type: "object",
  properties: {
    content: {
      type: "string",
      description: "Marketing draft text in Hebrew.",
    },
  },
  required: ["content"],
  additionalProperties: false,
} as const;

export const MARKETING_CONTENT_SCHEMA_NAME = "marketing_content_draft";

/** Website project copy — technologies are suggestions for admin review only. */
export const MARKETING_WEBSITE_CONTENT_JSON_SCHEMA = {
  type: "object",
  properties: {
    title: {
      type: "string",
      description: "Project title (כותרת) for site presentation.",
    },
    subtitle: {
      type: "string",
      description: "Project subtitle (תת-כותרת).",
    },
    description: {
      type: "string",
      description: "Short description (תיאור קצר), max ~300 chars.",
    },
    homeTitle: {
      type: "string",
      description: "Optional homepage title override; empty string if unused.",
    },
    homeSubtitle: {
      type: "string",
      description: "Optional homepage subtitle override; empty string if unused.",
    },
    technologies: {
      type: "array",
      items: { type: "string" },
      maxItems: 20,
      description:
        "Suggested technology/tool tags from project context only; never invent stacks.",
    },
  },
  required: [
    "title",
    "subtitle",
    "description",
    "homeTitle",
    "homeSubtitle",
    "technologies",
  ],
  additionalProperties: false,
} as const;

export const MARKETING_WEBSITE_CONTENT_SCHEMA_NAME = "marketing_website_project_content";

/** Strict JSON Schema for content ideas list. */
export const MARKETING_IDEAS_JSON_SCHEMA = {
  type: "object",
  properties: {
    ideas: {
      type: "array",
      items: { type: "string" },
      minItems: 5,
      maxItems: 8,
      description: "Short Hebrew content idea titles or one-liners.",
    },
  },
  required: ["ideas"],
  additionalProperties: false,
} as const;

export const MARKETING_IDEAS_SCHEMA_NAME = "marketing_content_ideas";
