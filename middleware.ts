import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/dashboard"], // 添加你希望公开访问的路径
  ignoredRoutes: ["/api/stripe"], // 忽略 Webhook 路由，防止身份验证
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
