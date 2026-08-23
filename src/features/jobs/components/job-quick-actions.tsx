"use client";

import { useActionState, useState } from "react";
import { Menu } from "@base-ui/react/menu";
import {
  ArchiveIcon,
  CheckIcon,
  ChevronRightIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  PencilIcon,
  Trash2Icon,
} from "lucide-react";

import {
  archiveJob,
  type JobManagementActionState,
  type UpdateJobStatusActionState,
  updateJobStatus,
} from "@/features/jobs/actions";
import { JobDeleteDialog } from "@/features/jobs/components/job-delete-dialog";
import {
  getJobQuickActions,
  type JobQuickActionTarget,
} from "@/features/jobs/job-quick-actions";
import { statusLabels } from "@/features/jobs/status";

type JobQuickActionsProps = {
  job: JobQuickActionTarget;
};

const initialStatusState: UpdateJobStatusActionState = {};
const initialManagementState: JobManagementActionState = {};

const menuItemClassName =
  "flex w-full cursor-default items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm text-slate-700 outline-none select-none data-[highlighted]:bg-slate-100 data-[highlighted]:text-slate-950 data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50 dark:text-slate-200 dark:data-[highlighted]:bg-slate-800 dark:data-[highlighted]:text-slate-50";

export function JobQuickActions({ job }: JobQuickActionsProps) {
  const quickActions = getJobQuickActions(job);
  const [statusState, statusAction, isUpdatingStatus] = useActionState(
    updateJobStatus,
    initialStatusState,
  );
  const [archiveState, archiveAction, isArchiving] = useActionState(
    archiveJob,
    initialManagementState,
  );
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const formError =
    statusState.formError ?? archiveState.formError;

  return (
    <div className="relative flex justify-end">
      <Menu.Root modal={false}>
        <Menu.Trigger
          aria-label={`Actions for ${job.title} at ${job.company}`}
          className="inline-flex size-9 items-center justify-center rounded-full text-slate-500 outline-none transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-950"
        >
          <EllipsisIcon aria-hidden="true" className="size-4" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={6}>
            <Menu.Popup className="z-50 min-w-52 rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-slate-700 dark:bg-slate-900">
              <Menu.SubmenuRoot>
                <Menu.SubmenuTrigger className={menuItemClassName}>
                  Change status
                  <ChevronRightIcon aria-hidden="true" className="ml-auto size-4" />
                </Menu.SubmenuTrigger>
                <Menu.Portal>
                  <Menu.Positioner side="right" align="start" sideOffset={4}>
                    <Menu.Popup className="z-50 min-w-48 rounded-lg border border-slate-200 bg-white p-1 shadow-lg outline-none transition data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0 dark:border-slate-700 dark:bg-slate-900">
                      <form action={statusAction}>
                        <input type="hidden" name="jobId" value={job.id} />
                        {quickActions.statusOptions.map(({ status, isCurrent }) => (
                          <Menu.Item
                            key={status}
                            nativeButton
                            disabled={isCurrent || isUpdatingStatus}
                            render={
                              <button
                                type="submit"
                                name="status"
                                value={status}
                                className={menuItemClassName}
                              />
                            }
                          >
                            <span>{statusLabels[status]}</span>
                            {isCurrent ? (
                              <span className="ml-auto flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                <CheckIcon aria-hidden="true" className="size-3.5" />
                                Current
                              </span>
                            ) : null}
                          </Menu.Item>
                        ))}
                      </form>
                    </Menu.Popup>
                  </Menu.Positioner>
                </Menu.Portal>
              </Menu.SubmenuRoot>

              <Menu.LinkItem
                href={`/jobs/${job.id}/edit`}
                className={menuItemClassName}
                closeOnClick
              >
                <PencilIcon aria-hidden="true" className="size-4" />
                Edit job
              </Menu.LinkItem>

              {quickActions.jobPostingUrl ? (
                <Menu.LinkItem
                  href={quickActions.jobPostingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={menuItemClassName}
                  closeOnClick
                >
                  <ExternalLinkIcon aria-hidden="true" className="size-4" />
                  Open job posting
                </Menu.LinkItem>
              ) : null}

              <Menu.Separator className="my-1 h-px bg-slate-200 dark:bg-slate-700" />

              {job.status === "ARCHIVED" ? (
                <form action={statusAction}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <Menu.Item
                    nativeButton
                    disabled={isUpdatingStatus}
                    render={
                      <button
                        type="submit"
                        name="status"
                        value="SAVED"
                        className={menuItemClassName}
                      />
                    }
                  >
                    <ArchiveIcon aria-hidden="true" className="size-4" />
                    {quickActions.archiveLabel}
                  </Menu.Item>
                </form>
              ) : (
                <form action={archiveAction}>
                  <input type="hidden" name="jobId" value={job.id} />
                  <Menu.Item
                    nativeButton
                    disabled={isArchiving}
                    render={<button type="submit" className={menuItemClassName} />}
                  >
                    <ArchiveIcon aria-hidden="true" className="size-4" />
                    {quickActions.archiveLabel}
                  </Menu.Item>
                </form>
              )}

              <Menu.Item
                nativeButton
                onClick={() => setIsDeleteDialogOpen(true)}
                render={
                  <button
                    type="button"
                    className={`${menuItemClassName} text-red-700 data-[highlighted]:bg-red-50 data-[highlighted]:text-red-800 dark:text-red-300 dark:data-[highlighted]:bg-red-500/10 dark:data-[highlighted]:text-red-200`}
                  />
                }
              >
                <Trash2Icon aria-hidden="true" className="size-4" />
                Delete
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {formError ? (
        <p
          role="alert"
          className="absolute top-full right-0 z-40 mt-1 w-56 rounded-md bg-red-50 px-2 py-1.5 text-xs text-red-700 shadow-sm ring-1 ring-red-200 dark:bg-red-500/15 dark:text-red-200 dark:ring-red-400/30"
        >
          {formError}
        </p>
      ) : null}
      <JobDeleteDialog
        company={job.company}
        jobId={job.id}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title={job.title}
      />
    </div>
  );
}
