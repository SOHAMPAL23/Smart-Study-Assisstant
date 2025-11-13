export interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
}

export interface Flashcard {
  front: string;
  back: string;
}

export interface NormalStudyData {
  summary: string[];
  quiz: QuizQuestion[];
  studyTip: string;
  flashcards: Flashcard[];
}

export interface MathStudyData {
  question: string;
  answer: string;
  explanation: string;
}

export type StudyMode = 'normal' | 'math';

export type StudyData = NormalStudyData | MathStudyData;
