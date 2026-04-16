import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

export const metadata: Metadata = {
  title: "Scripture — Bible Study Tracker",
  description:
    "Track your Bible reading, build streaks, join study groups, and grow in faith together.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Scripture — Bible Study Tracker",
    description: "Your daily Bible companion",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: "var(--bg-card)",
                  color: "var(--text-primary)",
                  border: "1px solid var(--border)",
                  borderRadius: "0.75rem",
                  fontFamily: "Inter, sans-serif",
                  fontSize: "0.875rem",
                },
                success: {
                  iconTheme: { primary: "#D4AF37", secondary: "#1a0a0a" },
                },
              }}
            />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
