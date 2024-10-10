import { Configuration, OpenAIApi } from "openai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { checkApiLimit, increaseApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

// 配置 OpenAI API
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
  basePath: process.env.OPENAI_BASE_URL || "https://api.openai.com",
});

const openai = new OpenAIApi(configuration);

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const body = await req.json();
    const { messages, action, originalMessage } = body; // 检查 originalMessage

    if (!userId) {
      return new NextResponse("Unauthorized.", { status: 401 });
    }

    if (!configuration.apiKey) {
      return new NextResponse("OpenAI API key not configured.", { status: 500 });
    }

    // 检查用户是否有免费试用期或是否为 Pro 用户
    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro) {
      return new NextResponse("Free trial has expired.", { status: 403 });
    }

    if (action === "generate") {
      // 处理生成英文的逻辑
      if (!messages || messages.length === 0) {
        return new NextResponse("Messages are required.", { status: 400 });
      }

      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages,
      });

      const originalMessage = response?.data?.choices?.[0]?.message?.content;

      if (originalMessage) {
        // 如果用户不是 Pro 用户，增加 API 调用限制计数
        if (!isPro) {
          await increaseApiLimit();
        }

        return NextResponse.json({ originalMessage }, { status: 200 });
      } else {
        return new NextResponse("Invalid response from OpenAI", { status: 500 });
      }
    } else if (action === "translate") {
      // 处理翻译的逻辑
      if (!originalMessage) {
        return new NextResponse("Original message is required for translation.", { status: 400 });
      }

      const translationPrompt = `请将以下内容翻译成中文："${originalMessage}"`;

      const translationResponse = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "system", content: translationPrompt }],
      });

      const translatedMessage = translationResponse?.data?.choices?.[0]?.message?.content;

      if (translatedMessage) {
        return NextResponse.json({ translatedMessage }, { status: 200 });
      } else {
        return new NextResponse("Invalid translation response from OpenAI", { status: 500 });
      }
    } else {
      return new NextResponse("Invalid action.", { status: 400 });
    }
  } catch (error) {
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
