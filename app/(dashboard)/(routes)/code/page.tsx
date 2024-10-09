"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Code } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import * as z from "zod";

import { BotAvatar } from "@/components/bot-avatar";
import { Empty } from "@/components/empty";
import { Heading } from "@/components/heading";
import { Loader } from "@/components/loader";
import { UserAvatar } from "@/components/user-avatar";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useProModal } from "@/hooks/use-pro-modal";
import { cn } from "@/lib/utils";
import { codeFormSchema } from "@/schemas";
import type { ChatCompletionRequestMessage } from "openai";

// 定义检测结果的类型
type AIDetectionResult = {
  sentence: string;
  probability: number;
  isAi: string;
};

// 创建延时函数
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 创建重试机制，遇到 429 错误时进行重试
const retryRequest = async (axiosRequest: () => Promise<any>, retries = 3, delayMs = 2000) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      return await axiosRequest();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 429 && attempt < retries - 1) {
        console.log(`Retrying request after ${delayMs}ms...`);
        await delay(delayMs);
        attempt++;
      } else {
        throw error;
      }
    }
  }
};

const CodePage = () => {
  const proModal = useProModal();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([]);
  
  // 设置类型为 AIDetectionResult[]
  const [aiDetectionResult, setAiDetectionResult] = useState<AIDetectionResult[]>([]);

  const form = useForm<z.infer<typeof codeFormSchema>>({
    resolver: zodResolver(codeFormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof codeFormSchema>) => {
    try {
      const userMessage: ChatCompletionRequestMessage = {
        role: "user",
        content: values.prompt,
      };

      const newMessages = [...messages, userMessage];

      // 调用后端 API 进行检测，并使用重试机制处理 429 错误
      const response = await retryRequest(() =>
        axios.post("/api/code", { text: values.prompt })
      );

      console.log("API Response:", response.data); // 添加调试日志，查看 API 响应

      const result = response.data;

      // 提取重要的检测字段
      const processedResult = result.sentences.map((sentence: any) => ({
        sentence: sentence.sentence,
        probability: sentence.generated_prob,
        isAi: sentence.highlight_sentence_for_ai ? "AI-Generated" : "Human",
      }));

      // 更新消息状态，显示原文和检测结果
      setMessages((current) => [...current, userMessage]);

      console.log("Processed Result:", processedResult); // 打印处理后的检测结果

      // 设置检测结果
      setAiDetectionResult(processedResult);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 429) {
          toast.error("Too many requests. Please try again later.");
        } else if (error.response?.status === 403) {
          proModal.onOpen();
        } else {
          toast.error("Something went wrong.");
        }
      }
      console.error("[API_ERROR]: ", error);
    } finally {
      form.reset();
      router.refresh();
    }
  };

  return (
    <div>
      <Heading
        title="Code Generation"
        description="Generate code using descriptive text."
        icon={Code}
        iconColor="text-green-700"
        bgColor="bg-green-700/10"
      />

      <div className="px-4 lg:px-8">
        <div className="">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              autoComplete="off"
              autoCapitalize="off"
              className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
            >
              <FormField
                name="prompt"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-10">
                    <FormControl className="m-0 p-0">
                      <Input
                        className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                        disabled={isLoading}
                        aria-disabled={isLoading}
                        placeholder="Enter text to check for AI generation..."
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <Button
                className="col-span-12 lg:col-span-2 w-full"
                disabled={isLoading}
                aria-disabled={isLoading}
              >
                Check
              </Button>
            </form>
          </Form>
        </div>

        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-muted">
              <Loader />
            </div>
          )}
          {messages.length === 0 && !isLoading && (
            <Empty label="No conversation started." />
          )}
          <div className="flex flex-col-reverse gap-y-4">
            {messages.map((message, i) => (
              <div
                key={`${i}-${message.content}`}
                className={cn(
                  "p-8 w-full flex items-start gap-x-8 rounded-lg",
                  message.role === "user"
                    ? "bg-white border border-black/10"
                    : "bg-muted",
                )}
              >
                {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
                <p className="text-sm">
                  <ReactMarkdown
                    components={{
                      pre: ({ node, ...props }) => (
                        <div className="overflow-auto w-full my-2 bg-black/10 p-2 rounded-lg">
                          <pre {...props} />
                        </div>
                      ),
                      code: ({ node, ...props }) => (
                        <code
                          className="bg-black/10 rounded-lg p-1"
                          {...props}
                        />
                      ),
                    }}
                    className="text-sm overflow-hidden leading-7"
                  >
                    {message.content || ""}
                  </ReactMarkdown>
                </p>
              </div>
            ))}
          </div>

          {/* 在页面显示 AI 检测结果 */}
          {aiDetectionResult.length > 0 && (
            <div className="mt-6">
              <h2 className="text-lg font-bold">AI Detection Results</h2>
              {aiDetectionResult.map((result, index) => (
                <div
                  key={index}
                  className="p-4 mt-2 border rounded-lg bg-gray-50"
                >
                  <p>
                    <strong>Sentence:</strong> {result.sentence}
                  </p>
                  <p>
                    <strong>Generated Probability:</strong> {result.probability.toFixed(4)}
                  </p>
                  <p>
                    <strong>Classification:</strong> {result.isAi}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodePage;
