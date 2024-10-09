import { auth } from "@clerk/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai";

import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

// 设置自定义 OpenAI API URL
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: process.env.OPENAI_BASE_URL || "https://api.openai.com", // 使用 OpenAI 官方 API 地址
});

const openai = new OpenAIApi(configuration);

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    const body = await req.json();
    const { messages } = body;

    if (!userId) return new NextResponse("Unauthorized.", { status: 401 });
    if (!configuration.apiKey)
      return new NextResponse("OpenAI API key not configured.", {
        status: 500,
      });

    if (!messages || messages.length === 0)
      return new NextResponse("Messages are required.", { status: 400 });

    // 检查是否是免费试用或付费用户
    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro)
      return new NextResponse("Free trial has expired.", { status: 403 });

    // 在消息数组中插入系统指令，要求翻译
    const translationMessages = [
      {
        role: "system",
        content: "你是一个翻译助手，请将以下英文内容翻译成中文。"
      },
      ...messages // 保留传递过来的用户输入
    ];

    // 调用 OpenAI 进行翻译
    const response = await openai.createChatCompletion({
      model: "gpt-4",
      messages: translationMessages, // 提供消息数组
    });

    if (!isPro) await increaseApiLimit();

    // 返回翻译结果
    return NextResponse.json(response.data.choices[0].message, { status: 200 });
  } catch (error: unknown) {
    console.error("[TRANSLATION_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
