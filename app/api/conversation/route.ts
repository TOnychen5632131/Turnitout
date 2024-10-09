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

const ConversationPage = () => {
  const proModal = useProModal();
  const router = useRouter();
  const [messages, setMessages] = useState<ChatCompletionRequestMessage[]>([]);
  const [translations, setTranslations] = useState<{ [key: number]: string }>({}); // 存储每个消息的翻译

  const form = useForm<z.infer<typeof conversationFormSchema>>({
    resolver: zodResolver(conversationFormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof conversationFormSchema>) => {
    try {
      const userMessage: ChatCompletionRequestMessage = {
        role: "user",
        content: values.prompt,
      };

      const newMessages = [...messages, userMessage];

      // 调用现有的去 AI 化 API 生成英文改写后的内容
      const response = await axios.post("/api/conversation", {
        messages: newMessages,
      });

      setMessages((current) => [...current, userMessage, response.data]);

      // 针对生成的英文改写后的内容，调用翻译 API 获取中文翻译
      const translationResponse = await axios.post("/api/translate", {
        text: response.data.content, // 翻译生成的英文内容
      });

      // 将翻译结果存储到 translations 中
      setTranslations((prev) => ({
        ...prev,
        [newMessages.length]: translationResponse.data.translatedText,
      }));
    } catch (error: any) {
      if (axios.isAxiosError(error) && error?.response?.status === 403)
        proModal.onOpen();
      else toast.error("Something went wrong.");

      console.error(error);
    } finally {
      form.reset();
      router.refresh();
    }
  };

  return (
    <div>
      <Heading
        title="Conversation"
        description="Our most advanced conversation model."
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
                        placeholder="Enter text to rewrite"
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
                Generate
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
              <div key={`${i}-${message.content}`} className="flex gap-x-4">
                {/* 左侧显示英文改写的内容 */}
                <div className="w-1/2 p-8 w-full flex items-start gap-x-8 rounded-lg bg-white border border-black/10">
                  {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
                  <div>
                    <p className="text-sm">{message.content}</p>
                    {/* 显示英文消息的单词计数器 */}
                    <p className="text-xs text-gray-500">
                      {`Word count: ${
                        message.content
                          ? message.content
                              .split(/\s+/)
                              .filter(word => word.trim().length > 0).length
                          : 0
                      }`}
                    </p>
                  </div>
                </div>

                {/* 右侧显示中文翻译 */}
                <div className="w-1/2 p-8 w-full flex items-start gap-x-8 rounded-lg bg-muted">
                  <p className="text-sm">
                    {translations[i] || "Translating..."} {/* 翻译结果 */}
                  </p>
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
