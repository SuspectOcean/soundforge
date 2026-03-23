import { CVA  } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "badge",
  {
    variants: {
      variant: {
        default: "border border-transparent bg-background text-foreground",
        secondary: "border border-pop bg-pop text-pop-foreground",
        destructive: "border border-destructive bg-destructive text-destructive-foreground",
        outline: "border border-foreground text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export function Badge({
   className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { variant: typeof badgeVariants.variant }) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  
          }

