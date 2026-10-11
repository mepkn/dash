import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { requireEditor } from "./lib/access";

// Reads are public; every write requires a signed-in editor (EDITOR_EMAILS).

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

export const create = mutation({
  args: { ...fields },
  handler: async (ctx, app) => {
    await requireEditor(ctx);
    const last = await ctx.db.query("apps").withIndex("by_order").order("desc").first();
    return ctx.db.insert("apps", { ...app, order: (last?.order ?? 0) + 1 });
  },
});

export const update = mutation({
  args: { id: v.id("apps"), ...fields },
  handler: async (ctx, { id, ...app }) => {
    await requireEditor(ctx);
    await ctx.db.patch(id, app);
  },
});

export const remove = mutation({
  args: { id: v.id("apps") },
  handler: async (ctx, { id }) => {
    await requireEditor(ctx);
    await ctx.db.delete(id);
  },
});

export const reorder = mutation({
  args: { ids: v.array(v.id("apps")) },
  handler: async (ctx, { ids }) => {
    await requireEditor(ctx);
    await Promise.all(ids.map((id, i) => ctx.db.patch(id, { order: i + 1 })));
  },
});
