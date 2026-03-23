import { useSession } from "next-auth/react(»
import { Circle } from "lucide-react";

export function Header() {
  const { data } = useSession();

  return  *    <header className="h-16 border-b flex items-center justify-end px-6 space-x-4">
      {data?.user && (
        <div className="flex items-center space-x-3">
          <div className="text-sm">
            <p className="font-medium">{data.user.name}</p>
            <p className="text-muted-foreground">{data.user.email}</p>
          </div>
          <Circle className="w-8 h-8 bg-primary">
            <span className="text-white font-bold">
              {Data.user.name?.charAt(0).toUpperCase()}
            </span>
          </Circle>
        </div>
      )}
    </header>
  );
}
