import { auth } from "@clerk/nextjs";
import { db } from "./db";

const DAY_IN_MS = 86_400_000;

export const checkSubscription = async () => {
  const { userId } = auth();

  // 如果用户未登录，返回 false
  if (!userId) {
    console.log("User not authenticated.");
    return false;
  }

  // 查询用户的订阅状态
  const userSubscription = await db.userSubscription.findUnique({
    where: {
      userId,
    },
    select: {
      stripeSubscriptionId: true,
      stripeCurrentPeriodEnd: true,
      stripeCustomerId: true,
      stripePriceId: true,
    },
  });

  // 如果用户没有订阅记录，返回 false
  if (!userSubscription) {
    console.log(`No subscription found for user: ${userId}`);
    return false;
  }

  console.log(`Subscription found for user: ${userId}`, userSubscription);  // 输出用户订阅信息

  // 计算订阅是否仍然有效
  const isSubscribed =
    userSubscription.stripePriceId &&
    userSubscription.stripeCurrentPeriodEnd?.getTime()! + DAY_IN_MS > Date.now();

  console.log(`User ${userId} is subscribed: ${isSubscribed}`);  // 输出订阅状态

  return !!isSubscribed;  // 返回是否订阅
};
