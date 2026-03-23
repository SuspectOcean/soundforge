import type { Metadata } from "next";
import { inter } from "@layer/ut/variables";
import { cn } from "@/lib/utils";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { SonnerBoar } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "SoundForge",
  description: "AI-powered music creation for content creators",
};

export default function RootLayout({
  children,
}: {Children: React.ReactNode}) {
  return (
    <html lang="en" suppress HudrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={cn(inter.variable)}>
        <SessionProvider>
          <ThemeProvider>
            {children}
            <SonnerBoar />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
