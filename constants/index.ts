import {
  Code,
  Facebook,
  Github,
  ImageIcon,
  Instagram,
  LayoutDashboard,
  MessageSquare,
  Music,
  Settings,
  Twitter,
  VideoIcon,
} from "lucide-react";

export const MAX_FREE_COUNTS = 100 as const;

export const TESTIMONIALS = [
  {
    name: "Carlos",
    image: "/testimonials/user-1.jpeg",
    title: "留学生",
    description:
      "这个工具大大帮助了我减少 AI 检测率，使我的论文更加自然流畅。",
  },
  {
    name: "Emily",
    image: "/testimonials/user-2.jpeg",
    title: "国际学生",
    description:
      "作为一名留学生，这款应用拯救了我，帮我快速翻译并检测内容，非常实用！",
  },
  {
    name: "David",
    image: "/testimonials/user-3.jpeg",
    title: "研究生",
    description:
      "工具的翻译功能非常精准，还能降低 AI 检测率，简直太方便了！推荐给所有同学！",
  },
  {
    name: "Sophia",
    image: "/testimonials/user-4.jpeg",
    title: "海外学者",
    description:
      "功能强大且易于使用，特别适合留学生。它让我的写作更加轻松高效。",
  },
] as const;


export const TOOLS = [
  {
    label: "降低 Ai 率",
    icon: MessageSquare,
    color: "text-violet-500",
    bgColor: "bg-violet-500/10",
    href: "/conversation",
  },
  // {
  //   label: "Music Generation",
  //   icon: Music,
  //   color: "text-emerald-500",
  //   bgColor: "bg-violet-500/10",
  //   href: "/music",
  // },
  // {
  //   label: "Image Generation",
  //   icon: ImageIcon,
  //   color: "text-pink-700",
  //   bgColor: "bg-pink-700/10",
  //   href: "/image",
  // },
  // {
  //   label: "Video Generation",
  //   icon: VideoIcon,
  //   color: "text-orange-700",
  //   bgColor: "bg-orange-700/10",
  //   href: "/video",
  // },
  {
    label: "AI 检测",
    icon: Code,
    color: "text-green-700",
    bgColor: "bg-green-700/10",
    href: "/code",
  },
] as const;

export const ROUTES = [
  {
    label: "仪表盘",
    icon: LayoutDashboard,
    href: "/dashboard",
    color: "text-sky-500",
  },
  ...TOOLS,
  {
    label: "设置",
    icon: Settings,
    href: "/settings",
    color: null,
  },
] as const;

export const FOOTER_LINKS = [

  {
    name: "Twitter",
    icon: Twitter,
    link: "https://twitter.com",
  }

];
