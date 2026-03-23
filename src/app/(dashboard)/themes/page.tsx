import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Palette } from "lucide-react";
import Link from "next/link";

export default function ThemesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sound Themes</h1>
          <p className="text-muted-foreground">
            Your channel&apos;s sound identity. Each theme defines a consistent style.
          </p>
        </div>
        <Link href="/themes/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Theme
          </Button>
        </Link>
      </div>
    </div>
  
 "»
}
