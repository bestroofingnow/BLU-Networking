import { ReactNode } from "react";
import Header from "@/components/ui/header";
import Sidebar from "@/components/ui/sidebar";
import MobileNav from "@/components/ui/mobile-nav";

interface DashboardLayoutProps {
  children: ReactNode;
  title: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  return (
    <>
      <Header title={title} />
      <Sidebar />
      <main className="page-content pt-4 pb-20 lg:pb-6 px-4">
        <div className="container mx-auto max-w-7xl">
          {children}
        </div>
      </main>
      <MobileNav />
    </>
  );
}

export default DashboardLayout;
