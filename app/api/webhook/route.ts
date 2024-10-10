import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  console.log("Webhook received");  // 日志：Webhook 请求已收到
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  // 验证并构建事件对象
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
    console.log('Webhook event received:', event.type);  // 日志：Webhook 事件类型
  } catch (error: any) {
    console.error('Webhook Error:', error?.message);  // 错误日志
    return new NextResponse(`Webhook Error: ${error?.message}`, {
      status: 400,
    });
  }

  // 确保我们可以正确解析事件对象
  const session = event.data.object as Stripe.Checkout.Session;
  console.log("Session object parsed successfully"); // 日志：Session 解析成功

  // 处理 checkout.session.completed 事件
  if (event.type === "checkout.session.completed") {
    console.log('Handling checkout.session.completed');  // 日志

    try {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      );
      console.log('Subscription retrieved:', subscription.id);  // 日志：订阅已检索

      // 检查是否有 userId
      if (!session?.metadata?.userId) {
        console.error('User ID not found in session metadata');  // 错误日志
        return new NextResponse("User id is required.", { status: 400 });
      }

      // 创建用户订阅
      await db.userSubscription.create({
        data: {
          userId: session.metadata.userId, // 从 metadata 获取 userId
          stripeSubscriptionId: subscription.id,
          stripeCustomerId: subscription.customer as string,
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
      console.log('User subscription created for:', session.metadata.userId);  // 日志
    } catch (err) {
      console.error('Database Error (userSubscription.create):', err);  // 错误日志
      return new NextResponse("Database Error", { status: 500 });
    }
  }

  // 处理 invoice.payment_succeeded 事件
  if (event.type === "invoice.payment_succeeded") {
    console.log('Handling invoice.payment_succeeded');  // 日志
    try {
      const invoice = event.data.object as Stripe.Invoice;

      // 从 invoice.subscription 获取订阅 ID
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription as string, // 使用 invoice.subscription
      );

      console.log('Subscription retrieved for invoice:', subscription.id);  // 日志

      // 更新用户订阅
      await db.userSubscription.update({
        where: {
          stripeSubscriptionId: subscription.id,
        },
        data: {
          stripePriceId: subscription.items.data[0].price.id,
          stripeCurrentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
      console.log('User subscription updated for subscription ID:', subscription.id);  // 日志
    } catch (err) {
      console.error('Database Error (userSubscription.update):', err);  // 错误日志
      return new NextResponse("Database Error", { status: 500 });
    }
  }

  console.log('Webhook handled successfully');  // 最后日志：处理完成
  return new NextResponse(null, { status: 200 });
}
