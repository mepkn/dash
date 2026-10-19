import { useMutation } from "convex/react";
import { useState, type FormEvent } from "react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
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
import { Switch } from "@/components/ui/switch";
import { normalizeUrl } from "@/lib/utils";


type Props = {
  open: boolean;
  app: Doc<"apps"> | null; // null = new app
  groups: string[];
  onClose: () => void;
};

export function AppDialog(props: Props) {
  return (
    <Dialog open={props.open} onOpenChange={(next) => !next && props.onClose()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-md">
        {/* Remount the form per app so its fields start from that app's values. */}
        <AppForm key={props.app?._id ?? "new"} {...props} />
      </DialogContent>
    </Dialog>
  );
}

function AppForm({ app, groups, onClose }: Props) {
  const create = useMutation(api.apps.create);
  const update = useMutation(api.apps.update);
  const remove = useMutation(api.apps.remove);
  const [form, setForm] = useState({
    name: app?.name ?? "",
    web: app?.web ?? app?.url ?? "",
    android: app?.android ?? "",
    desktop: app?.desktop ?? "",
    repo: app?.repo ?? "",
    group: app?.group ?? groups[0] ?? "Apps",
    description: app?.description ?? "",
    icon: app?.icon ?? "",
  });
  const [isPrivate, setPrivate] = useState(app?.private ?? false);
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
    if (!form.web.trim() && !form.android.trim() && !form.desktop.trim()) {
      setError("Add a web, Android or desktop link");
      return;
    }
    const fields = {
      name: form.name.trim(),
      web: form.web.trim() ? normalizeUrl(form.web) : undefined,
      android: form.android.trim() ? normalizeUrl(form.android) : undefined,
      desktop: form.desktop.trim() ? normalizeUrl(form.desktop) : undefined,
      repo: form.repo.trim() ? normalizeUrl(form.repo) : undefined,
      private: isPrivate || undefined,
      group: form.group.trim() || "Apps",
      description: form.description.trim() || undefined,
      icon: form.icon.trim() || undefined,
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
          <FieldLabel htmlFor="app-web">Web</FieldLabel>
          <Input id="app-web" placeholder="picki.pknspace.com" value={form.web} onChange={set("web")} />
          <FieldDescription>The live site; the only link with a status check.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="app-android">Android</FieldLabel>
          <Input id="app-android" placeholder="github.com/mepkn/alp/releases/latest" value={form.android} onChange={set("android")} />
        </Field>
        <Field>
          <FieldLabel htmlFor="app-desktop">Desktop</FieldLabel>
          <Input id="app-desktop" value={form.desktop} onChange={set("desktop")} />
          <FieldDescription>Fill in at least one of web, Android and desktop.</FieldDescription>
        </Field>
        <Field>
          <FieldLabel htmlFor="app-repo">Source</FieldLabel>
          <Input id="app-repo" placeholder="github.com/mepkn/alp" value={form.repo} onChange={set("repo")} />
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
        <Field orientation="horizontal">
          <Switch id="app-private" checked={isPrivate} onCheckedChange={setPrivate} />
          <FieldLabel htmlFor="app-private">Private: only editors see it</FieldLabel>
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
                <AlertDialogAction variant="destructive" onClick={() => run(() => remove({ id: app._id }))}>Remove</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : <span />}
        <Button type="submit" disabled={busy}>{app ? "Save" : "Add"}</Button>
      </DialogFooter>
    </form>
  );
}
