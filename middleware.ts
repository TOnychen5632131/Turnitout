import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export default authMiddleware({
  ignoredRoutes: ["/api/webhook"],  // 添加 webhook 路径到忽略列表
  publicRoutes: ["/", "/api/webhook"],  // 如果需要的话，也可以放到 publicRoutes
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
