/** Parses the comma-separated EDITOR_EMAILS env var into normalized emails. */
export function editorEmails(): string[] {
  return (process.env.EDITOR_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter((e) => e.length > 0);
}

export function isEditorEmail(email: string | undefined | null): boolean {
  if (!email) return false;
  return editorEmails().includes(email.trim().toLowerCase());
}
