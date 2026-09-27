export type FollowUpStatus = "pending" | "completed" | "cancelled";

export type AdminFollowUpDto = {
  id: string;
  title: string;
  note?: string;
  dueAt: string;
  status: FollowUpStatus;
  completedAt?: string;
  leadId?: string;
  opportunityId?: string;
  createdAt: string;
  updatedAt: string;
};

export type FollowUpListResult = {
  items: AdminFollowUpDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
