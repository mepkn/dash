import { getAuthUserId } from "@convex-dev/auth/server";
import { ConvexError } from "convex/values";
import type { QueryCtx } from "../_generated/server";
import { isEditorEmail } from "./editors";

/**
 * Throws unless the caller is signed in AND their email is in EDITOR_EMAILS.
 * Checked on every write, so removing an email cuts off existing sessions.
 */
export async function requireEditor(ctx: QueryCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) throw new ConvexError("Not signed in");
  const user = await ctx.db.get(userId);
  if (!isEditorEmail(user?.email)) throw new ConvexError("Not authorized: editors only");
}
