import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface HeroButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const HeroButton = forwardRef<HTMLButtonElement, HeroButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const variants = {
      primary: "bg-gradient-to-r from-orange to-red text-white hover:opacity-90 transform hover:scale-105 transition-all duration-300 shadow-glow border-0",
      secondary: "bg-white/20 text-foreground border border-orange hover:bg-orange hover:text-white transition-all duration-300"
    };

    return (
      <Button
        ref={ref}
        className={cn(
          "h-12 px-8 font-semibold rounded-lg",
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

HeroButton.displayName = "HeroButton";

export { HeroButton };