import { LayoutDashboard, Calendar, Users, BookOpenText, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";

const mobileNavItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/members", icon: Users, label: "Members" },
  { href: "/leads", icon: BookOpenText, label: "Leads" },
];

export function MobileNav() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 flex items-center justify-around h-14 lg:hidden z-30">
      {mobileNavItems.map((item) => (
        <Link key={item.href} href={item.href}>
          <a className={cn(
            "flex flex-col items-center justify-center", 
            location === item.href ? "text-primary-500" : "text-neutral-500"
          )}>
            <item.icon className="h-5 w-5" />
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        </Link>
      ))}
      
      <DropdownMenu>
        <DropdownMenuTrigger className="flex flex-col items-center justify-center text-neutral-500">
          <MoreHorizontal className="h-5 w-5" />
          <span className="text-xs mt-1">More</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href="/analytics">Analytics</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/profile">Profile</Link>
          </DropdownMenuItem>
          {user?.isAdmin && (
            <DropdownMenuItem asChild>
              <Link href="/admin">Admin Panel</Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={handleLogout}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}

export default MobileNav;
