import type { ConvertibleIntentClassification } from "@/lib/business/intents/classification-rules";

export type ClassifierOutputClassification = ConvertibleIntentClassification | "irrelevant";

export type IntentClassifierInput = {
  title?: string;
  content: string;
  sourcePlatform?: string;
  sourceType?: string;
};

export type IntentClassifierResult = {
  classification: ClassifierOutputClassification;
  reason: string;
  classifierVersion: string;
};

export type IntentClassifier = {
  classify(input: IntentClassifierInput): Promise<IntentClassifierResult | null>;
};
