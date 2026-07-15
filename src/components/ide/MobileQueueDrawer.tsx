"use client";

import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { RuntimeQueue } from "@/components/ide/RuntimeQueue";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { usePlayerStore } from "@/store/usePlayerStore";

type MobileQueueDrawerProps = {
  onOpenChange: (open: boolean) => void;
  open: boolean;
};

export function MobileQueueDrawer({
  onOpenChange,
  open,
}: MobileQueueDrawerProps) {
  const t = useTranslations("fileExplorer");
  const queueCount = usePlayerStore((state) => state.queue.length);

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[min(82dvh,42rem)] max-h-[82dvh] pb-[env(safe-area-inset-bottom)]">
        <DrawerHeader className="relative border-b border-border pr-16 text-left">
          <DrawerTitle>{t("queue")}</DrawerTitle>
          <DrawerDescription className="tabular-nums">
            {t("queueDescription", { count: queueCount })}
          </DrawerDescription>
          <DrawerClose asChild>
            <button
              type="button"
              className="absolute right-3 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-xl text-muted-foreground transition-[scale,color,background-color] duration-150 ease-out hover:bg-accent hover:text-foreground active:scale-[0.96]"
              aria-label={t("closeQueue")}
            >
              <X className="size-4" />
            </button>
          </DrawerClose>
        </DrawerHeader>
        <div className="min-h-0 flex-1 overflow-y-auto py-2">
          <RuntimeQueue />
        </div>
      </DrawerContent>
    </Drawer>
  );
}
