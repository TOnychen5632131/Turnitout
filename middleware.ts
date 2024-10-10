import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/sign-in", "/sign-up", "/pricing", "/api/stripe"],  // 确保 /api/stripe 路径可以被未登录用户访问
  ignoredRoutes: ["/api/webhook"],  // 确保 webhook 路径不会被保护
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],  // 路由匹配
};
