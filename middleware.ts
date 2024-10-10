import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  afterAuth: (auth, req) => {
    // 如果用户没有登录，并且尝试访问 "/settings"，重定向到登录页面
    if (!auth.userId && req.nextUrl.pathname === "/settings") {
      return NextResponse.redirect("/sign-in");
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
