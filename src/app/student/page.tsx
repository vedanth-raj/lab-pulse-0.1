"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Send, Sparkles, UserPlus, Clock, LogOut, Users, Calendar, Upload, FileText, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { getFirebaseClient, firebaseOperations } from "@/lib/firebaseClient";
import { authUtils } from "@/lib/auth";
import AuthGuard from "@/components/AuthGuard";
import {
  Progress,
  STATUS_META,
  STATUS_ORDER,
  Student,
  Task,
  TaskStatus,
  Session,
  TestResult,
} from "@/lib/types";
import { codeExecutor } from "@/lib/codeExecutor";

type ProgressMap = Record<string, Progress>;

const keyFor = (studentId: string, taskId: string) => `${studentId}-${taskId}`;

const buildProgressMap = (progressList: Progress[]) => {
  const map: ProgressMap = {};
  progressList.forEach((p) => {
    map[keyFor(p.student_id, p.task_id)] = p;
  });
  return map;
};

function StudentDashboard() {
  const router = useRouter();
  const { database } = useMemo(() => getFirebaseClient(), []);
  const currentUser = authUtils.getCurrentUser();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [loadingTasks, setLoadingTasks] = useState(() => !!database);
  const [joining, setJoining] = useState(false);
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(() =>
    database
      ? null
      : "Firebase is not configured properly.",
  );
  const [sessionName, setSessionName] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [timer, setTimer] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({});
  const [code, setCode] = useState<Record<string, string>>({});
  const [runningTests, setRunningTests] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult[]>>({});

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (timerActive && timer > 0) {
      interval = setInterval(() => {
        setTimer((timer) => timer - 1);
      }, 1000);
    } else if (timer === 0) {
      setTimerActive(false);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timer]);

  // Format timer display
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (!database) return;

    const loadSessions = () => {
      try {
        const unsubscribe = firebaseOperations.subscribeToPath('sessions', (data) => {
          const sessionList = data ? Object.entries(data).map(([id, session]: [string, any]) => ({
            id,
            ...session
          })) : [];
          setSessions(sessionList);
        });
        
        return unsubscribe;
      } catch (err) {
        setError("Failed to load sessions from Firebase.");
        return () => {};
      }
    };

    const unsubscribe = loadSessions();
    return () => {
      unsubscribe();
    };
  }, [database]);

  useEffect(() => {
    if (!database) return;

    const loadTasks = () => {
      setLoadingTasks(true);
      
      try {
        const unsubscribe = firebaseOperations.subscribeToPath('tasks', (data) => {
          const taskList = data ? Object.entries(data).map(([id, task]: [string, any]) => ({
            id,
            ...task
          })) : [];
          setTasks(taskList);
          setLoadingTasks(false);
        });
        
        return unsubscribe;
      } catch (err) {
        setError("Failed to load tasks from Firebase.");
        setLoadingTasks(false);
        return () => {};
      }
    };

    const unsubscribe = loadTasks();
    return () => {
      unsubscribe();
    };
  }, [database]);

  useEffect(() => {
    if (!database || !student) return;

    const loadProgress = () => {
      try {
        const unsubscribe = firebaseOperations.subscribeToPath('progress', (data) => {
          const progressList = data ? Object.entries(data).map(([id, progress]: [string, any]) => ({
            id,
            ...progress
          })) : [];
          
          const studentProgress = progressList.filter(p => p.student_id === student.id);
          const map = buildProgressMap(studentProgress);
          setProgress(map);
          setDrafts(
            studentProgress.reduce((acc, row) => {
              acc[row.task_id] = row.output ?? "";
              return acc;
            }, {} as Record<string, string>),
          );
          setCode(
            studentProgress.reduce((acc, row) => {
              if (row.code) acc[row.task_id] = row.code;
              return acc;
            }, {} as Record<string, string>),
          );
          setTestResults(
            studentProgress.reduce((acc, row) => {
              if (row.testResults) acc[row.task_id] = row.testResults;
              return acc;
            }, {} as Record<string, TestResult[]>),
          );
        });
        
        return unsubscribe;
      } catch (err) {
        setError("Failed to load progress from Firebase.");
        return () => {};
      }
    };

    const unsubscribe = loadProgress();
    return () => {
      unsubscribe();
    };
  }, [database, student]);

  const handleJoinSession = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!database) {
      setError("Firebase is not configured yet.");
      return;
    }
    if (!sessionName.trim()) {
      setError("Please enter a session name to join.");
      return;
    }

    setJoining(true);
    setError(null);

    try {
      // Find session by name
      const session = sessions.find(s => s.name.toLowerCase() === sessionName.trim().toLowerCase());
      
      if (!session) {
        setError("Session not found. Please check the session name.");
        setJoining(false);
        return;
      }

      // Check if session is full
      const currentStudentCount = session.currentStudents || 0;
      const maxStudents = session.maxStudents || 30;
      
      if (currentStudentCount >= maxStudents) {
        setError("Session is full. Please contact your instructor.");
        setJoining(false);
        return;
      }

      // Create or update student in Firebase
      const studentData = {
        name: currentUser?.username || "Anonymous Student",
        cohort: null,
        sessionId: session.id
      };

      // Use push to create new student or update existing one
      const newStudentRef = await firebaseOperations.pushData('students', studentData);
      
      if (newStudentRef) {
        const studentId = newStudentRef.key;
        const newStudent: Student = {
          id: studentId!,
          ...studentData
        };
        setStudent(newStudent);
        setSelectedSession(session);
        setSessionName("");
        
        // Update session student count
        const updatedSession = {
          ...session,
          currentStudents: currentStudentCount + 1
        };
        await firebaseOperations.updateData(`sessions/${session.id}`, updatedSession);
        
        // Start timer for 2 hours (7200 seconds)
        setTimer(7200);
        setTimerActive(true);
      }
    } catch (err) {
      setError("Failed to join session.");
    }

    setJoining(false);
  };

  const handleFileUpload = (taskId: string, file: File) => {
    // Check file type and size
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      setError("Only PDF, Word, and text files are allowed.");
      return;
    }

    if (file.size > maxSize) {
      setError("File size must be less than 10MB.");
      return;
    }

    setUploadedFiles(prev => ({
      ...prev,
      [taskId]: file
    }));
  };

  const removeFile = (taskId: string) => {
    setUploadedFiles(prev => {
      const newFiles = { ...prev };
      delete newFiles[taskId];
      return newFiles;
    });
  };

  const handleTaskStart = async (taskId: string) => {
    // Auto-update status to "in_progress" when student starts a task
    if (!student) return;
    const currentProgress = progress[keyFor(student.id, taskId)];
    if (currentProgress?.status !== "in_progress") {
      console.log(`Starting task ${taskId}, changing status from ${currentProgress?.status} to in_progress`);
      await updateProgress(taskId, "in_progress");
    }
  };

  const handleCodeChange = async (taskId: string, codeValue: string) => {
    // Auto-update to "in_progress" when student starts typing
    if (!student) return;
    if (codeValue.trim()) {
      const currentProgress = progress[keyFor(student.id, taskId)];
      if (currentProgress?.status === "not_started") {
        console.log(`Code changed for task ${taskId}, changing status from ${currentProgress?.status} to in_progress`);
        await updateProgress(taskId, "in_progress");
      }
    }
  };

  const runTests = async (taskId: string, task: Task) => {
    if (!task.language || !task.testCases || task.testCases.length === 0) {
      setError("No test cases available for this task.");
      return;
    }

    setRunningTests(taskId);
    setError(null);

    try {
      const studentCode = code[taskId] || "";
      const results = await codeExecutor.runTestCases(
        task.language,
        studentCode,
        task.testCases
      );

      const score = codeExecutor.calculateScore(results, task.maxScore);
      
      setTestResults(prev => ({
        ...prev,
        [taskId]: results
      }));

      // Auto-save progress with test results
      await updateProgress(taskId, "done", undefined, results, score);
      
    } catch (error) {
      setError("Failed to run tests.");
    } finally {
      setRunningTests(null);
    }
  };

  const updateProgress = async (
    taskId: string,
    nextStatus: TaskStatus,
    output?: string,
    testResults?: TestResult[],
    score?: number,
  ) => {
    if (!student || !database) return;

    setSavingTaskId(taskId);
    setError(null);

    try {
      const existing = progress[keyFor(student.id, taskId)];
      const uploadedFile = uploadedFiles[taskId];
      
      let fileUrl = existing?.fileUrl;
      let fileName = existing?.fileName;
      
      // Handle file upload (for now, we'll store file info as base64 or use a service like Firebase Storage)
      if (uploadedFile) {
        // For demo purposes, we'll store file info as base64
        // In production, you'd use Firebase Storage or similar
        const reader = new FileReader();
        reader.readAsDataURL(uploadedFile);
        await new Promise((resolve) => {
          reader.onload = resolve;
        });
        fileUrl = reader.result as string;
        fileName = uploadedFile.name;
      }

      const payload = {
        student_id: student.id,
        task_id: taskId,
        status: nextStatus,
        output: output ?? existing?.output,
        updated_at: new Date().toISOString(),
        fileUrl,
        fileName,
        code: code[taskId] || existing?.code,
        testResults: testResults || existing?.testResults,
        score: score !== undefined ? score : existing?.score
      };

      // Use push to create new progress entry or update existing
      if (existing?.id) {
        await firebaseOperations.updateData(`progress/${existing.id}`, payload);
      } else {
        const newProgressRef = await firebaseOperations.pushData('progress', payload);
        if (newProgressRef) {
          const newProgress: Progress = {
            id: newProgressRef.key!,
            student_id: payload.student_id,
            task_id: payload.task_id,
            status: payload.status,
            output: payload.output,
            updated_at: payload.updated_at,
            fileUrl: payload.fileUrl,
            fileName: payload.fileName,
            code: payload.code,
            testResults: payload.testResults,
            score: payload.score
          };
          setProgress((prev) => ({
            ...prev,
            [keyFor(student.id, taskId)]: newProgress,
          }));
        }
      }

      setDrafts((prev) => ({
        ...prev,
        [taskId]: payload.output || "",
      }));
    } catch (err) {
      setError("Failed to update progress.");
    }

    setSavingTaskId(null);
  };

  const saveOutput = async (taskId: string) => {
    await updateProgress(
      taskId,
      progress[keyFor(student?.id ?? "", taskId)]?.status ?? "in_progress",
      drafts[taskId] ?? "",
    );
  };

  const handleLogout = () => {
    authUtils.logout();
  };

  const filteredTasks = selectedSession 
    ? tasks.filter(task => task.sessionId === selectedSession.id)
    : [];

  return (
    <AuthGuard requiredRole="student">
      <div className="mx-auto max-w-5xl px-6 py-12 sm:py-14">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200/70">
                Student dashboard
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-sm text-red-200 hover:bg-red-500/20"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                  Your tasks, one place.
                </h1>
                <Sparkles className="h-6 w-6 text-amber-200" />
              </div>
              <p className="max-w-3xl text-lg text-slate-200/80">
                Update your status without disrupting flow. Tap a chip, paste your
                output, and your instructor sees it instantly.
              </p>
            </div>
          </div>

          {/* Timer */}
          {selectedSession && timerActive && (
            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-6 py-4">
              <Clock className="h-5 w-5 text-amber-400" />
              <div className="text-center">
                <div className="text-2xl font-mono font-bold text-white">
                  {formatTime(timer)}
                </div>
                <div className="text-xs text-slate-400">Time Remaining</div>
              </div>
            </div>
          )}
        </div>

        {error ? (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-50">
            <UserPlus className="h-5 w-5" />
            <div>
              <p className="font-semibold">Heads up</p>
              <p className="text-sm text-amber-100/80">{error}</p>
            </div>
          </div>
        ) : null}

        {!student ? (
          <form
            onSubmit={handleJoinSession}
            className="mb-10 grid gap-3 rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl shadow-amber-500/10 sm:grid-cols-[1fr_auto]"
          >
            <div className="space-y-2">
              <label className="text-sm text-slate-200/80">Session Name</label>
              <input
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., Data Structures Lab"
                className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-white outline-none ring-amber-400/40 focus:ring-2"
                required
              />
            </div>
            <button
              type="submit"
              disabled={joining}
              className="flex items-center justify-center gap-2 rounded-2xl bg-amber-500 px-6 py-3 font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed sm:col-span-1"
            >
              <UserPlus className="h-4 w-4" />
              {joining ? "Joining..." : "Join Session"}
            </button>
          </form>
        ) : selectedSession ? (
          <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white">{selectedSession.name}</h3>
                <div className="mt-1 flex items-center gap-4 text-sm text-slate-300">
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {selectedSession.school} - {selectedSession.batchYear}
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Deadline: {new Date(selectedSession.deadline).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {student && filteredTasks.length === 0 ? (
          <div className="rounded-3xl border border-white/10 bg-white/5 p-12 text-center">
            <div className="mx-auto max-w-sm space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <UserPlus className="h-8 w-8 text-amber-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">No tasks available</h3>
                <p className="text-slate-300/80">
                  Tasks will appear here once your instructor creates them for this session.
                </p>
              </div>
            </div>
          </div>
        ) : student && filteredTasks.length > 0 ? (
          <div className="space-y-4">
            {filteredTasks.map((task) => {
              const status = progress[keyFor(student.id, task.id)]?.status ?? "not_started";
              const meta = STATUS_META[status];
              const output = drafts[task.id] ?? "";
              const isSaving = savingTaskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`rounded-3xl border transition-all ${meta.border} ${meta.bg}`}
                  onClick={() => handleTaskStart(task.id)}
                >
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-xl font-semibold text-white">{task.title}</h3>
                        {task.description && (
                          <p className="mt-1 text-slate-300/80">{task.description}</p>
                        )}
                      </div>
                      <div className={`flex items-center gap-2 rounded-full ${meta.bg} ${meta.border} px-3 py-1.5 text-xs font-medium ${meta.text}`}>
                        <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                        {meta.label}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {STATUS_ORDER.map((nextStatus) => (
                          <button
                            key={nextStatus}
                            onClick={() => updateProgress(task.id, nextStatus)}
                            disabled={isSaving}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                              status === nextStatus
                                ? "border-amber-500 bg-amber-500/20 text-amber-200"
                                : "border-white/20 bg-white/5 text-slate-300 hover:border-amber-500/50"
                            }`}
                          >
                            {STATUS_META[nextStatus].label}
                          </button>
                        ))}
                      </div>

                      {task.language && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-sm text-slate-200/80">
                              Code Editor ({task.language})
                            </label>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-slate-400">
                                Max Score: {task.maxScore || 100}
                              </span>
                              {progress[keyFor(student.id, task.id)]?.score && (
                                <span className="text-xs font-semibold text-amber-400">
                                  Score: {progress[keyFor(student.id, task.id)]?.score}
                                </span>
                              )}
                            </div>
                          </div>
                          <textarea
                            value={code[task.id] || ""}
                            onChange={(e) => {
                              setCode((prev) => ({ ...prev, [task.id]: e.target.value }));
                              handleCodeChange(task.id, e.target.value);
                            }}
                            placeholder={`Write your ${task.language} code here...`}
                            className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 font-mono text-sm text-white outline-none ring-amber-400/40 focus:ring-2 resize-none"
                            rows={8}
                          />
                          {task.testCases && task.testCases.length > 0 && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => runTests(task.id, task)}
                                disabled={runningTests === task.id}
                                className="flex items-center gap-2 rounded-xl bg-blue-500 px-3 py-2 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:-translate-y-0.5 disabled:opacity-50"
                              >
                                {runningTests === task.id ? "Running..." : "Run Tests"}
                              </button>
                              {testResults[task.id] && (
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="text-amber-400">
                                    ✓ {testResults[task.id].filter(r => r.passed).length} passed
                                  </span>
                                  <span className="text-red-400">
                                    ✗ {testResults[task.id].filter(r => !r.passed).length} failed
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                          {testResults[task.id] && (
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {testResults[task.id].map((result, index) => (
                                <div
                                  key={result.testCaseId}
                                  className={`text-xs p-2 rounded ${result.passed ? 'bg-amber-500/10 text-amber-300' : 'bg-red-500/10 text-red-300'}`}
                                >
                                  <div className="flex items-center justify-between">
                                    <span>Test {index + 1}</span>
                                    <span>{result.passed ? '✓' : '✗'}</span>
                                  </div>
                                  {!result.passed && result.error && (
                                    <div className="text-xs mt-1 text-red-400">{result.error}</div>
                                  )}
                                  <div className="text-xs mt-1 opacity-70">
                                    Input: {result.actualOutput}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm text-slate-200/80">Your output</label>
                        <textarea
                          value={output}
                          onChange={(e) => setDrafts((prev) => ({ ...prev, [task.id]: e.target.value }))}
                          placeholder="Paste your code or output here..."
                          className="w-full rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 font-mono text-sm text-white outline-none ring-amber-400/40 focus:ring-2 resize-none"
                          rows={6}
                        />
                      </div>

                      {task.allowFileUpload && (
                        <div className="space-y-2">
                          <label className="text-sm text-slate-200/80">Upload Document (PDF, Word, or Text)</label>
                          {uploadedFiles[task.id] ? (
                            <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-amber-400" />
                                <span className="text-sm text-white">{uploadedFiles[task.id].name}</span>
                                <span className="text-xs text-slate-400">
                                  ({(uploadedFiles[task.id].size / 1024 / 1024).toFixed(2)} MB)
                                </span>
                              </div>
                              <button
                                onClick={() => removeFile(task.id)}
                                className="text-slate-400 hover:text-red-400"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative">
                              <input
                                type="file"
                                id={`file-upload-${task.id}`}
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileUpload(task.id, file);
                                }}
                                accept=".pdf,.doc,.docx,.txt"
                                className="sr-only"
                              />
                              <label
                                htmlFor={`file-upload-${task.id}`}
                                className="flex items-center justify-center gap-2 rounded-xl border border-dashed border-white/20 bg-white/5 p-4 cursor-pointer transition hover:border-amber-500/50 hover:bg-amber-500/10"
                              >
                                <Upload className="h-4 w-4 text-slate-400" />
                                <span className="text-sm text-slate-300">Click to upload file</span>
                              </label>
                            </div>
                          )}
                        </div>
                      )}

                      <button
                        onClick={() => saveOutput(task.id)}
                        disabled={isSaving}
                        className="flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 disabled:opacity-50"
                      >
                        <Send className="h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Output"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : null}
      </div>
    </AuthGuard>
  );
}

export default function StudentPage() {
  return <StudentDashboard />;
}
