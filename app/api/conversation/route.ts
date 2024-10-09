import { auth } from "@clerk/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai";

import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

// 设置自定义 OpenAI API URL
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: process.env.OPENAI_BASE_URL || "https://api.openai.com", // 自定义 URL 或默认 URL
});

const openai = new OpenAIApi(configuration);

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();

    const body = await req.json();
    const { messages = [{ role: "user", content: "每一次回答后面加上 yes" }] } = body;

    // 在消息数组的开头插入一个 system 消息
    messages.unshift({
      role: "system",
      content: "每次回答时，请在回答的最后加上 'yes'。"
    });

    if (!userId) return new NextResponse("Unauthorized.", { status: 401 });
    if (!configuration.apiKey)
      return new NextResponse("OpenAI api key not configured.", {
        status: 500,
      });

    if (!messages)
      return new NextResponse("Messages are required.", { status: 400 });

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro)
      return new NextResponse("Free trial has expired.", { status: 403 });

    const response = await openai.createChatCompletion({
      model: "gpt-4o", // 修正为有效的模型名称
      messages,
    });

    if (!isPro) await increaseApiLimit();

    return NextResponse.json(response.data.choices[0].message, { status: 200 });
  } catch (error: unknown) {
    console.error("[CONVERSATION_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}