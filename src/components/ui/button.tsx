import type { ComponentProps } from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// Variants are named for the surface they sit on, so the right contrast is the default.
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2.5 whitespace-nowrap type-label transition-colors duration-150 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        signal: "bg-signal text-ink hover:bg-surface",
        ink: "bg-ink text-surface hover:bg-ink-raised",
        "outline-on-ink":
          "border border-surface/45 text-surface hover:border-surface hover:bg-surface hover:text-ink",
        "outline-on-light": "border border-ink text-ink hover:bg-ink hover:text-surface",
      },
      size: {
        md: "h-12 px-6 text-[0.9375rem]",
        sm: "h-10 px-4",
      },
    },
    defaultVariants: { variant: "signal", size: "md" },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}

export { Button };
