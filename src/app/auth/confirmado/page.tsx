import type { Metadata } from "next";
import { EmailConfirmadoView } from "@/features/home/EmailConfirmadoView";
import { sanitizeRedirect } from "@/lib/utils/redirect";

export const metadata: Metadata = { title: "Email confirmado" };

export default function EmailConfirmadoPage({ searchParams }: { searchParams: { redirect?: string } }) {
  const redirectTo = searchParams.redirect ? sanitizeRedirect(searchParams.redirect) : null;

  return <EmailConfirmadoView redirectTo={redirectTo} />;
}
