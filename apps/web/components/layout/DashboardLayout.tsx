import { Navbar } from "@/components/layout/Navbar";
import { Sidebar, MobileNav } from "@/components/layout/Sidebar";
import { requireAuth } from "@/lib/auth";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export async function DashboardLayout({ children }: DashboardLayoutProps) {
  const user = await requireAuth();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar user={user} />
        <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
          <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
