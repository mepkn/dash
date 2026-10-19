import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import { isEditorEmail } from "./editors";

/** True when the caller is signed in AND their email is in ALLOWED_EMAILS. */
export async function isEditor(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) return false;
  const user = await ctx.db.get(userId);
  return isEditorEmail(user?.email);
}

/**
 * Throws unless the caller is an editor.
 * Checked on every write, so removing an email cuts off existing sessions.
 */
export async function requireEditor(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("Not signed in");
  if (!(await isEditor(ctx))) throw new ConvexError("Not authorized: editors only");
}
