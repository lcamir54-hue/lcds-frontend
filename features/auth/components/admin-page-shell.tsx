"use client";

import { EmptyState } from "@/components/shared/empty-state";

export function AdminPageShell({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <EmptyState title={title} description={description} className="h-full" />
  );
}
