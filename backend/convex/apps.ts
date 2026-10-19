import { internalMutation, mutation, query } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { isEditor, requireEditor } from "./lib/access";

// Reads are public except private apps, which only editors see; every write requires an editor (ALLOWED_EMAILS).

const fields = {
  name: v.string(),
  web: v.optional(v.string()),
  android: v.optional(v.string()),
  desktop: v.optional(v.string()),
  repo: v.optional(v.string()),
  private: v.optional(v.boolean()),
  group: v.string(),
  description: v.optional(v.string()),
  icon: v.optional(v.string()),
};

function requireLink(app: { web?: string; android?: string; desktop?: string }) {
  if (!app.web && !app.android && !app.desktop) throw new ConvexError("Add a web, Android or desktop link");
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const apps = await ctx.db.query("apps").withIndex("by_order").collect();
    return (await isEditor(ctx)) ? apps : apps.filter((a) => !a.private);
  },
});

/**
 * Web links for server/live.py to check, private ones included, keyed by app id so
 * the public status.json never names a private app. Needs LIVE_TOKEN.
 */
export const monitorTargets = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    if (!process.env.LIVE_TOKEN || token !== process.env.LIVE_TOKEN) throw new ConvexError("Bad token");
    const apps = await ctx.db.query("apps").collect();
    return apps.flatMap((a) => (a.web ? [{ id: a._id, url: a.web }] : []));
  },
});

export const create = mutation({
  args: { ...fields },
  handler: async (ctx, app) => {
    await requireEditor(ctx);
    requireLink(app);
    const last = await ctx.db.query("apps").withIndex("by_order").order("desc").first();
    return ctx.db.insert("apps", { ...app, order: (last?.order ?? 0) + 1 });
  },
});

export const update = mutation({
  args: { id: v.id("apps"), ...fields },
  handler: async (ctx, { id, ...app }) => {
    await requireEditor(ctx);
    requireLink(app);
    // Clear retired fields on old rows.
    await ctx.db.patch(id, { ...app, url: undefined, accent: undefined });
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

/** One-off: `npx convex run apps:migrateLinks` moves `url` to `web` and drops `accent`. */
export const migrateLinks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const apps = await ctx.db.query("apps").collect();
    for (const a of apps) {
      if (a.url === undefined && a.accent === undefined) continue;
      await ctx.db.patch(a._id, { web: a.web ?? a.url, url: undefined, accent: undefined });
    }
    return apps.length;
  },
});
