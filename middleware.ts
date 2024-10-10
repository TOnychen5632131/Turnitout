import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  publicRoutes: ["/", "/api/webhook", "/settings"],  // 将 /settings 添加到 publicRoutes
  afterAuth: (auth, req) => {
    const url = req.nextUrl.clone();
    const baseUrl = `${url.protocol}//${url.host}`;

    if (!auth.userId && req.nextUrl.pathname === "/settings") {
      return NextResponse.redirect(`${baseUrl}/sign-in`);
    }
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
