export type CriterionStatus = 'PASS' | 'FAIL' | 'UNKNOWN';

export interface Fact {
  statement: string;
  sourceType: string;
  sourceName: string;
  date: string;
}

export interface PatientGraph {
  id: string;
  label: string;
  ageRange: string;
  sex: string;
  facts: {
    conditions: Fact[];
    treatments: Fact[];
    biomarkers: Fact[];
    performance: Fact[];
    imaging: Fact[];
  };
}

export interface TrialCriterion {
  id: string;
  label: string;
  category: 'demographic' | 'diagnosis' | 'biomarker' | 'treatment' | 'safety' | 'other';
  decisive: boolean;
}

export interface Trial {
  id: string;
  title: string;
  phase: string;
  criteria: TrialCriterion[];
}

export interface Evidence extends Fact {
  excerpt: string;
}

export interface CriterionResult {
  criterionId: string;
  status: CriterionStatus;
  evidence?: Evidence;
  gap?: {
    missing: string;
    minimumNextStep: string;
  };
}

export interface PatientEvaluation {
  patientId: string;
  overall: 'LIKELY_ELIGIBLE' | 'UNKNOWN' | 'INELIGIBLE';
  failedOn?: string;
  results?: CriterionResult[];
}
