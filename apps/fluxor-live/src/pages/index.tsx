"use client";

import * as React from "react";
import { useAppStore } from "~/store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { IconCheckbox, IconCopy, IconShare, IconWallet } from "@tabler/icons-react";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Buffer } from "buffer";
import { LiveMessageRequest } from "@mixin.dev/mixin-node-sdk";

interface CopyButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

function CopyButton({ value, className, ...props }: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false);

  React.useEffect(() => {
    if (hasCopied) {
      const timer = setTimeout(() => {
        setHasCopied(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCopied]);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setHasCopied(true);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  }, [value]);

  return (
    <Button variant="outline" size="icon" onClick={handleCopy} className={className} {...props}>
      {hasCopied ? <IconCheckbox className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
    </Button>
  );
}

export default function HomePage() {
  const [connected, user] = useAppStore((state) => [state.connected, state.user]);
  const [publishStreamUrl, setPublishStreamUrl] = React.useState("");

  React.useEffect(() => {
    if (connected) {
      setPublishStreamUrl(`rtmp://publish.miku.fluxor.cc/fluxor/${user?.user_id}`);
    }
  }, [connected, user]);

  const handleShare = () => {
    if (!user) {
      console.log("user is not connected");
      return;
    }

    const data: LiveMessageRequest = {
      height: 480,
      thumb_url: user?.avatar_url || "https://developers.mixin.one/zh-CN/images/favicon.ico",
      url: `http://play.miku.fluxor.cc/fluxor/${user?.user_id}.m3u8`,
      width: 480,
      shareable: true,
    };

    const dataStr = JSON.stringify(data);
    const base64Str = Buffer.from(dataStr).toString("base64");
    console.log("mixin://send?category=live&data=" + encodeURIComponent(base64Str));
    window.open("mixin://send?category=live&data=" + encodeURIComponent(base64Str));
  };

  return (
    <div className="flex min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {!connected ? (
          <Alert variant="destructive" className="border-destructive/50 text-destructive">
            <IconWallet className="h-4 w-4" />
            <AlertDescription className="text-sm text-white">请先连接 Mixin 钱包以获取推流地址</AlertDescription>
          </Alert>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>直播推流配置</CardTitle>
              <CardDescription>复制推流地址到您的推流软件中，开始在 Mixin 分享精彩直播</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  推流地址
                </label>
                <div className="flex space-x-2">
                  <Input value={publishStreamUrl} readOnly className="font-mono" />
                  <CopyButton value={publishStreamUrl} title="复制推流地址" />
                </div>
              </div>

              <div className="flex mx-0">
                <Button variant="outline" onClick={handleShare} className="">
                  <IconShare className="h-4 w-4" />
                  <span>分享直播卡片</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
