export type LeadActionState = {
  error?: string;
  success?: boolean;
};

export type WebsiteLeadFormAction = (
  prevState: LeadActionState,
  formData: FormData
) => Promise<LeadActionState>;
