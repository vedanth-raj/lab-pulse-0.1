import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import FloatingLines from "@/components/FloatingLines";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lab Pulse | Real-time progress matrix for labs",
  description:
    "Mission control for lab sessions with live student-task matrix, Firebase realtime, and Next.js app.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#800020" />
        <script>
          {`
            tailwind.config = {
              theme: {
                extend: {
                  colors: {
                    'maroon': {
                      50: '#fff7ed',
                      100: '#ffedd5',
                      200: '#fed7aa',
                      300: '#fdba74',
                      400: '#f59e0b',
                      500: '#f59e0b',
                      600: '#d97706',
                      700: '#b45309',
                      800: '#92400e',
                      900: '#78350f',
                      950: '#451a03',
                    },
                  },
                },
              },
            }
          `}
        </script>
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gradient-to-br from-gray-900 via-maroon-900 to-black text-white`}
      >
        <div className="relative min-h-screen">
          <div className="absolute inset-0">
            <FloatingLines
              enabledWaves={["top", "middle", "bottom"]}
              lineCount={5}
              lineDistance={25.5}
              bendRadius={6}
              bendStrength={2}
              interactive
              parallax
            />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(217,119,6,0.16),transparent_35%),radial-gradient(circle_at_25%_15%,_rgba(245,158,11,0.1),transparent_25%),radial-gradient(circle_at_75%_20%,_rgba(253,186,116,0.08),transparent_25%)]" />
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
