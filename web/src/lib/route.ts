/**
 * Two entry points, like syntax-party:
 *   /       read-only dashboard, for everyone
 *   /edit   sign-in, then the same dashboard with editing turned on
 */
export const EDIT_PATH = "/edit";
export const isEditRoute = location.pathname.replace(/\/+$/, "") === EDIT_PATH;
