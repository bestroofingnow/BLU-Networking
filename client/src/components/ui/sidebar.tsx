import { Search, LayoutDashboard, Calendar, Users, BookOpenText, BarChart3, UserCog, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const navItems = [
  { href: "/", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/events", icon: Calendar, label: "Events" },
  { href: "/members", icon: Users, label: "Members" },
  { href: "/leads", icon: BookOpenText, label: "Leads" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/profile", icon: UserCog, label: "Profile" },
];

const adminItems = [
  { href: "/admin", icon: Settings, label: "Admin Panel" },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  return (
    <aside className="sidebar fixed top-16 left-0 bottom-0 hidden lg:block overflow-y-auto bg-white border-r border-neutral-200 z-20">
      <nav className="py-4">
        <div className="px-4 mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-neutral-400" />
            </div>
            <Input 
              type="text" 
              className="pl-10" 
              placeholder="Search..." 
            />
          </div>
        </div>
        
        <ul>
          {navItems.map((item) => (
            <li key={item.href}>
              <Link href={item.href}>
                <a
                  className={cn(
                    "flex items-center px-4 py-2 font-medium",
                    location === item.href
                      ? "text-primary-500 bg-primary-50"
                      : "text-neutral-700 hover:bg-neutral-50"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  <span>{item.label}</span>
                </a>
              </Link>
            </li>
          ))}
          
          {user?.isAdmin && (
            <>
              <li className="mt-8">
                {adminItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <a
                      className={cn(
                        "flex items-center px-4 py-2 font-medium",
                        location === item.href
                          ? "text-primary-500 bg-primary-50"
                          : "text-neutral-700 hover:bg-neutral-50"
                      )}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      <span>{item.label}</span>
                    </a>
                  </Link>
                ))}
              </li>
            </>
          )}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
