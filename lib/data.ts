import trialData from '@/data/trial.json';
import cohortData from '@/data/cohort-results.json';
import externalPathologyP007 from '@/data/external/pathology-p007.json';
import resolvedP007 from '@/data/resolved-p007.json';

import p001 from '@/data/patients/p001.json';
import p002 from '@/data/patients/p002.json';
import p003 from '@/data/patients/p003.json';
import p004 from '@/data/patients/p004.json';
import p005 from '@/data/patients/p005.json';
import p006 from '@/data/patients/p006.json';
import p007 from '@/data/patients/p007.json';
import p008 from '@/data/patients/p008.json';
import p009 from '@/data/patients/p009.json';
import p010 from '@/data/patients/p010.json';

import type {
  Trial,
  PatientEvaluation,
  PatientGraph,
  Evidence,
  CriterionResult,
} from './types';

const trial = trialData as Trial;
const cohort = cohortData as PatientEvaluation[];
const externalPathology = externalPathologyP007 as Evidence;
const resolvedC03 = resolvedP007 as CriterionResult;

const patients: Record<string, PatientGraph> = {
  'P-001': p001 as PatientGraph,
  'P-002': p002 as PatientGraph,
  'P-003': p003 as PatientGraph,
  'P-004': p004 as PatientGraph,
  'P-005': p005 as PatientGraph,
  'P-006': p006 as PatientGraph,
  'P-007': p007 as PatientGraph,
  'P-008': p008 as PatientGraph,
  'P-009': p009 as PatientGraph,
  'P-010': p010 as PatientGraph,
};

export function getTrial(): Trial {
  return trial;
}

export function getCohort(): PatientEvaluation[] {
  return cohort;
}

export function getPatient(id: string): PatientGraph | undefined {
  return patients[id];
}

export function getExternalPathology(): Evidence {
  return externalPathology;
}

export function getResolvedC03(): CriterionResult {
  return resolvedC03;
}
