"use client";

import { Menu } from "@base-ui/react/menu";
import { ChevronDownIcon } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const menuItemClassName =
  "flex w-full cursor-default items-center rounded-md px-2.5 py-2 text-left text-sm text-slate-700 outline-none select-none data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-950 dark:text-slate-200 dark:data-[highlighted]:bg-slate-800 dark:data-[highlighted]:text-slate-50";

type ExportJobMenuProps = {
  csvExportHref: string;
  disabled: boolean;
  disabledMessage: string;
  xlsxExportHref: string;
};

export function ExportJobMenu({
  csvExportHref,
  disabled,
  disabledMessage,
  xlsxExportHref,
}: ExportJobMenuProps) {
  if (disabled) {
    return (
      <button
        type="button"
        disabled
        title={disabledMessage}
        aria-label={`Export jobs unavailable. ${disabledMessage}.`}
        className={cn(buttonVariants({ variant: "secondary" }))}
      >
        Export
        <ChevronDownIcon aria-hidden="true" className="size-4" />
      </button>
    );
  }

  return (
    <Menu.Root modal={false}>
      <Menu.Trigger
        aria-label="Export jobs"
        className={cn(buttonVariants({ variant: "secondary" }))}
      >
        Export
        <ChevronDownIcon aria-hidden="true" className="size-4" />
      </Menu.Trigger>
      <Menu.Portal>
        <Menu.Positioner side="bottom" align="end" sideOffset={6}>
          <Menu.Popup className="z-50 min-w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-slate-700 dark:bg-slate-900">
            <Menu.LinkItem href={csvExportHref} className={menuItemClassName} closeOnClick>
              Export CSV
            </Menu.LinkItem>
            <Menu.LinkItem href={xlsxExportHref} className={menuItemClassName} closeOnClick>
              Export XLSX
            </Menu.LinkItem>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
