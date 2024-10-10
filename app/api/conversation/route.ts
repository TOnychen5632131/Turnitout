import { Configuration, OpenAIApi } from "openai";
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { checkApiLimit, increaseApiLimit } from "@/lib/api-limit";
import { checkSubscription } from "@/lib/subscription";

// 设置 OpenAI API
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
      content: "我需要你把这段文字重新输出，英文语言水平为 B1，但是字数不能下降，可以使用将一句话拆分为两句话，讲一个单词拆成一个短语等办法。",
    });

    if (!userId) return new NextResponse("Unauthorized.", { status: 401 });
    if (!configuration.apiKey)
      return new NextResponse("OpenAI API key not configured.", { status: 500 });

    if (!messages) return new NextResponse("Messages are required.", { status: 400 });

    const freeTrial = await checkApiLimit();
    const isPro = await checkSubscription();

    if (!freeTrial && !isPro)
      return new NextResponse("Free trial has expired.", { status: 403 });

    // 第一次请求：获取原始的 GPT 生成内容
    const response = await openai.createChatCompletion({
      model: "gpt-4o",
      messages,
    });

    // 安全检查，确保 response.data 及其嵌套属性都存在
    if (
      response &&
      response.data &&
      response.data.choices &&
      response.data.choices[0] &&
      response.data.choices[0].message
    ) {
      const originalMessage = response.data.choices[0].message.content;

      // 第二次请求：获取中文翻译
      const translationPrompt = `请将以下内容翻译成中文，原原本本的翻译："${originalMessage}"`;
      const translationResponse = await openai.createChatCompletion({
        model: "gpt-4mini",
        messages: [{ role: "system", content: translationPrompt }],
      });

      // 安全检查 translationResponse，确保数据存在
      if (
        translationResponse &&
        translationResponse.data &&
        translationResponse.data.choices &&
        translationResponse.data.choices[0] &&
        translationResponse.data.choices[0].message
      ) {
        const translatedMessage = translationResponse.data.choices[0].message.content;

        if (!isPro) await increaseApiLimit();

        // 返回原始内容和翻译内容
        return NextResponse.json(
          { originalMessage, translatedMessage },
          { status: 200 }
        );
      } else {
        console.error("Translation response is invalid or incomplete");
        return NextResponse.json({ error: "Invalid translation response from OpenAI" }, { status: 500 });
      }
    } else {
      console.error("Response data is invalid or incomplete");
      return NextResponse.json({ error: "Invalid response from OpenAI" }, { status: 500 });
    }
  } catch (error) {
    console.error("[CONVERSATION_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
