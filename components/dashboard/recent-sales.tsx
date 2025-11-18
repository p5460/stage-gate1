import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RecentSales() {
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/01.png" alt="Avatar" />
          <AvatarFallback>SJ</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Dr. Sarah Johnson</p>
          <p className="text-sm text-muted-foreground">
            Updated Smart Water Meter project
          </p>
        </div>
        <div className="ml-auto font-medium">2h ago</div>
      </div>
      <div className="flex items-center">
        <Avatar className="flex h-9 w-9 items-center justify-center space-y-0 border">
          <AvatarImage src="/avatars/02.png" alt="Avatar" />
          <AvatarFallback>MB</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Prof. Mike Brown</p>
          <p className="text-sm text-muted-foreground">
            Raised red flag on Waste Management project
          </p>
        </div>
        <div className="ml-auto font-medium">4h ago</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/03.png" alt="Avatar" />
          <AvatarFallback>LW</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Dr. Linda Williams</p>
          <p className="text-sm text-muted-foreground">
            Completed gate review for Traffic AI
          </p>
        </div>
        <div className="ml-auto font-medium">1d ago</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/04.png" alt="Avatar" />
          <AvatarFallback>JS</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Dr. John Smith</p>
          <p className="text-sm text-muted-foreground">
            Approved Stage 2 progression
          </p>
        </div>
        <div className="ml-auto font-medium">2d ago</div>
      </div>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/05.png" alt="Avatar" />
          <AvatarFallback>TK</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Dr. Tom Kim</p>
          <p className="text-sm text-muted-foreground">
            Uploaded new research documents
          </p>
        </div>
        <div className="ml-auto font-medium">3d ago</div>
      </div>
    </div>
  );
}
