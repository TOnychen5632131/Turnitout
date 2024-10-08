import Head from "next/head";
import Image from "next/image";
import type { PropsWithChildren } from "react";

const LandingLayout = ({ children }: PropsWithChildren) => {
  return (
    <>
      <Head>
        {/* 插入 Meta 验证标签 */}
        <meta name="verify-admitad" content="f988fb0a8d" />
      </Head>
      <main className="h-full bg-[#111827] overflow-auto">
        <div className="mx-auto max-w-screen-xl h-full w-full">
          {/* 插入广告代码 */}
          <div className="ad-banner">
            {/* admitad.banner: p173w2r5daf988fb0a8d4bf89f6ddb Tomtop WW */}
            <a
              target="_blank"
              rel="nofollow"
              href="https://ficca2021.com/g/860kqzfyjgf988fb0a8d4bf89f6ddb/?i=4"
            >
              <Image
                width={728}
                height={90}
                style={{ border: "0" }}
                src="https://cdn.admitad-connect.com/public/bs/2023/11/03/728x90.1fa9.gif"
                alt="Tomtop WW"
                priority
              />
            </a>
            {/* /admitad.banner */}
          </div>

          {/* 页面内容 */}
          {children}
        </div>
      </main>
    </>
  );
};

export default LandingLayout;
