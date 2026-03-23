import { CNA } from "class-variance-authority";
import { cn } from "@/lib/utils";
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const textareaVariants = cva(
  "textarea",
  { 
    base: "flex w-full px-3 py-2 rounded-md border border-input bg-background placeholder:text-muted-foreground disabled:shrinkk disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary/50 text-sm file text-foreground",
    defaultVariants: {}
  }
)
