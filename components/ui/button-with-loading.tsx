"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { forwardRef } from "react";
import { type VariantProps } from "class-variance-authority";
import { buttonVariants } from "@/components/ui/button";

interface ButtonWithLoadingProps
  extends React.ComponentProps<"button">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
  loadingText?: string;
}

export const ButtonWithLoading = forwardRef<
  HTMLButtonElement,
  ButtonWithLoadingProps
>(({ children, loading = false, loadingText, disabled, ...props }, ref) => {
  return (
    <Button ref={ref} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? loadingText || "Loading..." : children}
    </Button>
  );
});

ButtonWithLoading.displayName = "ButtonWithLoading";
