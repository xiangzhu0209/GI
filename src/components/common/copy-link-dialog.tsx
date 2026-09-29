import { Check, Copy } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type CopyLinkDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  url: string;
};

export const CopyLinkDialog = ({
  open,
  onOpenChange,
  title,
  description,
  url,
}: CopyLinkDialogProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("已複製連結");
    } catch {
      toast.error("瀏覽器阻擋了自動複製，請手動全選複製");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setCopied(false);
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Input
            readOnly
            value={url}
            onFocus={(event) => event.currentTarget.select()}
            className="h-11 font-mono text-xs"
          />
          <Button className="w-full" onClick={() => void handleCopy()}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? "已複製" : "複製連結"}
          </Button>
          <p className="text-xs text-muted-foreground">
            把這個連結用 Line 傳給師傅即可，他不需要註冊或登入。
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};