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
    const { messages, action } = body; // 根据前端传来的 action 判断是生成英文还是翻译

    if (!userId) {
      console.error("Unauthorized request, userId is missing");
      return new NextResponse("Unauthorized.", { status: 401 });
    }

    if (!configuration.apiKey) {
      console.error("OpenAI API key is not configured");
      return new NextResponse("OpenAI API key not configured.", { status: 500 });
    }

    if (!messages || messages.length === 0) {
      console.error("No messages found in the request");
      return new NextResponse("Messages are required.", { status: 400 });
    }

    // 检查用户是否有免费试用期或是否为 Pro 用户
    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro) {
      console.warn("Free trial has expired or user is not a Pro member");
      return new NextResponse("Free trial has expired.", { status: 403 });
    }

    if (action === "generate") {
      // 第一次请求：获取 GPT 生成的英文内容
      console.log("Sending request to OpenAI for original message...");
      const response = await openai.createChatCompletion({
        model: "gpt-4",
        messages,
      });

      if (response?.data?.choices?.[0]?.message?.content) {
        const originalMessage = response.data.choices[0].message.content;
        console.log("Received original message from OpenAI:", originalMessage);

        // 如果用户不是 Pro 用户，增加 API 调用限制计数
        if (!isPro) {
          await increaseApiLimit();
          console.log("API limit increased for free trial user.");
        }

        // 返回英文内容
        return NextResponse.json({ originalMessage }, { status: 200 });
      } else {
        console.error("Invalid response data from OpenAI");
        return new NextResponse("Invalid response from OpenAI", { status: 500 });
      }
    } else if (action === "translate") {
      // 第二次请求：生成翻译
      const { originalMessage } = body;

      if (!originalMessage) {
        console.error("No original message found in the request for translation");
        return new NextResponse("Original message is required for translation.", { status: 400 });
      }

      // 生成翻译请求
      const translationPrompt = `请将以下内容翻译成中文："${originalMessage}"`;
      console.log("Sending request to OpenAI for translation...");
      const translationResponse = await openai.createChatCompletion({
        model: "gpt-4",
        messages: [{ role: "system", content: translationPrompt }],
      });

      if (translationResponse?.data?.choices?.[0]?.message?.content) {
        const translatedMessage = translationResponse.data.choices[0].message.content;
        console.log("Received translated message from OpenAI:", translatedMessage);

        // 返回翻译内容
        return NextResponse.json({ translatedMessage }, { status: 200 });
      } else {
        console.error("Invalid translation response from OpenAI");
        return new NextResponse("Invalid translation response from OpenAI", { status: 500 });
      }
    } else {
      console.error("Invalid action provided");
      return new NextResponse("Invalid action.", { status: 400 });
    }
  } catch (error) {
    console.error("[CONVERSATION_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}

