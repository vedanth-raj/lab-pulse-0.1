export type TaskStatus = "not_started" | "in_progress" | "done";

export const STATUS_ORDER: TaskStatus[] = [
  "not_started",
  "in_progress",
  "done",
];

export const STATUS_META: Record<
  TaskStatus,
  { label: string; dot: string; bg: string; border: string; text: string }
> = {
  not_started: {
    label: "Not started",
    dot: "bg-slate-400",
    bg: "bg-slate-900/50",
    border: "border border-slate-800/80",
    text: "text-slate-200",
  },
  in_progress: {
    label: "In progress",
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    border: "border border-amber-500/30",
    text: "text-amber-200",
  },
  done: {
    label: "Complete",
    dot: "bg-amber-400",
    bg: "bg-amber-500/10",
    border: "border border-amber-500/30",
    text: "text-amber-200",
  },
};

export type School = "SOL" | "STME" | "SPTM" | "SOC" | "SBM";

export type BatchYear = "1st year" | "2nd year" | "3rd year" | "4th year";

export type User = {
  id: string;
  username: string;
  password: string;
  role: "faculty" | "student";
  school?: School;
  batchYear?: BatchYear;
};

export type Session = {
  id: string;
  name: string;
  facultyId: string;
  school: School;
  batchYear: BatchYear;
  deadline: string;
  createdAt: string;
  isActive: boolean;
  maxStudents: number;
  currentStudents: number;
};

export type TestCase = {
  id: string;
  input: string;
  expectedOutput: string;
  isHidden?: boolean;
};

export type Task = {
  id: string;
  sessionId: string;
  title: string;
  description: string | null;
  task_order: number | null;
  allowFileUpload: boolean;
  language?: "javascript" | "python" | "java" | "cpp" | null;
  testCases?: TestCase[];
  maxScore?: number;
};

export type Student = {
  id: string;
  name: string;
  cohort?: string | null;
  sessionId?: string;
};

export type Progress = {
  id?: string;
  student_id: string;
  task_id: string;
  status: TaskStatus;
  output: string | undefined;
  updated_at?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  code?: string | null;
  testResults?: TestResult[];
  score?: number;
};

export type TestResult = {
  testCaseId: string;
  passed: boolean;
  actualOutput: string;
  error?: string;
};
