import { mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";

// Writes require the EDIT_TOKEN env var set on the deployment
// (`npx convex env set EDIT_TOKEN ...`); reads are public.
function assertToken(token: string) {
  const expected = process.env.EDIT_TOKEN;
  if (!expected || token !== expected) {
    throw new ConvexError("Invalid edit token");
  }
}

const fields = {
  name: v.string(),
  url: v.string(),
  group: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
  accent: v.optional(v.string()),
};

export const list = query({
  args: {},
  handler: (ctx) => ctx.db.query("apps").withIndex("by_order").collect(),
});

export const checkToken = query({
  args: { token: v.string() },
  handler: (_ctx, { token }) => !!process.env.EDIT_TOKEN && token === process.env.EDIT_TOKEN,
});

export const create = mutation({
  args: { token: v.string(), ...fields },
  handler: async (ctx, { token, ...app }) => {
    assertToken(token);
    const last = await ctx.db.query("apps").withIndex("by_order").order("desc").first();
    return ctx.db.insert("apps", { ...app, order: (last?.order ?? 0) + 1 });
  },
});

export const update = mutation({
  args: { token: v.string(), id: v.id("apps"), ...fields },
  handler: async (ctx, { token, id, ...app }) => {
    assertToken(token);
    await ctx.db.patch(id, app);
  },
});

export const remove = mutation({
  args: { token: v.string(), id: v.id("apps") },
  handler: async (ctx, { token, id }) => {
    assertToken(token);
    await ctx.db.delete(id);
  },
});

export const reorder = mutation({
  args: { token: v.string(), ids: v.array(v.id("apps")) },
  handler: async (ctx, { token, ids }) => {
    assertToken(token);
    await Promise.all(ids.map((id, i) => ctx.db.patch(id, { order: i + 1 })));
  },
});
