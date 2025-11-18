import { cn } from "@/lib/utils";

interface HeaderProps {
  label: string;
}

export const Header = ({ label }: HeaderProps) => {
  return (
    <div className="w-full flex flex-col gap-y-4 items-center justify-center">
      <div className="flex flex-col items-center space-y-2">
        <img
          src="/logo.png"
          alt="CSIR Stage-Gate Logo"
          className="h-16 w-auto"
        />
        <h1 className={cn("text-2xl font-semibold text-gray-800")}>
          CSIR Stage-Gate
        </h1>
      </div>
      <p className="text-muted-foreground text-sm">{label}</p>
    </div>
  );
};
