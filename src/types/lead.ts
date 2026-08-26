export type LeadSource = "website" | "landingPage";

export type LeadStatus =
  | "new"
  | "contacted"
  | "inProgress"
  | "closed"
  | "archived";

export type LeadQualificationAnswerDto = {
  key: string;
  question: string;
  answer: string;
};

export type LeadQualificationDto = {
  answers: LeadQualificationAnswerDto[];
  completedAt?: string;
};

export type QualificationStatus = "pending" | "completed";

export type LeadUtmDto = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
};

export type AdminLeadDto = {
  id: string;
  leadNumber: number;
  name: string;
  phone: string;
  email: string;
  source: LeadSource;
  status: LeadStatus;
  isRead: boolean;
  createdAt: string;
};

export type AdminLeadDetailDto = AdminLeadDto & {
  message?: string;
  sourcePage: string;
  campaign?: string;
  internalNotes: string;
  lastContactAt?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  qualification?: LeadQualificationDto;
  qualificationStatus: QualificationStatus;
  updatedAt: string;
};
