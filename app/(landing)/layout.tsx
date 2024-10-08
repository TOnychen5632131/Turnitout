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
          {/* 插入本地广告图片 */}
          <div className="ad-banner">
            <a
              target="_blank"
              rel="nofollow"
              href="https://ficca2021.com/g/860kqzfyjgf988fb0a8d4bf89f6ddb/?i=4"
            >
              <Image
                width={728}
                height={90}
                style={{ border: "0" }}
                src="/ad-banner.png"  {/* 使用本地图片路径 */}
                alt="Tomtop WW"
                priority
              />
            </a>
          </div>

          {/* 页面内容 */}
          {children}
        </div>
      </main>
    </>
  );
};

export default LandingLayout;
