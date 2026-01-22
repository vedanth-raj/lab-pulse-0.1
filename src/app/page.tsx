"use client";

import Link from "next/link";
import { Activity, RadioTower, Sparkles, Timer } from "lucide-react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authUtils } from "@/lib/auth";

const highlights = [
  {
    title: "Mission Control Matrix",
    body: "Rows are students, columns are tasks. Status colors pulse in real time.",
    icon: <Activity className="h-5 w-5 text-maroon-400" />,
  },
  {
    title: "Zero-refresh updates",
    body: "Firebase realtime streams changes as soon as students submit.",
    icon: <RadioTower className="h-5 w-5 text-maroon-300" />,
  },
  {
    title: "Student-friendly",
    body: "Guided task list with quick status chips and space to paste code/output.",
    icon: <Sparkles className="h-5 w-5 text-maroon-200" />,
  },
  {
    title: "Ship to Vercel",
    body: "Next.js App Router + Tailwind ready for one-click deploy.",
    icon: <Timer className="h-5 w-5 text-maroon-500" />,
  },
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in and redirect accordingly
    const user = authUtils.getCurrentUser();
    if (user) {
      if (user.role === "faculty") {
        router.push("/faculty");
      } else {
        router.push("/student");
      }
    }
  }, [router]);

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(128,0,32,0.16),_transparent_35%),radial-gradient(circle_at_30%_10%,_rgba(204,41,82,0.12),_transparent_25%),radial-gradient(circle_at_70%_20%,_rgba(236,72,153,0.08),_transparent_25%)]" />
      <main className="relative mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-16 sm:py-20 lg:py-24">
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-maroon-600/30 bg-maroon-900/20 px-4 py-2 text-sm text-maroon-200 shadow-lg shadow-maroon-700/10">
              <span className="h-2 w-2 animate-pulse rounded-full bg-maroon-400" />
              Live visibility for lab sessions
            </div>
            <div className="space-y-4">
              <h1 className="text-balance text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Lab <span className="text-maroon-400">Pulse</span>: Real-time progress matrix for every lab seat.
              </h1>
              <p className="text-lg leading-relaxed text-gray-300/80 sm:text-xl">
                See who is stuck on Task 1, who is cruising, and who has
                submitted — without walking to room. Students get a focused
                task view with quick status + code/output share.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/login"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-maroon-700 to-maroon-900 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-maroon-700/20 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-maroon-700/25 border-2 border-maroon-600"
              >
                Get Started
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
              <div className="text-sm text-gray-300/80">
                Login to access your dashboard
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {highlights.map((item) => (
                <div
                  key={item.title}
                  className="flex gap-3 rounded-2xl border border-maroon-600/20 bg-maroon-900/10 p-4 shadow-inner shadow-black/30 backdrop-blur"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-maroon-600/30 bg-maroon-800/20">
                    {item.icon}
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      {item.title}
                    </p>
                    <p className="text-sm text-slate-300/80">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="w-full max-w-md space-y-5 rounded-3xl border border-white/10 bg-gradient-to-b from-white/10 via-white/5 to-white/5 p-6 shadow-2xl shadow-emerald-500/10 backdrop-blur">
            <div className="space-y-2">
              <p className="text-sm uppercase tracking-[0.2em] text-slate-200/70">
                Firebase quick start
              </p>
              <h2 className="text-2xl font-semibold text-white">
                Plug in your project keys and go live.
              </h2>
              <p className="text-sm text-slate-200/80">
                Add your keys to Vercel or a local <code>.env.local</code>.
              </p>
            </div>
            <div className="space-y-3 rounded-2xl border border-white/10 bg-black/40 p-4 font-mono text-xs text-slate-100 shadow-inner shadow-black/40">
              <p className="text-emerald-200"># .env.local</p>
              <p>FIREBASE_API_KEY=your-api-key</p>
              <p>FIREBASE_AUTH_DOMAIN=your-auth-domain</p>
              <p>FIREBASE_PROJECT_ID=your-project-id</p>
            </div>
            <div className="space-y-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-50 shadow-lg shadow-emerald-500/15">
              <p className="font-semibold">Ship to Vercel</p>
              <p className="text-emerald-100/80">
                This template is tuned for the App Router, React 19, Tailwind 4,
                and Firebase realtime. Deploy to Vercel, add env vars, and
                you&apos;re live.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
