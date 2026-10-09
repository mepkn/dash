import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "../../convex/_generated/api";

const KEY = "dash.editToken";

function read(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

/** The edit token lives in localStorage; Convex verifies it on every write. */
export function useEditToken() {
  const [token, setTokenState] = useState(read);
  const valid = useQuery(api.apps.checkToken, token ? { token } : "skip") ?? false;

  const setToken = (next: string) => {
    try {
      if (next) localStorage.setItem(KEY, next);
      else localStorage.removeItem(KEY);
    } catch {
      // Private mode: edit mode lasts for this tab only.
    }
    setTokenState(next);
  };

  return { token, canEdit: valid, setToken };
}
