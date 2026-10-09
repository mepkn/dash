import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "../../convex/_generated/api";
import type { Doc } from "../../convex/_generated/dataModel";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn, normalizeUrl } from "@/lib/utils";

const ACCENTS = ["#00f0ff", "#8b5cf6", "#ff007a", "#00ffa3", "#ffb800", "#3b82f6"];

type Props = {
  open: boolean;
  app: Doc<"apps"> | null; // null = new app
  groups: string[];
  token: string;
  onClose: () => void;
};

export function AppDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={(next) => !next && props.onClose()}>
      <DialogContent className="sm:max-w-md">
        {/* Remount the form per app so its fields start from that app's values. */}
        <AppForm key={props.app?._id ?? "new"} {...props} />
      </DialogContent>
    </Dialog>
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
    <form onSubmit={submit} className="grid gap-4">
      <DialogHeader>
        <DialogTitle>{app ? `Edit ${app.name}` : "Add app"}</DialogTitle>
      </DialogHeader>
      <FieldGroup className="gap-4">
        <Field>
          <FieldLabel htmlFor="app-name">Name</FieldLabel>
          <Input id="app-name" value={form.name} onChange={set("name")} required autoFocus />
        </Field>
        <Field>
          <FieldLabel htmlFor="app-url">URL</FieldLabel>
          <Input id="app-url" placeholder="picki.pknspace.com" value={form.url} onChange={set("url")} required />
        </Field>
        <Field>
          <FieldLabel htmlFor="app-group">Group</FieldLabel>
          <Input id="app-group" value={form.group} onChange={set("group")} list="dash-groups" />
          <datalist id="dash-groups">{groups.map((g) => <option key={g} value={g} />)}</datalist>
        </Field>
        <Field>
          <FieldLabel htmlFor="app-description">Description</FieldLabel>
          <Input id="app-description" value={form.description} onChange={set("description")} />
          <FieldDescription>Optional. Shown under the name instead of the domain.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="app-icon">Icon URL</FieldLabel>
          <Input id="app-icon" value={form.icon} onChange={set("icon")} />
          <FieldDescription>Optional. Defaults to the app's favicon.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel>Accent</FieldLabel>
          <div className="flex gap-2.5">
            {ACCENTS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={`Accent ${c}`}
                aria-pressed={form.accent === c}
                onClick={() => setForm((f) => ({ ...f, accent: c }))}
                className={cn("size-6 rounded-full ring-2 ring-offset-2 ring-offset-popover transition", form.accent === c ? "ring-foreground/80" : "ring-transparent hover:ring-foreground/30")}
                style={{ background: c }}
              />
            ))}
          </div>
        </Field>
        {error && <FieldError>{error}</FieldError>}
      </FieldGroup>
      <DialogFooter className="sm:justify-between">
        {app ? (
          <AlertDialog>
            <AlertDialogTrigger render={<Button type="button" variant="destructive" disabled={busy} />}>Delete</AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove {app.name}?</AlertDialogTitle>
                <AlertDialogDescription>It disappears from the dashboard for everyone. The app itself isn't touched.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={() => run(() => remove({ token, id: app._id }))}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : <span />}
        <Button type="submit" disabled={busy}>{app ? "Save" : "Add"}</Button>
      </DialogFooter>
    </form>
  );
}
