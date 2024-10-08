import Head from "next/head";
import type { PropsWithChildren } from "react";

const LandingLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <Head>
        {/* 插入广告 */}
        <script src="https://ad.admitad.com/b/p173w2r5daf988fb0a8d4bf89f6ddb/"></script>
      </Head>
      <main className="h-full bg-[#111827] overflow-auto">
        <div className="mx-auto max-w-screen-xl h-full w-full">
          {/* 广告插入的区域 */}
          <div className="ad-banner">
            <a
              target="_blank"
              rel="nofollow"
              href="https://ficca2021.com/g/p173w2r5daf988fb0a8d4bf89f6ddb/?i=4"
            >
              <img
                width="120"
                height="600"
                style={{ border: 0 }}
                src="https://ad.admitad.com/b/p173w2r5daf988fb0a8d4bf89f6ddb/"
                alt="Tomtop WW"
              />
            </a>
          </div>
          {children}
        </div>
      </main>
    </>
  );
};

export default LandingLayout;
