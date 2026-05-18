import { cn } from "@/lib/utils";
import { PlusSquare } from "lucide-react";

type LogoProps = {
  className?: string;
  name?: string;
  nameClassName?: string;
};

export default function Logo({ className, name, nameClassName }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <PlusSquare className="h-8 w-8 text-primary" />
      <span className={cn("text-2xl font-bold font-headline text-foreground", nameClassName)}>
        {name || "MediTrack Pro"}
      </span>
    </div>
  );
}
