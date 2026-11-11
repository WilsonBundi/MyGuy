import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";
import { ThemeProvider } from "@/components/ThemeProvider";
import OnlineStatusManager from "@/components/OnlineStatusManager";
import "@/lib/fontawesome";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyGuy - People. Moments. Everywhere.",
  description: "Your international social network for people, conversations, communities, and moments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const theme = localStorage.getItem('theme');
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body className={inter.className + " transition-colors duration-300"}>
        <ThemeProvider>
          <Providers>
            <OnlineStatusManager />
            {children}
          </Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
