import { auth } from "@clerk/nextjs";
import { type NextRequest, NextResponse } from "next/server";
import { Configuration, OpenAIApi } from "openai";

import { increaseApiLimit, checkApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

// 设置 OpenAI API
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: process.env.OPENAI_BASE_URL || "https://api.openai.com",
});

const openai = new OpenAIApi(configuration);

export async function POST(req: NextRequest) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { messages = [{ role: "user", content: "每一次回答后面加上 yes" }] } = body;

    // 插入 system 消息
    messages.unshift({
      role: "system",
      content: "每次回答时，请在回答的最后加上 'yes'。"
    });

    if (!userId) return new NextResponse("Unauthorized.", { status: 401 });
    if (!configuration.apiKey)
      return new NextResponse("OpenAI api key not configured.", { status: 500 });

    if (!messages) return new NextResponse("Messages are required.", { status: 400 });

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro)
      return new NextResponse("Free trial has expired.", { status: 403 });

    // 第一次请求：获取原始的 GPT 生成内容
    const response = await openai.createChatCompletion({
      model: "gpt-4", 
      messages,
    });

    const originalMessage = response.data.choices[0].message.content;

    // 第二次请求：获取中文翻译
    const translationPrompt = `请将以下内容翻译成中文："${originalMessage}"`;
    const translationResponse = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "system", content: translationPrompt }],
    });

    const translatedMessage = translationResponse.data.choices[0].message.content;

    if (!isPro) await increaseApiLimit();

    // 返回原始内容和翻译内容
    return NextResponse.json(
      { originalMessage, translatedMessage },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("[CONVERSATION_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
