"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { MessageSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ChatCompletionRequestMessage } from "openai";
import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { conversationFormSchema } from "@/schemas";

// 扩展 ChatCompletionRequestMessage 类型，增加 isTranslation 属性
interface ExtendedChatCompletionRequestMessage extends ChatCompletionRequestMessage {
  isTranslation?: boolean;
}

const ConversationPage = () => {
  const proModal = useProModal();
  const router = useRouter();
  const [messages, setMessages] = useState<ExtendedChatCompletionRequestMessage[]>([]);

  const form = useForm<z.infer<typeof conversationFormSchema>>({
    resolver: zodResolver(conversationFormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof conversationFormSchema>) => {
    try {
      const userMessage: ExtendedChatCompletionRequestMessage = {
        role: "user",
        content: values.prompt,
      };

      const newMessages = [...messages, userMessage];

      // 调用后端 API 请求生成原始内容和中文翻译
      const response = await axios.post("/api/conversation", {
        messages: newMessages,
      });

      // 获取返回的原始和翻译内容
      const { originalMessage, translatedMessage } = response.data;

      // 更新消息状态，包含原始内容和翻译
      setMessages((current) => [
        ...current,
        userMessage, // 用户输入
        { role: "assistant", content: originalMessage }, // GPT 生成的原始内容
        { role: "assistant", content: translatedMessage, isTranslation: true }, // 中文翻译
      ]);
    } catch (error: any) {
      if (axios.isAxiosError(error) && error?.response?.status === 403) {
        proModal.onOpen();
      } else {
        toast.error("Something went wrong.");
      }
      console.error(error);
    } finally {
      form.reset();
      router.refresh();
    }
  };

  return (
    <div>
      <Heading
        title="降AI率"
        description="用魔法打败魔法🪄"
        icon={MessageSquare}
        iconColor="text-violet-500"
        bgColor="bg-violet-500/10"
      />

      <div className="px-4 lg:px-8">
        <div>
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
                        placeholder="将文章放入文本框"
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
                降低 AI 率
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
            <Empty label="没有发现降低AI率的文章" />
          )}
          <div className="flex flex-col-reverse gap-y-4">
            {messages.map((message, i) => (
              <div
                key={`${i}-${message.content}`}
                className={cn(
                  "p-8 w-full flex items-start gap-x-8 rounded-lg",
                  message.role === "user"
                    ? "bg-white border border-black/10"
                    : message.isTranslation
                    ? "bg-gray-100 text-right" // 翻译内容右对齐显示
                    : "bg-muted"
                )}
              >
                {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
                <div>
                  <p className="text-sm">{message.content}</p>
                  {/* 显示单词计数器，处理中英文混合文本 */}
                  {!message.isTranslation && (
                    <p className="text-xs text-gray-500">
                      {`Word count: ${
                        message.content
                          ? message.content
                              .split(/[\s]+|(?=[\u4e00-\u9fa5])/)
                              .filter(word => word.trim().length > 0).length
                          : 0
                      }`}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationPage;
