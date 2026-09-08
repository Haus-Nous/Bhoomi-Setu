export type AnchorSubjectType = "verification_result";

export type AnchorEvent = {
  id: string;
  case_id: string;
  subject_type: AnchorSubjectType;
  subject_id: string;
  payload_hash: string;
  prev_hash: string | null;
  signed_by: string;
  signed_at: string;
};

export type PublicAnchorVerification = {
  matches: boolean;
  recomputedHash: string | null;
  storedHash: string;
  signedBy: string;
  signedAt: string;
  caseReference: string;
};
