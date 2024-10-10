"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import TypewriterComponent from "typewriter-effect";
import { Button } from "./ui/button";

export const LandingHero = () => {
  const { isSignedIn } = useAuth();

  return (
    <div className="text-white font-bold py-36 text-center space-y-5">
      <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl space-y-5 font-extrabold">
        <h1>留学生最需要的</h1>
        <div className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">
          <TypewriterComponent
            options={{
              strings: [
                "降AI率神器",
                "检查AI率工具",
                "保持字数改写神器",
              ],
              autoStart: true,
              loop: true,
            }}
          />
        </div>
      </div>

      <div className="text-sm md:text-xl font-light text-zinc-400">
        让 AI 不在查的出来
      </div>

      <div className="">
        <Button
          variant="premium"
          className="md:text-lg p-4 md:p-6 rounded-full font-semibold"
          asChild
        >
          <Link href={isSignedIn ? "/dashboard" : "/sign-up"}>
            将文章 AI 率降低
          </Link>
        </Button>
      </div>

      <div className="text-zinc-400 text-xs md:text-sm font-normal">
        免费试用
      </div>
    </div>
  );
};
