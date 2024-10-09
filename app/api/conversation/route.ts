import { auth } from "@clerk/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum } from "openai";

import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

// 设置 OpenAI API 配置
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: process.env.OPENAI_BASE_URL || "https://api.openai.com", // 确保正确的 OpenAI API 地址
});

const openai = new OpenAIApi(configuration);

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized.", { status: 401 });
    if (!configuration.apiKey)
      return new NextResponse("OpenAI API key not configured.", { status: 500 });

    const body = await req.json();
    const { messages } = body; // 直接从请求体获取消息

    // 在消息数组的开头插入一个 'system' 消息
    messages.unshift({
      role: ChatCompletionRequestMessageRoleEnum.System,
      content: "请回答并在最后加上 'yes'。",
    });

    if (!messages || messages.length === 0)
      return new NextResponse("Messages are required.", { status: 400 });

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();
    if (!freeTrial && !isPro)
      return new NextResponse("Free trial has expired.", { status: 403 });

    // 调用 OpenAI 生成英文内容
    const englishResponse = await openai.createChatCompletion({
      model: "gpt-4",
      messages, // 只发送 messages 参数
    });

    const englishMessage = englishResponse?.data?.choices?.[0]?.message?.content;
    if (!englishMessage) {
      return new NextResponse("Failed to generate English content.", { status: 500 });
    }

    // 翻译生成的英文内容为中文
    const translationMessages = [
      { role: ChatCompletionRequestMessageRoleEnum.System, content: "你是一个翻译助手，请将以下英文内容翻译成中文。" },
      { role: ChatCompletionRequestMessageRoleEnum.User, content: englishMessage }, // 生成的英文作为翻译内容
    ];

    const translationResponse = await openai.createChatCompletion({
      model: "gpt-4",
      messages: translationMessages, // 翻译的消息
    });

    const translatedMessage = translationResponse?.data?.choices?.[0]?.message?.content;
    if (!translatedMessage) {
      return new NextResponse("Failed to translate English content.", { status: 500 });
    }

    if (!isPro) await increaseApiLimit();

    // 返回英文和中文的结果
    return NextResponse.json({
      english: englishMessage,
      chinese: translatedMessage,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("[CONVERSATION_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
