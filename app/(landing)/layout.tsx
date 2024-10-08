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
        <div className="mx-auto max-w-screen-xl h-full w-full">
          {/* 插入广告代码 */}
          <div className="ad-banner">
            {/* admitad.banner: p173w2r5daf988fb0a8d4bf89f6ddb Tomtop WW */}
            <a target="_blank" rel="nofollow" href="https://ficca2021.com/g/xljorca896f988fb0a8d4bf89f6ddb/">
              <img
                width="120"
                height="600"
                style={{ border: "0" }} // 使用 inline 样式来代替 border 属性
                src="https://ad.admitad.com/b/p173w2r5daf988fb0a8d4bf89f6ddb/"
                alt="Tomtop WW"
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
