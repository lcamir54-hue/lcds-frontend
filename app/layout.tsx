import "@/styles/globals.css";

import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import type { ReactNode } from "react";

import { APP_DESCRIPTION, APP_NAME, APP_TITLE_FA } from "@/lib/constants";
import { AppProviders } from "@/providers/app-providers";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} · ${APP_TITLE_FA}`,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${vazirmatn.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
