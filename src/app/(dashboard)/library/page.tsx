import { Card, CardContent } from "@/components/ui/card";
import { Library as LibraryIcon } from "lucide-react";

export default function LibraryPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-muted-foreground">
          All your generated and recorded sounds in one place.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <LibraryIcon className="h-10 w-10 text-muted-foreground mb-3" />
          <p className="font-medium mb-1">Your library is empty</p>
          <p className="text-sm text-muted-foreground">
            Generated tracks and synth recordings will appear here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
