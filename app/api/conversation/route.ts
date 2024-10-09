import { auth } from "@clerk/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum } from "openai";

import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

// 设置 OpenAI API 配置
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: process.env.OPENAI_BASE_URL || "https://api.openai.com", // 使用正确的 OpenAI API 地址
});

const openai = new OpenAIApi(configuration);

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized.", { status: 401 });
    if (!configuration.apiKey)
      return new NextResponse("OpenAI API key not configured.", { status: 500 });

    const body = await req.json();
    const { messages } = body; // 从请求体中获取消息

    if (!messages || messages.length === 0)
      return new NextResponse("Messages are required.", { status: 400 });

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();
    if (!freeTrial && !isPro)
      return new NextResponse("Free trial has expired.", { status: 403 });

    // 添加一个 'system' 消息
    messages.unshift({
      role: ChatCompletionRequestMessageRoleEnum.System,
      content: "请回答并在最后加上 'yes'。",
    });

    // 调用 OpenAI 生成对话内容
    const conversationResponse = await openai.createChatCompletion({
      model: "gpt-4",
      messages,
    });

    const englishMessage = conversationResponse?.data?.choices?.[0]?.message?.content;
    if (!englishMessage) {
      return new NextResponse("Failed to generate conversation.", { status: 500 });
    }

    if (!isPro) await increaseApiLimit();

    // 返回生成的英文对话
    return NextResponse.json({ english: englishMessage }, { status: 200 });

  } catch (error: unknown) {
    console.error("[CONVERSATION_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
