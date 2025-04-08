import { Bell, ChevronDown } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Link } from "wouter";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  title: string;
}

export function Header({ title }: HeaderProps) {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };
  
  return (
    <header className="bg-white border-b border-neutral-200 sticky top-0 z-30">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        <div className="flex items-center">
          <div className="flex items-center mr-4">
            <div className="h-10 w-10 bg-primary-500 rounded flex items-center justify-center text-white font-bold">
              BLU
            </div>
            <span className="ml-2 text-xl font-bold text-primary-500 hidden md:inline">BLU</span>
          </div>
          <h1 className="text-lg font-semibold text-neutral-800 md:text-xl">
            {title}
          </h1>
        </div>
        
        <div className="flex items-center">
          <button className="p-2 rounded-full hover:bg-neutral-100" aria-label="Notifications">
            <Bell className="h-5 w-5 text-neutral-600" />
          </button>
          <div className="relative ml-3">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center focus:outline-none">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.profileImage} alt={user?.fullName} />
                  <AvatarFallback>{user?.fullName ? getInitials(user.fullName) : "U"}</AvatarFallback>
                </Avatar>
                <span className="ml-2 text-sm font-medium text-neutral-700 hidden md:inline">
                  {user?.fullName}
                </span>
                <ChevronDown className="ml-1 h-4 w-4 text-neutral-400 hidden md:inline" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href="/profile">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
