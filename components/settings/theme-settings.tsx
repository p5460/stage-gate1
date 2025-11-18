"use client";

import { useTheme } from "next-themes";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function ThemeSettings() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>
            Choose your preferred theme for the application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const themes = [
    {
      value: "light",
      label: "Light",
      description: "Clean and bright interface",
      icon: Sun,
      iconColor: "text-yellow-500",
    },
    {
      value: "dark",
      label: "Dark",
      description: "Easy on the eyes in low light",
      icon: Moon,
      iconColor: "text-blue-500",
    },
    {
      value: "system",
      label: "System",
      description: "Follows your system preference",
      icon: Monitor,
      iconColor: "text-gray-500",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Theme</CardTitle>
        <CardDescription>
          Choose your preferred theme for the application
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-4">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isSelected = theme === themeOption.value;

            return (
              <Button
                key={themeOption.value}
                variant="outline"
                className={cn(
                  "flex items-center justify-start space-x-3 h-auto p-4 hover:bg-accent transition-colors",
                  isSelected && "border-primary bg-accent"
                )}
                onClick={() => setTheme(themeOption.value)}
              >
                <Icon className={cn("h-5 w-5", themeOption.iconColor)} />
                <div className="flex-1 text-left">
                  <div className="font-medium">{themeOption.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {themeOption.description}
                  </div>
                </div>
                {isSelected && (
                  <div className="h-2 w-2 rounded-full bg-primary" />
                )}
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
