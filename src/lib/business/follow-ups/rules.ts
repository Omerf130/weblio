import type { FollowUpStatus } from "@/types/follow-up";

export const FOLLOW_UP_STATUS_LABELS: Record<FollowUpStatus, string> = {
  pending: "ממתין",
  completed: "הושלם",
  cancelled: "בוטל",
};
