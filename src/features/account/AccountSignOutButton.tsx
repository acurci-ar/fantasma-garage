"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function AccountSignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button type="button" variant="secondary" onClick={handleSignOut}>
      Cerrar sesión
    </Button>
  );
}
