import Head from "next/head";
import type { PropsWithChildren } from "react";

const LandingLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <Head>
        {/* 插入 Meta 验证标签 */}
        <meta name="verify-admitad" content="f988fb0a8d" />
      </Head>
      <main className="h-full bg-[#111827] overflow-auto">
        <div className="mx-auto max-w-screen-xl h-full w-full">{children}</div>
      </main>
    </>
  );
};

export default LandingLayout;
