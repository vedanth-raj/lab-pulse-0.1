import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
                      50: '#fdf2f4',
                      100: '#fce7eb',
                      200: '#f9d0d9',
                      300: '#f4a8b8',
                      400: '#ec7491',
                      500: '#e0486d',
                      600: '#cc2952',
                      700: '#800020',
                      800: '#6b001a',
                      900: '#5a0016',
                      950: '#3d000f',
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
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(128,0,32,0.16),transparent_35%),radial-gradient(circle_at_25%_15%,_rgba(204,41,82,0.1),transparent_25%),radial-gradient(circle_at_75%_20%,_rgba(236,72,153,0.08),transparent_25%)]" />
          <div className="relative z-10">{children}</div>
        </div>
      </body>
    </html>
  );
}
