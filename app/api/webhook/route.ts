import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

import { db } from "@/lib/db";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = headers().get("Stripe-Signature") as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (error: any) {
    return new NextResponse(`Webhook Error: ${error?.message}`, {
      status: 400,
    });
  }

  // 确保我们可以正确解析事件对象
  const session = event.data.object as Stripe.Checkout.Session;

  // 处理 checkout.session.completed 事件
  if (event.type === "checkout.session.completed") {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );

    // 检查是否有 userId
    if (!session?.metadata?.userId) {
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
  }

  // 处理 invoice.payment_succeeded 事件
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object as Stripe.Invoice;

    // 从 invoice.subscription 获取订阅 ID
    const subscription = await stripe.subscriptions.retrieve(
      invoice.subscription as string, // 使用 invoice.subscription
    );

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
  }

  return new NextResponse(null, { status: 200 });
}
