import { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { Heading } from "@/components/heading";
import { SubscriptionButton } from "@/components/subscription-button";
import { checkSubscription } from "@/lib/subscription";

const SettingsPage = () => {
  const [isPro, setIsPro] = useState(false);

  useEffect(() => {
    const fetchSubscription = async () => {
      const proStatus = await checkSubscription();
      setIsPro(proStatus);
    };

    fetchSubscription();
  }, []);

  return (
    <div>
      <Heading
        title="Settings"
        description="Manage account settings."
        icon={Settings}
        iconColor="text-gray-700"
        bgColor="bg-gray-700/10"
      />

      <div className="px-4 lg:px-8 space-y-4">
        <div className="text-muted-foreground text-sm">
          {isPro
            ? "You are currently on a pro plan."
            : "You are currently on a free plan."}
        </div>

        {/* 显示订阅按钮 */}
        <SubscriptionButton isPro={isPro} />
      </div>
    </div>
  );
};

export default SettingsPage;
