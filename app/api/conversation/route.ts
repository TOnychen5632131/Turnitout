import { auth } from "@clerk/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { Configuration, OpenAIApi, ChatCompletionRequestMessageRoleEnum } from "openai";

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
      role: ChatCompletionRequestMessageRoleEnum.System, // 这里将 role 设置为 'system' 枚举类型
      content: "每次回答时，请在回答的最后加上 'yes'。",
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

    // 调用 OpenAI 生成英文内容
    const englishResponse = await openai.createChatCompletion({
      model: "gpt-4",
      messages,
    });

    const englishMessage = englishResponse?.data?.choices?.[0]?.message?.content;

    // 检查生成的英文内容是否有效
    if (!englishMessage) {
      return new NextResponse("Failed to generate English content.", { status: 500 });
    }

    // 使用 OpenAI API 将英文内容翻译为中文
    const translationMessages = [
      { role: ChatCompletionRequestMessageRoleEnum.System, content: "你是一个翻译助手，请将给定的英文内容翻译成中文。" }, // 正确使用 ChatCompletionRequestMessageRoleEnum
      { role: ChatCompletionRequestMessageRoleEnum.User, content: englishMessage }, // 将生成的英文作为用户消息传递给翻译请求
    ];

    const translationResponse = await openai.createChatCompletion({
      model: "gpt-4",
      messages: translationMessages,
    });

    const translatedMessage = translationResponse?.data?.choices?.[0]?.message?.content;

    // 检查生成的中文翻译是否有效
    if (!translatedMessage) {
      return new NextResponse("Failed to translate English content.", { status: 500 });
    }

    if (!isPro) await increaseApiLimit();

    // 返回英文和中文翻译结果
    return NextResponse.json({
      english: englishMessage,
      chinese: translatedMessage,
    }, { status: 200 });

  } catch (error: unknown) {
    console.error("[CONVERSATION_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
