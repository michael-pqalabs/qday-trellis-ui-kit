import type { CSSProperties } from "react";
import { Toaster as Sonner } from "sonner";
import { useTheme } from "@/components/theme-provider";

type ToasterProps = React.ComponentProps<typeof Sonner>;

/**
 * Toasts follow the app theme (not the OS setting) and the app's own tokens, and sit at the top of
 * the phone column so they never cover the bottom navigation or the review comment controls.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();
  return (
    <Sonner
      theme={theme}
      position="top-center"
      offset={{ top: 64 }}
      mobileOffset={{ top: 16 }}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "color-mix(in oklab, var(--primary) 25%, var(--border))",
          "--success-bg": "var(--popover)",
          "--success-text": "var(--foreground)",
          "--success-border": "color-mix(in oklab, var(--success) 45%, var(--border))",
          "--error-bg": "var(--popover)",
          "--error-text": "var(--foreground)",
          "--error-border": "color-mix(in oklab, var(--destructive) 45%, var(--border))",
          "--border-radius": "1rem",
          width: "min(calc(100vw - 2rem), 22rem)",
        } as CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:shadow-elevated group-[.toaster]:font-sans",
          title: "group-[.toast]:font-semibold",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:rounded-full group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          icon: "group-[.toast]:text-primary",
          success: "[&_[data-icon]]:text-success",
          error: "[&_[data-icon]]:text-destructive",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
