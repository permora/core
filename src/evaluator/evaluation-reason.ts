export type EvaluationReason =
  | 'GRANT_MATCHED'
  | 'CONDITION_MATCHED'
  | 'NO_MATCHING_GRANT'
  | 'ALL_CONDITIONS_FAILED';
