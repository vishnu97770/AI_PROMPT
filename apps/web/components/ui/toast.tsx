// Thin wrapper around Sonner — re-exports the toast function and Toaster component
// with PromptCraft's default config pre-applied.
// Usage: import { toast } from "@/components/ui/toast"
//        toast.success("Done!") | toast.error("Failed") | toast.loading("Working…")

export { toast } from "sonner";
export type { ExternalToast } from "sonner";

import { toast } from "sonner";

export const toastSuccess = (message: string, description?: string) =>
  toast.success(message, description ? { description } : undefined);

export const toastError = (message: string, description?: string) =>
  toast.error(message, description ? { description } : undefined);

export const toastCopied = () =>
  toast.success("Copied to clipboard");

export const toastApiError = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
      ? error
      : "Something went wrong. Please try again.";
  toast.error(message);
};
