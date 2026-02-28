import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-300 ease-out",
  {
    variants: {
      variant: {
        default:
          "h-10 rounded-md border border-input bg-background px-3 py-2 focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2",
        underline:
          "h-10 px-0 py-2 bg-transparent border-0 border-b-2 border-border focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input, inputVariants };
