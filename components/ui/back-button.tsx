"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

interface BackButtonProps {
  href?: string;
  label?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function BackButton({
  href,
  label = "Go back",
  variant = "ghost",
  size = "sm",
  className,
}: BackButtonProps) {
  const router = useRouter();

  const handleBack = () => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  const ButtonComponent = (
    <Button
      variant={variant}
      size={size}
      onClick={href ? undefined : handleBack}
      className={className}
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );

  if (href) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Link href={href}>{ButtonComponent}</Link>
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{ButtonComponent}</TooltipTrigger>
        <TooltipContent>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
