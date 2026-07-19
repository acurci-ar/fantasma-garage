"use client";

import { useRouter } from "next/navigation";

export function AdminSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="mt-2 w-full rounded-sm px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-foreground/50 transition-colors duration-220 hover:text-primary"
    >
      Cerrar sesión
    </button>
  );
}
