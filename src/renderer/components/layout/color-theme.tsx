import { CheckIcon } from "lucide-react";
import { cn } from "renderer/lib/utils";
import { COLOR_THEME, useTheme } from "../contexts/theme-provider";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";

export const ColorThemePicker = () => {
  const { colorTheme, setColorTheme } = useTheme();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Color Theme</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-2">
          {COLOR_THEME.map((theme) => {
            const isActive = colorTheme === theme;

            return (
              <Button
                variant="outline"
                size="sm"
                key={theme}
                onClick={() => setColorTheme(theme)}
                className={cn(
                  "justify-start",
                  isActive && "border-2 border-primary",
                )}
              >
                <span
                  className={cn(
                    `mr-1 flex h-5 w-5 shrink-0 -translate-x-1 items-center justify-center rounded-full`,
                    {
                      "bg-zinc": theme === "zinc",
                      "bg-slate": theme === "slate",
                      "bg-stone": theme === "stone",
                      "bg-gray": theme === "gray",
                      "bg-neutral": theme === "neutral",
                      "bg-red": theme === "red",
                      "bg-rose": theme === "rose",
                      "bg-orange": theme === "orange",
                      "bg-green": theme === "green",
                      "bg-blue": theme === "blue",
                      "bg-yellow": theme === "yellow",
                      "bg-violet": theme === "violet",
                    },
                  )}
                >
                  {isActive && <CheckIcon className="h-4 w-4 text-white" />}
                </span>
                <span className="capitalize">{theme}</span>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
