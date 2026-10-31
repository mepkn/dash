import { internalMutation } from "./_generated/server";

/** One-off: marks users created before email verification as verified. */
export const markUsersVerified = internalMutation({
  args: {},
  handler: async (ctx) => {
    let n = 0;
    for (const user of await ctx.db.query("users").collect()) {
      if (user.emailVerificationTime === undefined) {
        await ctx.db.patch(user._id, { emailVerificationTime: Date.now() });
        n++;
      }
    }
    return n;
  },
});
