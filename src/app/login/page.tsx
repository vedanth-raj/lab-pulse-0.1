"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, GraduationCap, Users } from "lucide-react";
import { getFirebaseClient, firebaseOperations } from "@/lib/firebaseClient";
import { User as UserType } from "@/lib/types";

export default function LoginPage() {
  const router = useRouter();
  const { database } = getFirebaseClient();
  
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"faculty" | "student">("faculty");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === "faculty") {
        router.push("/faculty");
      } else {
        router.push("/student");
      }
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Query users from Firebase
      const usersRef = `users`;
      const users: Record<string, UserType> = await new Promise((resolve) => {
        const unsubscribe = firebaseOperations.subscribeToPath(usersRef, (data) => {
          resolve(data || {});
          unsubscribe();
        });
      });

      // Find user by username and role
      const user = Object.values(users).find(
        (u) => u.username === username && u.role === role && u.password === password
      );

      if (user) {
        // Store user in localStorage
        localStorage.setItem("currentUser", JSON.stringify(user));
        
        // Redirect based on role
        if (user.role === "faculty") {
          router.push("/faculty");
        } else {
          router.push("/student");
        }
      } else {
        setError("Invalid username, password, or role");
      }
    } catch (err) {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative isolate overflow-hidden min-h-screen">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.12),_transparent_35%),radial-gradient(circle_at_30%_10%,_rgba(34,197,94,0.12),_transparent_25%),radial-gradient(circle_at_70%_20%,_rgba(244,114,182,0.12),_transparent_25%)]" />
      
      <main className="relative mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12">
        <div className="w-full space-y-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-white/5 p-8 shadow-2xl shadow-amber-500/10 backdrop-blur">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold text-white">Lab Pulse</h1>
            <p className="text-slate-300/80">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole("faculty")}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      role === "faculty"
                        ? "border-amber-500 bg-amber-500/20 text-amber-200"
                        : "border-white/20 bg-white/5 text-slate-300 hover:border-amber-500/50"
                    }`}
                  >
                    <GraduationCap className="h-4 w-4" />
                    Faculty
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("student")}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition ${
                      role === "student"
                        ? "border-amber-500 bg-amber-500/20 text-amber-200"
                        : "border-white/20 bg-white/5 text-slate-300 hover:border-amber-500/50"
                    }`}
                  >
                    <Users className="h-4 w-4" />
                    Student
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-200 mb-2">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/5 pl-10 pr-4 py-2 text-white placeholder-slate-400 backdrop-blur transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Enter your username"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-white/20 bg-white/5 pl-10 pr-4 py-2 text-white placeholder-slate-400 backdrop-blur transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Enter your password"
                    required
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-slate-950 shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-xs text-slate-400">
              Demo: Use faculty/faculty or student/student
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
