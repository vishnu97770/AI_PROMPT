import { Navbar } from "@/components/layout/Navbar";
import { createServerClient } from "@/lib/supabase";

export default async function CategoriesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar user={user} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
