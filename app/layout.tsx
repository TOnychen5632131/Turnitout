import { ClerkProvider } from "@clerk/nextjs";
import Head from "next/head";  // 导入 Head 组件
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { PropsWithChildren } from "react";

import { siteConfig } from "@/config";
import { CrispProvider } from "@/providers/crisp-provider";
import { ModalProvider } from "@/providers/modal-provider";
import { ToasterProvider } from "@/providers/toaster-provider";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = siteConfig;

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#6F5AF6",
        },
        layout: {
          logoPlacement: "none",
        },
      }}
    >
      <html lang="en">
        <Head>
          {/* 插入 Meta 验证标签 */}
          <meta name="verify-admitad" content="f988fb0a8d" />
        </Head>
        <CrispProvider />
        <body className={inter.className}>
          <ModalProvider />
          <ToasterProvider />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
