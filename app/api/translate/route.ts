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
    const { englishMessage } = body; // 从请求体中获取需要翻译的英文消息

    if (!englishMessage)
      return new NextResponse("English message is required.", { status: 400 });

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();
    if (!freeTrial && !isPro)
      return new NextResponse("Free trial has expired.", { status: 403 });

    // 准备翻译请求
    const translationMessages = [
      { role: ChatCompletionRequestMessageRoleEnum.System, content: "你是一个翻译助手，请将以下英文内容翻译成中文。" },
      { role: ChatCompletionRequestMessageRoleEnum.User, content: englishMessage }, // 将英文内容发送给翻译请求
    ];

    // 调用 OpenAI 进行翻译
    const translationResponse = await openai.createChatCompletion({
      model: "gpt-4",
      messages: translationMessages,
    });

    const translatedMessage = translationResponse?.data?.choices?.[0]?.message?.content;
    if (!translatedMessage) {
      return new NextResponse("Failed to translate content.", { status: 500 });
    }

    if (!isPro) await increaseApiLimit();

    // 返回翻译后的中文内容
    return NextResponse.json({ chinese: translatedMessage }, { status: 200 });

  } catch (error: unknown) {
    console.error("[TRANSLATION_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
