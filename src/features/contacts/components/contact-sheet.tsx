"use client";

import { PencilIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ContactForm } from "@/features/contacts/components/contact-form";
import type { JobContact } from "@/features/contacts/queries";

type ContactSheetProps = {
  company: string;
  contact?: JobContact;
  jobId: string;
};

export function ContactSheet({ company, contact, jobId }: ContactSheetProps) {
  const isEditing = Boolean(contact);

  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button variant={isEditing ? "ghost" : "secondary"} size="sm">
            {isEditing ? <PencilIcon aria-hidden="true" /> : <PlusIcon aria-hidden="true" />}
            {isEditing ? "Edit" : "Add contact"}
          </Button>
        }
      />
      <SheetContent side="right" className="w-full sm:max-w-xl">
        <div className="h-full overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{isEditing ? "Edit contact" : "Add contact"}</SheetTitle>
            <SheetDescription>
              {isEditing
                ? "Update this person's details and outreach record."
                : "Save a person you found through public search or know personally."}
            </SheetDescription>
          </SheetHeader>
          <div className="px-6 pb-6">
            <ContactForm jobId={jobId} defaultCompany={company} contact={contact} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
