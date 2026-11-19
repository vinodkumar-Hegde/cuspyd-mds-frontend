/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SubjectId = 
  | 'anatomy' | 'physiology_biochem' | 'dental_anatomy' | 'pathology_micro' | 'pharmacology' | 'medicine' | 'surgery'
  | 'materials' | 'oral_path' | 'oral_med_rad' | 'pedodontics' | 'orthodontics' | 'periodontology' | 'prosthodontics' | 'conservative_endo' | 'oral_surgery' | 'public_health';

export interface SubjectInfo {
  id: SubjectId;
  name: string;
  part: 'A' | 'B';
  weightage: number;
}

export const SUBJECTS: Record<SubjectId, SubjectInfo> = {} as Record<SubjectId, SubjectInfo>;
export const SUBJECT_BDS_YEAR: Record<SubjectId, 'BDS-I' | 'BDS-II' | 'BDS-III' | 'BDS-IV'> = {} as any;
export let EXAM_SECONDS_PER_QUESTION = 60;
export function setCatalog(catalog: {subjects: (SubjectInfo & {bds_year: string})[]; exam_seconds_per_question: number}) {
  Object.assign(SUBJECTS, Object.fromEntries(catalog.subjects.map(s => [s.id, s])));
  Object.assign(SUBJECT_BDS_YEAR, Object.fromEntries(catalog.subjects.map(s => [s.id, s.bds_year])));
  EXAM_SECONDS_PER_QUESTION = catalog.exam_seconds_per_question;
}

export interface Question {
  id: string;
  subjectId: SubjectId;
  year: 'BDS-I' | 'BDS-II' | 'BDS-III' | 'BDS-IV';
  text: string;
  options: string[];
  correctOption: number; // 0-3
  explanation: string;
  topic?: string;
  imageUrl?: string;
}

export interface TestGenerated {
  id: string;
  title: string;
  type: 'RANKER' | 'MOCK' | 'MT' | 'ST' | 'GT';
  questions: string[]; // List of question IDs
  weightage: Record<string, number>;
  status: 'DRAFT' | 'LOCKED' | 'PUBLISHED' | 'SCHEDULED' | 'ACTIVE' | 'ARCHIVED';
  subjectId?: SubjectId; // Added subjectId
  publishDate?: string; // ISO string
  autoKeyReleaseDate?: string; // ISO string
  createdAt: string; // ISO string
  answerKey?: Record<string, number>; // questionId -> optionIndex
  explanations?: Record<string, string>; // questionId -> explanation
  adminMessage?: string; // Upcomming exam or status message
}

export interface UserProfile {
  name: string;
  email: string;
  mobile: string;
  college: string;
  state: string;
  role: 'student' | 'admin';
}
