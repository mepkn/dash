import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

export function UnlockDialog({ open, onClose, onUnlock }: { open: boolean; onClose: () => void; onUnlock: (token: string) => void }) {
  const [value, setValue] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onUnlock(value.trim());
    setValue("");
    onClose();
  };
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Unlock edit mode</DialogTitle>
            <DialogDescription>The EDIT_TOKEN set on the Convex deployment. Stored in this browser only.</DialogDescription>
          </DialogHeader>
          <Field>
            <FieldLabel htmlFor="edit-token">Edit token</FieldLabel>
            <Input id="edit-token" type="password" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={!value.trim()}>Unlock</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
