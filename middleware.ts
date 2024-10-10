import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  afterAuth: (auth, req) => {
    const url = req.nextUrl.clone();
    const baseUrl = `${url.protocol}//${url.host}`;  // 动态获取主机地址

    // 如果用户没有登录，并且尝试访问 "/settings"，重定向到登录页面
    if (!auth.userId && req.nextUrl.pathname === "/settings") {
      return NextResponse.redirect(`${baseUrl}/sign-in`);  // 绝对 URL
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
