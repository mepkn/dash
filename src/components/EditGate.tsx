import type { ReactNode } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { ShieldX } from "lucide-react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { SignInPage } from "./SignInPage";

/** /edit: sign-in page, "access denied", or the dashboard in edit mode for allowlisted editors. */
export function EditGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.auth.me, isAuthenticated ? {} : "skip");
  const { signOut } = useAuthActions();

  if (isLoading || (isAuthenticated && me === undefined)) {
    return <div className="grid min-h-svh place-items-center text-sm text-muted-foreground">Loading…</div>;
  }
  if (!isAuthenticated || !me) return <SignInPage />;
  if (!me.canEdit) {
    return (
      <main className="grid min-h-svh place-items-center px-4">
        <div className="flex max-w-sm flex-col items-center gap-4 text-center">
          <ShieldX className="size-8 text-destructive" />
          <h1 className="text-lg font-semibold">Access denied</h1>
          <p className="text-sm text-muted-foreground">{me.email} is not on the editor allowlist.</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => void signOut()}>Sign out</Button>
            <Button render={<a href="/" />}>Back to the dashboard</Button>
          </div>
        </div>
      </main>
    );
  }
  return children;
}
