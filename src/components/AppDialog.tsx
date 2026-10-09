import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import { cn, normalizeUrl } from "@/lib/utils";
import { buttonClass, inputClass, Modal } from "./Modal";

const ACCENTS = ["#00f0ff", "#8b5cf6", "#ff007a", "#00ffa3", "#ffb800", "#3b82f6"];

type Props = {
  open: boolean;
  app: Doc<"apps"> | null; // null = new app
  groups: string[];
  token: string;
  onClose: () => void;
};

export function AppDialog(props: Props) {
  // Remount the form per app so its fields start from that app's values.
  return (
    <Modal open={props.open} title={props.app ? `Edit ${props.app.name}` : "Add app"} onClose={props.onClose}>
      <AppForm key={props.app?._id ?? "new"} {...props} />
    </Modal>
  );
}

function AppForm({ app, groups, token, onClose }: Props) {
  const create = useMutation(api.apps.create);
  const update = useMutation(api.apps.update);
  const remove = useMutation(api.apps.remove);
  const [form, setForm] = useState({
    name: app?.name ?? "",
    url: app?.url ?? "",
    group: app?.group ?? groups[0] ?? "Apps",
    description: app?.description ?? "",
    icon: app?.icon ?? "",
    accent: app?.accent ?? ACCENTS[0],
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const fields = {
      token,
      name: form.name.trim(),
      url: normalizeUrl(form.url),
      group: form.group.trim() || "Apps",
      description: form.description.trim() || undefined,
      icon: form.icon.trim() || undefined,
      accent: form.accent,
    };
    run(() => (app ? update({ id: app._id, ...fields }) : create(fields)));
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <input className={inputClass} placeholder="Name" value={form.name} onChange={set("name")} required autoFocus />
      <input className={inputClass} placeholder="picki.pknspace.com" value={form.url} onChange={set("url")} required />
      <input className={inputClass} placeholder="Group" value={form.group} onChange={set("group")} list="dash-groups" />
      <datalist id="dash-groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
      <input className={inputClass} placeholder="Description (optional)" value={form.description} onChange={set("description")} />
      <input className={inputClass} placeholder="Icon URL (optional, defaults to favicon)" value={form.icon} onChange={set("icon")} />
      <div className="flex items-center gap-2">
        <span className="text-xs text-slate-400 mr-1">Accent</span>
        {ACCENTS.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`Accent ${c}`}
            onClick={() => setForm((f) => ({ ...f, accent: c }))}
            className={cn("size-6 rounded-full ring-2 ring-offset-2 ring-offset-slate-950", form.accent === c ? "ring-white/80" : "ring-transparent")}
            style={{ background: c }}
          />
        ))}
      </div>
      {error && <p className="text-sm text-pink">{error}</p>}
      <div className="flex items-center justify-between pt-2">
        {app ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => confirmDelete(app.name) && run(() => remove({ token, id: app._id }))}
            className={cn(buttonClass, "text-pink hover:bg-pink/10")}
          >
            Delete
          </button>
        ) : <span />}
        <button type="submit" disabled={busy} className={cn(buttonClass, "bg-cyan text-slate-950 hover:bg-cyan/90")}>
          {app ? "Save" : "Add"}
        </button>
      </div>
    </form>
  );
}

function confirmDelete(name: string) {
  return window.confirm(`Remove ${name} from the dashboard?`);
}
