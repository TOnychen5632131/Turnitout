"use client";

import axios from "axios";
import { useState } from "react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ChatCompletionRequestMessage } from "openai";
import { MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Heading } from "@/components/heading";
import { Loader } from "@/components/loader";
import { Empty } from "@/components/empty";
import { BotAvatar } from "@/components/bot-avatar";
import { UserAvatar } from "@/components/user-avatar";
import { useProModal } from "@/hooks/use-pro-modal";

// 没有强制字数限制模式
const conversationFormSchema = z.object({
  prompt: z.string().min(1, { message: "请输入内容" }),
});

interface ExtendedChatCompletionRequestMessage extends ChatCompletionRequestMessage {
  isTranslation?: boolean;
}

const ConversationPage = () => {
  const proModal = useProModal();
  const [messages, setMessages] = useState<ExtendedChatCompletionRequestMessage[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [inputText, setInputText] = useState(""); // 用于跟踪输入的文本

  const form = useForm<z.infer<typeof conversationFormSchema>>({
    resolver: zodResolver(conversationFormSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  // 处理输入事件
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    form.setValue('prompt', e.target.value); // 更新 form 中的值
  };

  const onSubmit = async (values: z.infer<typeof conversationFormSchema>) => {
    try {
      const userMessage: ExtendedChatCompletionRequestMessage = {
        role: "user",
        content: values.prompt,
      };

      const newMessages = [...messages, userMessage];

      const response = await axios.post("/api/conversation", {
        messages: newMessages,
        action: "generate",
      });

      const { originalMessage } = response.data;

      setMessages((current) => [
        ...current,
        userMessage,
        { role: "assistant", content: originalMessage },
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

  // 分离文本：前 50 字符正常，超出的部分高亮
  const maxLength = 50;
  const normalText = inputText.slice(0, maxLength); // 正常显示的部分
  const excessText = inputText.slice(maxLength); // 高亮显示的部分

  return (
    <div>
      <Heading
        title="降AI率"
        description="用魔法打败魔法🪄"
        icon={MessageSquare}
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
                      <div className="relative">
                        {/* textarea 用户输入框 */}
                        <textarea
                          rows={3}
                          disabled={isLoading}
                          placeholder="将文章放入文本框"
                          value={field.value}
                          onChange={handleInputChange}
                          className="w-full p-2 border rounded-lg"
                          style={{ opacity: 0, position: "absolute", zIndex: 1 }}
                        />

                        {/* 这里显示格式化后的文本 */}
                        <div className="w-full p-2 border rounded-lg whitespace-pre-wrap">
                          <span>{normalText}</span>
                          <span className="bg-yellow-300">{excessText}</span>
                        </div>
                      </div>
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
                        onClick={() => message.content ? handleTranslate(message.content) : null}
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
