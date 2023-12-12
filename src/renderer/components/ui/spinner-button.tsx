import { Loader2 } from "lucide-react";
import { Button, ButtonProps } from "./button";

interface SpinnerButtonProps extends ButtonProps {
  isLoading: boolean;
}

export const SpinnerButton = ({
  isLoading,
  children,
  ...props
}: SpinnerButtonProps) => {
  return (
    <Button disabled={isLoading} {...props} className="flex gap-2">
      {children}
      {isLoading && <Loader2 className="h-4 w-4 animate-spin justify-end" />}
    </Button>
  );
};
