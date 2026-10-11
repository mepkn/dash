import { convexAuth, getAuthUserId } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import { ConvexError } from "convex/values";
import { query } from "./_generated/server";
import { isEditorEmail } from "./lib/editors";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Password({
      // Runs for sign-up and sign-in alike, before anything is stored. Rejecting
      // non-allowlisted emails here means nobody outside EDITOR_EMAILS can sign up.
      profile(params) {
        const email = String(params.email ?? "").trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          throw new ConvexError("Enter a valid email address.");
        }
        if (!isEditorEmail(email)) {
          throw new ConvexError("This email is not on the editor allowlist.");
        }
        return { email };
      },
      validatePasswordRequirements(password) {
        if (password.length < 8) {
          throw new ConvexError("Password must be at least 8 characters.");
        }
      },
    }),
  ],
});

/** Who am I? `canEdit` decides whether the editing UI is shown. */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) return null;
    const user = await ctx.db.get(userId);
    if (!user) return null;
    return { email: user.email ?? null, canEdit: isEditorEmail(user.email) };
  },
});
