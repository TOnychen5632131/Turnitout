"use client";

import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChatCompletionRequestMessage } from "openai";
import { MessageSquare } from "lucide-react"; // 确保导入 MessageSquare 图标

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Heading } from "@/components/heading";
import { Loader } from "@/components/loader";
import { Empty } from "@/components/empty";
import { BotAvatar } from "@/components/bot-avatar";
import { UserAvatar } from "@/components/user-avatar";
import { conversationFormSchema } from "@/schemas";
import { useProModal } from "@/hooks/use-pro-modal";

// 定义消息类型（包括是否为翻译的标志）
interface ExtendedChatCompletionRequestMessage extends ChatCompletionRequestMessage {
  isTranslation?: boolean;
}

const ConversationPage = () => {
  const proModal = useProModal();
  const [messages, setMessages] = useState<ExtendedChatCompletionRequestMessage[]>([]);
  const [isTranslating, setIsTranslating] = useState(false); // 控制翻译的状态

  const form = useForm<z.infer<typeof conversationFormSchema>>({
    resolver: zodResolver(conversationFormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  // 处理生成英文内容的提交
  const onSubmit = async (values: z.infer<typeof conversationFormSchema>) => {
    try {
      const userMessage: ExtendedChatCompletionRequestMessage = {
        role: "user",
        content: values.prompt,
      };

      const newMessages = [...messages, userMessage];

      // 调用后端 API 生成英文内容
      const response = await axios.post("/api/conversation", {
        messages: newMessages,
        action: "generate",  // 表示生成英文内容
      });

      const { originalMessage } = response.data;

      // 更新消息状态，添加生成的英文内容
      setMessages((current) => [
        ...current,
        userMessage,  // 用户输入的内容
        { role: "assistant", content: originalMessage },  // GPT 生成的英文内容
      ]);
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error?.response?.status === 403) {
        proModal.onOpen();
      } else {
        toast.error("Something went wrong.");
      }
      console.error("[ERROR]: ", error);
    } finally {
      form.reset();
    }
  };

  // 处理翻译请求
  const handleTranslate = async (originalMessage: string) => {
    try {
      setIsTranslating(true); // 标记翻译状态
      const response = await axios.post("/api/conversation", {
        originalMessage,  // 传递原始的英文内容
        action: "translate",  // 表示翻译
      });

      const { translatedMessage } = response.data;

      // 更新消息状态，添加中文翻译内容
      setMessages((current) => [
        ...current,
        { role: "assistant", content: translatedMessage, isTranslation: true },  // 翻译后的中文内容
      ]);
    } catch (error: unknown) {
      toast.error("Translation failed.");
      console.error("[TRANSLATION_ERROR]: ", error);
    } finally {
      setIsTranslating(false); // 翻译完成后，取消翻译状态
    }
  };

  return (
    <div>
      <Heading
        title="降AI率"
        description="用魔法打败魔法🪄"
        icon={MessageSquare} // 这里传递一个图标
      />

      <div className="px-4 lg:px-8">
        <div>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
            >
              <FormField
                name="prompt"
                render={({ field }) => (
                  <FormItem className="col-span-12 lg:col-span-10">
                    <FormControl className="m-0 p-0">
                      <Input
                        disabled={isLoading}
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
                type="submit"
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
                className={`p-8 w-full flex items-start gap-x-8 rounded-lg ${
                  message.role === "user"
                    ? "bg-white border border-black/10"
                    : message.isTranslation
                    ? "bg-gray-100 text-right"
                    : "bg-muted"
                }`}
              >
                {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
                <div>
                  <p className="text-sm">{message.content}</p>

                  {message.role === "assistant" && !message.isTranslation && (
                    <div className="mt-2">
                      <Button
                        disabled={isTranslating}
                        onClick={() => message.content ? handleTranslate(message.content) : null}  // 仅在 message.content 存在时调用 handleTranslate
                      >
                        {isTranslating ? "翻译中..." : "翻译为中文"}
                      </Button>
                    </div>

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
