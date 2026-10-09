import { useState, type FormEvent } from "react";
import { cn } from "@/lib/utils";
import { buttonClass, inputClass, Modal } from "./Modal";

export function UnlockDialog({ open, onClose, onUnlock }: { open: boolean; onClose: () => void; onUnlock: (token: string) => void }) {
  const [value, setValue] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onUnlock(value.trim());
    setValue("");
    onClose();
  };
  return (
    <Modal open={open} title="Unlock edit mode" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <input type="password" className={inputClass} placeholder="Edit token" value={value} onChange={(e) => setValue(e.target.value)} autoFocus />
        <p className="text-xs text-slate-500">The EDIT_TOKEN set on the Convex deployment. Stored in this browser only.</p>
        <div className="flex justify-end">
          <button type="submit" className={cn(buttonClass, "bg-cyan text-slate-950 hover:bg-cyan/90")}>Unlock</button>
        </div>
      </form>
    </Modal>
  );
}
