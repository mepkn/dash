import { authTables } from "@convex-dev/auth/server";
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ...authTables,
  apps: defineTable({
    name: v.string(),
    url: v.string(),
    group: v.string(),
    description: v.optional(v.string()),
    // Icon image URL; when absent the app's /favicon.svg or /favicon.ico is used.
    icon: v.optional(v.string()),
    // Accent colour for the card glow, e.g. "#00f0ff".
    accent: v.optional(v.string()),
    order: v.number(),
  }).index("by_order", ["order"]),
});
