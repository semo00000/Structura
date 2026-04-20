"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronsUpDown } from "lucide-react";

// ─────────────────────────────────────────────
// Generic Combobox with search
// ─────────────────────────────────────────────
export interface ComboboxOption {
  value: string;
  label: string;
  sublabel?: string;
  meta?: string;
}

interface ComboboxSearchProps {
  options: ComboboxOption[];
  value: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

export function ComboboxSearch({
  options,
  value,
  onSelect,
  placeholder = "Sélectionner...",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat.",
  className,
  disabled = false,
  id,
}: ComboboxSearchProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        id={id}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm transition-colors",
          "hover:bg-accent/50 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30",
          "disabled:cursor-not-allowed disabled:opacity-50",
          !selectedOption && "text-muted-foreground",
          className
        )}
        render={<button type="button" />}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronsUpDown className="ml-2 size-3.5 shrink-0 opacity-40" />
      </PopoverTrigger>
      <PopoverContent
        className="w-[--anchor-width] p-0"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={`${option.label} ${option.sublabel ?? ""} ${option.meta ?? ""}`}
                  data-checked={value === option.value || undefined}
                  onSelect={() => {
                    onSelect(option.value === value ? "" : option.value);
                    setOpen(false);
                  }}
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{option.label}</span>
                    {option.sublabel && (
                      <span className="text-xs text-muted-foreground">
                        {option.sublabel}
                      </span>
                    )}
                  </div>
                  {option.meta && (
                    <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
                      {option.meta}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
