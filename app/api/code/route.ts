import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import FormData from "form-data";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body; // 从前端接收到的文本

    if (!text) return new NextResponse("Text is required.", { status: 400 });

    // 创建 FormData 对象
    const data = new FormData();
    data.append('text', text);

    // 配置 axios 请求
    const options = {
      method: 'POST',
      url: 'https://gptzero-api.p.rapidapi.com/v1/detectAIDeep',
      headers: {
        'x-rapidapi-key': process.env.RAPIDAPI_KEY, // 使用环境变量来存储密钥
        'x-rapidapi-host': 'gptzero-api.p.rapidapi.com',
        ...data.getHeaders(),
      },
      data: data,
    };

    // 发送请求到 GPTZero API
    const response = await axios.request(options);

    // 返回 API 的检测结果
    return NextResponse.json({ result: response.data }, { status: 200 });
  } catch (error: any) {
    console.error("[API_ERROR]: ", error);
    return new NextResponse("Internal server error.", { status: 500 });
  }
}
