"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, BarChart3, RadioTower, LogOut, Plus, Clock, Calendar, Users, BookOpen, X } from "lucide-react";
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
  School,
  BatchYear,
  TestCase,
} from "@/lib/types";
import { codeExecutor } from "@/lib/codeExecutor";

type ProgressMap = Record<string, Progress>;

const keyFor = (studentId: string, taskId: string) => `${studentId}-${taskId}`;

const SCHOOLS: School[] = ["SOL", "STME", "SPTM", "SOC", "SBM"];
const BATCH_YEARS: BatchYear[] = ["1st year", "2nd year", "3rd year", "4th year"];
const LANGUAGES = ["javascript", "python", "java", "cpp"] as const;

function FacultyDashboard() {
  const router = useRouter();
  const { database } = useMemo(() => getFirebaseClient(), []);
  const currentUser = authUtils.getCurrentUser();

  const [loading, setLoading] = useState(() => !!database);
  const [error, setError] = useState<string | null>(() =>
    database
      ? null
      : "Firebase is not configured properly.",
  );
  const [livePulse, setLivePulse] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [progress, setProgress] = useState<ProgressMap>({});
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);

  // Form states
  const [sessionForm, setSessionForm] = useState({
    name: "",
    school: "STME" as School,
    batchYear: "1st year" as BatchYear,
    deadline: "",
    maxStudents: 30
  });
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    allowFileUpload: false,
    language: "javascript" as "javascript" | "python" | "java" | "cpp" | null,
    maxScore: 100,
    testCases: [] as TestCase[]
  });

  useEffect(() => {
    if (!database) return;

    const fetchData = () => {
      setLoading(true);
      setError(null);
      
      try {
        // Subscribe to sessions
        const unsubscribeSessions = firebaseOperations.subscribeToPath('sessions', (data) => {
          const sessionList = data ? Object.entries(data).map(([id, session]: [string, any]) => ({
            id,
            ...session
          })) : [];
          setSessions(sessionList);
        });

        // Subscribe to tasks
        const unsubscribeTasks = firebaseOperations.subscribeToPath('tasks', (data) => {
          const taskList = data ? Object.entries(data).map(([id, task]: [string, any]) => ({
            id,
            ...task
          })) : [];
          setTasks(taskList);
        });

        // Subscribe to students
        const unsubscribeStudents = firebaseOperations.subscribeToPath('students', (data) => {
          const studentList = data ? Object.entries(data).map(([id, student]: [string, any]) => ({
            id,
            ...student
          })) : [];
          setStudents(studentList);
        });

        // Subscribe to progress
        const unsubscribeProgress = firebaseOperations.subscribeToPath('progress', (data) => {
          const progressList = data ? Object.entries(data).map(([id, progress]: [string, any]) => ({
            id,
            ...progress
          })) : [];
          setProgress(buildProgressMap(progressList));
          setLivePulse(true);
          setTimeout(() => setLivePulse(false), 1200);
        });

        setLoading(false);

        return () => {
          unsubscribeSessions();
          unsubscribeTasks();
          unsubscribeStudents();
          unsubscribeProgress();
        };
      } catch (err) {
        setError("Failed to load data from Firebase.");
        setLoading(false);
        return () => {};
      }
    };

    const unsubscribe = fetchData();
    return unsubscribe;
  }, [database]);

  const buildProgressMap = (progressList: Progress[]) => {
    const map: ProgressMap = {};
    progressList.forEach((p) => {
      map[keyFor(p.student_id, p.task_id)] = p;
    });
    return map;
  };

  const getStatus = (studentId: string, taskId: string, progressMap: ProgressMap) => {
    return progressMap[keyFor(studentId, taskId)]?.status || "not_started";
  };

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      const newSession: Session = {
        id: `session_${Date.now()}`,
        name: sessionForm.name,
        facultyId: currentUser.id,
        school: sessionForm.school,
        batchYear: sessionForm.batchYear,
        deadline: sessionForm.deadline,
        createdAt: new Date().toISOString(),
        isActive: true,
        maxStudents: sessionForm.maxStudents,
        currentStudents: 0
      };

      await firebaseOperations.pushData("sessions", newSession);
      setShowCreateSession(false);
      setSessionForm({ name: "", school: "STME", batchYear: "1st year", deadline: "", maxStudents: 30 });
    } catch (error) {
      setError("Failed to create session");
    }
  };

  const addTestCase = () => {
    const newTestCase: TestCase = {
      id: `test_${Date.now()}`,
      input: "",
      expectedOutput: "",
      isHidden: false
    };
    setTaskForm(prev => ({
      ...prev,
      testCases: [...prev.testCases, newTestCase]
    }));
  };

  const updateTestCase = (index: number, field: keyof TestCase, value: string | boolean) => {
    setTaskForm(prev => ({
      ...prev,
      testCases: prev.testCases.map((testCase, i) => 
        i === index ? { ...testCase, [field]: value } : testCase
      )
    }));
  };

  const removeTestCase = (index: number) => {
    setTaskForm(prev => ({
      ...prev,
      testCases: prev.testCases.filter((_, i) => i !== index)
    }));
  };

  const viewStudentCode = async (studentId: string, taskId: string) => {
    const studentProgress = progress[keyFor(studentId, taskId)];
    if (!studentProgress?.code) {
      setError("No code submitted by this student.");
      return;
    }

    const task = filteredTasks.find(t => t.id === taskId);
    if (!task?.language || !task?.testCases) {
      setError("Cannot run code - no language or test cases configured.");
      return;
    }

    try {
      setError(null);
      const results = await codeExecutor.runTestCases(
        task.language,
        studentProgress.code,
        task.testCases
      );
      
      const score = codeExecutor.calculateScore(results, task.maxScore);
      
      // Show results in a modal or alert
      const passedTests = results.filter(r => r.passed).length;
      const totalTests = results.length;
      
      alert(`Test Results for ${students.find(s => s.id === studentId)?.name}:\n` +
            `Score: ${score}/${task.maxScore || 100}\n` +
            `Tests Passed: ${passedTests}/${totalTests}\n\n` +
            results.map((r, i) => 
              `Test ${i + 1}: ${r.passed ? '✓' : '✗'}\n` +
              (r.error ? `Error: ${r.error}\n` : `Output: ${r.actualOutput}\n`)
            ).join('\n'));
            
    } catch (error) {
      setError("Failed to run student code.");
    }
  };

  const createTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    try {
      const newTask: Task = {
        id: `task_${Date.now()}`,
        sessionId: selectedSession.id,
        title: taskForm.title,
        description: taskForm.description,
        task_order: tasks.length + 1,
        allowFileUpload: taskForm.allowFileUpload,
        language: taskForm.language,
        testCases: taskForm.testCases,
        maxScore: taskForm.maxScore
      };

      await firebaseOperations.pushData("tasks", newTask);
      setShowCreateTask(false);
      setTaskForm({ 
        title: "", 
        description: "", 
        allowFileUpload: false,
        language: "javascript",
        maxScore: 100,
        testCases: []
      });
    } catch (error) {
      setError("Failed to create task");
    }
  };

  const filteredTasks = selectedSession 
    ? tasks.filter(task => task.sessionId === selectedSession.id)
    : tasks;

  const filteredStudents = selectedSession
    ? students.filter(student => student.sessionId === selectedSession.id)
    : students;

  const totalCells = filteredStudents.length * filteredTasks.length;
  const doneCells = totalCells
    ? filteredStudents.reduce((acc, student) => {
        return (
          acc +
          filteredTasks.filter(
            (task) => getStatus(student.id, task.id, progress) === "done",
          ).length
        );
      }, 0)
    : 0;

  const completionRate = totalCells === 0 ? 0 : Math.round((doneCells / totalCells) * 100);

  const handleLogout = () => {
    authUtils.logout();
  };

  return (
    <AuthGuard requiredRole="faculty">
      <div className="relative mx-auto max-w-7xl px-6 py-12 sm:py-14">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-200/70">
                Faculty dashboard
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
              <h1 className="text-4xl font-semibold text-white sm:text-5xl">
                Mission Control Matrix
              </h1>
              <p className="max-w-3xl text-lg text-slate-200/80">
                Manage sessions and tasks. Watch student progress in real-time.
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateSession(true)}
              className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" />
              Create Session
            </button>
            {selectedSession && (
              <button
                onClick={() => setShowCreateTask(true)}
                className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:-translate-y-0.5"
              >
                <BookOpen className="h-4 w-4" />
                Add Task
              </button>
            )}
          </div>
        </div>

        {/* Sessions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Sessions</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setSelectedSession(session)}
                className={`cursor-pointer rounded-xl border p-4 transition hover:-translate-y-1 ${
                  selectedSession?.id === session.id
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-white/20 bg-white/5 hover:border-amber-500/50"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-white">{session.name}</h3>
                    <div className="mt-2 space-y-1 text-sm text-slate-300">
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        {session.school} - {session.batchYear}
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Deadline: {new Date(session.deadline).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-3 w-3" />
                        Students: {session.currentStudents || 0}/{session.maxStudents || 30}
                      </div>
                    </div>
                  </div>
                  <div className={`h-3 w-3 rounded-full ${session.isActive ? "bg-amber-400" : "bg-slate-400"}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Matrix */}
        {selectedSession && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-white">
                {selectedSession.name} - Progress Matrix
              </h2>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-slate-300">
                  Completion: {completionRate}%
                </span>
                <span
                  className={`flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 ${
                    livePulse ? "border-amber-500/50" : ""
                  }`}
                >
                  <span
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      livePulse ? "bg-amber-400 shadow-[0_0_0_6px_rgba(245,158,11,0.18)]" : "bg-slate-500"
                    }`}
                  />
                  Live
                </span>
              </div>
            </div>

            {filteredTasks.length === 0 || filteredStudents.length === 0 ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-12 text-center">
                <div className="mx-auto max-w-sm space-y-4">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                    <AlertTriangle className="h-8 w-8 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {filteredTasks.length === 0 ? "No tasks yet" : "No students yet"}
                    </h3>
                    <p className="text-slate-300/80">
                      {filteredTasks.length === 0 
                        ? "Create your first task to see the progress matrix."
                        : "Students will appear here when they join the session."
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/5">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-300">
                        Student
                      </th>
                      {filteredTasks.map((task) => (
                        <th
                          key={task.id}
                          className="px-4 py-3 text-center text-sm font-medium text-slate-300"
                        >
                          {task.title}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student.id} className="border-b border-white/5">
                        <td className="px-4 py-3 text-sm font-medium text-white">
                          {student.name}
                        </td>
                        {filteredTasks.map((task) => {
                          const status = getStatus(student.id, task.id, progress);
                          const meta = STATUS_META[status];
                          const studentProgress = progress[keyFor(student.id, task.id)];
                          const score = studentProgress?.score;
                          const hasCode = studentProgress?.code;
                          
                          return (
                            <td key={task.id} className="px-4 py-3 text-center">
                              <div className="space-y-1">
                                <div
                                  className={`mx-auto inline-flex items-center gap-2 rounded-full ${meta.bg} ${meta.border} px-3 py-1.5 text-xs font-medium ${meta.text}`}
                                >
                                  <span className={`h-2 w-2 rounded-full ${meta.dot}`} />
                                  {meta.label}
                                </div>
                                {score !== undefined && score !== null && (
                                  <div className="text-xs font-semibold text-amber-400">
                                    {score}/{task.maxScore || 100}
                                  </div>
                                )}
                                {hasCode && task.language && (
                                  <button
                                    onClick={() => viewStudentCode(student.id, task.id)}
                                    className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded hover:bg-blue-500/30"
                                  >
                                    Run Code
                                  </button>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Create Session Modal */}
        {showCreateSession && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
            <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Create Session</h3>
                <button
                  onClick={() => setShowCreateSession(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={createSession} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Session Name
                  </label>
                  <input
                    type="text"
                    value={sessionForm.name}
                    onChange={(e) => setSessionForm({ ...sessionForm, name: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-slate-400"
                    placeholder="e.g., Data Structures Lab"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    School
                  </label>
                  <select
                    value={sessionForm.school}
                    onChange={(e) => setSessionForm({ ...sessionForm, school: e.target.value as School })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
                  >
                    {SCHOOLS.map((school) => (
                      <option key={school} value={school}>
                        {school}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Batch Year
                  </label>
                  <select
                    value={sessionForm.batchYear}
                    onChange={(e) => setSessionForm({ ...sessionForm, batchYear: e.target.value as BatchYear })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
                  >
                    {BATCH_YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={sessionForm.deadline}
                    onChange={(e) => setSessionForm({ ...sessionForm, deadline: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Maximum Students
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={sessionForm.maxStudents}
                    onChange={(e) => setSessionForm({ ...sessionForm, maxStudents: parseInt(e.target.value) || 30 })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Create Session
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Create Task Modal */}
        {showCreateTask && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur">
            <div className="w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-white">Create Task</h3>
                <button
                  onClick={() => setShowCreateTask(false)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <form onSubmit={createTask} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Task Title
                  </label>
                  <input
                    type="text"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-slate-400"
                    placeholder="e.g., Implement Binary Search Tree"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Description
                  </label>
                  <textarea
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white placeholder-slate-400"
                    rows={3}
                    placeholder="Task instructions..."
                  />
                </div>
                <div>
                  <label className="flex items-center gap-3 text-sm font-medium text-slate-200">
                    <input
                      type="checkbox"
                      checked={taskForm.allowFileUpload}
                      onChange={(e) => setTaskForm({ ...taskForm, allowFileUpload: e.target.checked })}
                      className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/20"
                    />
                    Allow Document/PDF Upload
                  </label>
                  <p className="mt-1 text-xs text-slate-400">
                    Students can upload PDF or document files for this task
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Programming Language
                  </label>
                  <select
                    value={taskForm.language || ""}
                    onChange={(e) => setTaskForm({ ...taskForm, language: e.target.value as any })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
                  >
                    <option value="">None (Text only)</option>
                    {LANGUAGES.map((lang) => (
                      <option key={lang} value={lang}>
                        {lang.charAt(0).toUpperCase() + lang.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
                {taskForm.language && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-slate-200">
                        Test Cases
                      </label>
                      <button
                        type="button"
                        onClick={addTestCase}
                        className="text-xs bg-amber-500/20 text-amber-300 px-2 py-1 rounded hover:bg-amber-500/30"
                      >
                        Add Test Case
                      </button>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {taskForm.testCases.map((testCase, index) => (
                        <div key={testCase.id} className="flex gap-2 items-center">
                          <input
                            type="text"
                            placeholder="Input"
                            value={testCase.input}
                            onChange={(e) => updateTestCase(index, 'input', e.target.value)}
                            className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="Expected Output"
                            value={testCase.expectedOutput}
                            onChange={(e) => updateTestCase(index, 'expectedOutput', e.target.value)}
                            className="flex-1 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs text-white"
                          />
                          <button
                            type="button"
                            onClick={() => removeTestCase(index)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Maximum Score
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={taskForm.maxScore}
                    onChange={(e) => setTaskForm({ ...taskForm, maxScore: parseInt(e.target.value) || 100 })}
                    className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950"
                >
                  Create Task
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  );
}

export default function FacultyPage() {
  return <FacultyDashboard />;
}
