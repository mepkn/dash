import { Autocomplete } from "@base-ui/react/autocomplete";
import { ChevronDown } from "lucide-react";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";

type Props = {
  id: string;
  value: string;
  groups: string[];
  onChange: (value: string) => void;
};

/**
 * Free-text group field with the existing groups as suggestions. Unlike a <datalist>,
 * it lists every group when the field already holds one, so switching needs no clearing.
 */
export function GroupInput({ id, value, groups, onChange }: Props) {
  const showAll = !value.trim() || groups.includes(value);
  return (
    <Autocomplete.Root
      items={groups}
      value={value}
      onValueChange={onChange}
      openOnInputClick
      filter={(group, query) => showAll || group.toLowerCase().includes(query.trim().toLowerCase())}
    >
      <InputGroup>
        <Autocomplete.Input id={id} render={<InputGroupInput />} />
        <InputGroupAddon align="inline-end">
          <Autocomplete.Trigger render={<InputGroupButton size="icon-xs" variant="ghost" aria-label="Show groups" />}>
            <ChevronDown />
          </Autocomplete.Trigger>
        </InputGroupAddon>
      </InputGroup>
      <Autocomplete.Portal>
        <Autocomplete.Positioner sideOffset={6} className="isolate z-50">
          <Autocomplete.Popup className="max-h-(--available-height) w-(--anchor-width) overflow-hidden rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 data-empty:hidden">
            <Autocomplete.List className="max-h-64 overflow-y-auto p-1">
              {(group: string) => (
                <Autocomplete.Item
                  key={group}
                  value={group}
                  className="cursor-default rounded-md px-2 py-1.5 text-sm outline-none select-none data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                >
                  {group}
                </Autocomplete.Item>
              )}
            </Autocomplete.List>
          </Autocomplete.Popup>
        </Autocomplete.Positioner>
      </Autocomplete.Portal>
    </Autocomplete.Root>
  );
}
