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
    const { messages = [{ role: "user", content: "我需要你把这段文字重新输出，英文语言水平为 B1，但是字数不能下降，可以使用将一句话拆分为两句话，讲一个单词拆成一个短语等办法" }] } = body;

    // 插入 system 消息
    messages.unshift({
      role: "system",
      content: "我需要你把这段文字重新输出，英文语言水平为 B1，但是字数不能下降，可以使用将一句话拆分为两句话，讲一个单词拆成一个短语等办法",
    });

    if (!userId) {
      console.error("Unauthorized request, userId is missing");
      return new NextResponse("Unauthorized.", { status: 401 });
    }

    if (!configuration.apiKey) {
      console.error("OpenAI API key is not configured");
      return new NextResponse("OpenAI API key not configured.", { status: 500 });
    }

    if (!messages) {
      console.error("No messages found in the request");
      return new NextResponse("Messages are required.", { status: 400 });
    }

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro) {
      console.warn("Free trial has expired or user is not a Pro member");
      return new NextResponse("Free trial has expired.", { status: 403 });
    }

    // 第一次请求：获取 GPT 生成内容
    console.log("Sending request to OpenAI for original message");
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages,
    });

    if (
      response &&
      response.data &&
      response.data.choices &&
      response.data.choices[0] &&
      response.data.choices[0].message
    ) {
      const originalMessage = response.data.choices[0].message.content;
      console.log("Received original message from OpenAI:", originalMessage);

      // 第二次请求：获取中文翻译
      const translationPrompt = `请将以下内容翻译成中文："${originalMessage}"`;
      const translationResponse = await openai.createChatCompletion({
        model: "gpt-4o-mini",
        messages: [{ role: "system", content: translationPrompt }],
      });

      if (
        translationResponse &&
        translationResponse.data &&
        translationResponse.data.choices &&
        translationResponse.data.choices[0] &&
        translationResponse.data.choices[0].message
      ) {
        const translatedMessage = translationResponse.data.choices[0].message.content;
        console.log("Received translated message:", translatedMessage);

        if (!isPro) {
          await increaseApiLimit(); // 增加 API 调用次数
          console.log("API limit increased for free trial user.");
        }

        // 返回原始内容和翻译
        return NextResponse.json({ originalMessage, translatedMessage }, { status: 200 });
      } else {
        console.error("Invalid translation response from OpenAI");
        return NextResponse.json({ error: "Invalid translation response from OpenAI" }, { status: 500 });
      }
    } else {
      console.error("Invalid response data from OpenAI");
      return NextResponse.json({ error: "Invalid response from OpenAI" }, { status: 500 });
    }
  } catch (error) {
    console.error("[CONVERSATION_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
