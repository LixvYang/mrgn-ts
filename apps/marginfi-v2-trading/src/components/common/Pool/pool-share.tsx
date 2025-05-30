import React from "react";
import Link from "next/link";
import {
  IconCopy,
  IconCheck,
  IconShare,
  IconBrandXFilled,
  IconBrandTelegram,
  IconBrandWhatsapp,
  IconBrandReddit,
} from "@tabler/icons-react";
import { CopyToClipboard } from "react-copy-to-clipboard";

import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Button } from "~/components/ui/button";
import { useExtendedPool } from "~/hooks/useExtendedPools";
import { ArenaPoolV2 } from "~/types/trade-store.types";

const shareLinks = [
  {
    icon: IconBrandXFilled,
    url: "https://twitter.com/intent/tweet?url={url}&text={text}",
  },
  {
    icon: IconBrandTelegram,
    url: "https://t.me/share/url?url={url}&text={text}",
  },
  {
    icon: IconBrandWhatsapp,
    url: "https://wa.me/?text={text}%20-%20{url}",
  },
  {
    icon: IconBrandReddit,
    url: "https://reddit.com/submit/?url={url}&amp;resubmit=true&amp;title={text}",
  },
];

const buildShareUrl = (link: string, url: string, text: string) => {
  return link.replace("{url}", url).replace("{text}", text);
};

type PoolShareProps = {
  activePool: ArenaPoolV2;
};

export const PoolShare = ({ activePool }: PoolShareProps) => {
  const extendedPool = useExtendedPool(activePool);
  const [isUrlCopied, setIsUrlCopied] = React.useState(false);
  const copyUrlRef = React.useRef<HTMLInputElement>(null);

  const handleCopyUrl = () => {
    setIsUrlCopied(true);
    setTimeout(() => {
      setIsUrlCopied(false);
    }, 2000);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="mt-4">
          <IconShare size={16} /> Share {extendedPool.tokenBank.meta.tokenSymbol}/
          {extendedPool.quoteBank.meta.tokenSymbol} pool
        </Button>
      </PopoverTrigger>
      <PopoverContent className="pb-2">
        <div className="flex flex-col gap-1.5 text-sm">
          <div className="flex items-center gap-1.5">
            <input
              ref={copyUrlRef}
              className="appearance-none text-xs bg-background border rounded-md w-full overflow-auto px-2 py-1 select-all outline-none"
              value={`${window.location.origin}/trade/${extendedPool.groupPk.toBase58()}`}
              readOnly
            />
            <CopyToClipboard text={`${window.location.origin}/trade/${extendedPool.groupPk.toBase58()}`}>
              <button
                onClick={handleCopyUrl}
                className="cursor-pointer rounded-md p-2 transition-colors hover:bg-accent"
              >
                {isUrlCopied ? <IconCheck size={16} /> : <IconCopy size={16} />}
              </button>
            </CopyToClipboard>
          </div>
          <div className="flex items-center gap-2 text-xs pl-0.5">
            <span className="-translate-y-0.5 font-medium">Share to:</span>
            <ul className="flex items-center justify-center gap-1">
              {shareLinks.map((link, index) => {
                const url = `${window.location.origin}/trade/${extendedPool.groupPk.toBase58()}`;
                const text = `Long / short ${extendedPool.tokenBank.meta.tokenSymbol} with leverage in The Arena`;
                return (
                  <li key={index}>
                    <Link
                      href={buildShareUrl(link.url, url, text)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-block cursor-pointer rounded-md p-2 transition-colors hover:bg-accent"
                    >
                      <link.icon size={16} />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
