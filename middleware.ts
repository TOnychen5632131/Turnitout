import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: [
    "/", 
    "/sign-in", 
    "/sign-up", 
    "/pricing", 
    "/api/stripe", 
    "/api/webhook",
    "/conversation",   // 添加 conversation 路径
    "/dashboard"       // 添加 dashboard 路径
  ],
  ignoredRoutes: ["/api/webhook"],  // 确保 webhook 路径不会被保护
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],  // 路由匹配
};
