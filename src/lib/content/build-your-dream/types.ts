export type LandingImageData = {
  id: string;
  src: string;
  alt: string;
  width: number;
  height: number;
  priority?: boolean;
  storageKey?: string;
};

export type LandingCtaData = {
  label: string;
  action: "scroll-to-form" | "submit";
};

export type QualificationQuestionType = "text";

export type QualificationQuestion = {
  id: string;
  type: QualificationQuestionType;
  question: string;
  placeholder: string;
  required: boolean;
};

export type BuildYourDreamMeta = {
  title: string;
  description: string;
  ogImage?: LandingImageData;
};

export type BuildYourDreamHero = {
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaPrimary: LandingCtaData;
  ctaSecondary: LandingCtaData;
};

export type BuildYourDreamBenefitItem = {
  id: string;
  icon: string;
  title: string;
  text: string;
};

export type BuildYourDreamBenefits = {
  title: string;
  subtitle: string;
  items: BuildYourDreamBenefitItem[];
  cta: LandingCtaData;
};

export type BuildYourDreamSplit = {
  id: string;
  title: string;
  text: string;
  cta: LandingCtaData;
  reversed?: boolean;
};

export type BuildYourDreamProcessStep = {
  id: string;
  stepNumber: number;
  title: string;
  text: string;
};

export type BuildYourDreamProcess = {
  title: string;
  subtitle: string;
  steps: BuildYourDreamProcessStep[];
};

export type BuildYourDreamCtaBanner = {
  title: string;
  text: string;
  cta: LandingCtaData;
};

export type BuildYourDreamFaqItem = {
  id: string;
  question: string;
  answer: string;
};

export type BuildYourDreamFaq = {
  title: string;
  items: BuildYourDreamFaqItem[];
};

export type BuildYourDreamLeadForm = {
  title: string;
  subtitle: string;
  submitLabel: string;
  submittingLabel: string;
  fields: {
    name: { label: string; placeholder: string };
    phone: { label: string; placeholder: string };
    email: { label: string; placeholder: string };
    message: { label: string; placeholder: string };
  };
  errorMessage: string;
};

export type BuildYourDreamFinalCta = {
  title: string;
  text: string;
  cta: LandingCtaData;
};

export type BuildYourDreamThankYou = {
  stepLabel: string;
  title: string;
  subtitle: string;
  nextStepsTitle: string;
  nextSteps: string[];
  qualification: {
    title: string;
    subtitle: string;
    submitLabel: string;
    submittingLabel: string;
    questions: QualificationQuestion[];
  };
  completedTitle: string;
  completedText: string;
  errorMessage: string;
};

export type BuildYourDreamImages = {
  hero: LandingImageData;
  splitPrimary: LandingImageData;
  splitSecondary: LandingImageData;
};

export type BuildYourDreamContent = {
  meta: BuildYourDreamMeta;
  images: BuildYourDreamImages;
  hero: BuildYourDreamHero;
  benefits: BuildYourDreamBenefits;
  splitPrimary: BuildYourDreamSplit;
  process: BuildYourDreamProcess;
  ctaBanner: BuildYourDreamCtaBanner;
  splitSecondary: BuildYourDreamSplit;
  faq: BuildYourDreamFaq;
  leadForm: BuildYourDreamLeadForm;
  finalCta: BuildYourDreamFinalCta;
  thankYou: BuildYourDreamThankYou;
};
