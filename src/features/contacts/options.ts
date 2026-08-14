export const JOB_CONTACT_TYPES = [
  "RECRUITER",
  "HIRING_MANAGER",
  "ENGINEER",
  "CONNECTION",
  "LEADERSHIP",
  "OTHER",
] as const;

export type JobContactType = (typeof JOB_CONTACT_TYPES)[number];

export const OUTREACH_STATUSES = [
  "NOT_CONTACTED",
  "CONTACTED",
  "RESPONDED",
  "FOLLOW_UP_NEEDED",
  "CLOSED",
] as const;

export type OutreachStatus = (typeof OUTREACH_STATUSES)[number];

export const jobContactTypeLabels: Record<JobContactType, string> = {
  RECRUITER: "Recruiter / Talent Partner",
  HIRING_MANAGER: "Likely hiring manager",
  ENGINEER: "Engineer / Team member",
  CONNECTION: "Alumni / Existing connection",
  LEADERSHIP: "Founder / Department leader",
  OTHER: "Other",
};

export const contactTypeRelevance: Record<JobContactType, string> = {
  RECRUITER: "Recruiters may help route your application.",
  HIRING_MANAGER: "Engineering managers may understand the team's hiring needs.",
  ENGINEER: "Engineers can provide team context or referrals.",
  CONNECTION: "Existing connections or alumni may offer context or a warm introduction.",
  LEADERSHIP: "Leaders at smaller companies may have direct context on the role.",
  OTHER: "Add why this person is relevant to your search.",
};

export const outreachStatusLabels: Record<OutreachStatus, string> = {
  NOT_CONTACTED: "Not contacted",
  CONTACTED: "Contacted",
  RESPONDED: "Responded",
  FOLLOW_UP_NEEDED: "Follow-up needed",
  CLOSED: "Closed",
};
