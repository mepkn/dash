import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  apps: defineTable({
    name: v.string(),
    // One link per platform; at least one is set. Only `web` gets a status check.
    web: v.optional(v.string()),
    android: v.optional(v.string()),
    desktop: v.optional(v.string()),
    repo: v.optional(v.string()),
    // Hidden from everyone but signed-in editors, including live.py's status file.
    private: v.optional(v.boolean()),
    group: v.string(),
    description: v.optional(v.string()),
    // Icon image URL; when absent the web link's /favicon.svg or /favicon.ico is used.
    icon: v.optional(v.string()),
    // Retired: `url` became `web` (apps:migrateLinks); `accent` is no longer shown.
    url: v.optional(v.string()),
    accent: v.optional(v.string()),
    order: v.number(),
  }).index("by_order", ["order"]),
});
