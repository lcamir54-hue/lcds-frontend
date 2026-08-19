"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import * as React from "react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { AdminWorkspace } from "@/features/admin/components/admin-workspace";
import { GroupFormDialog } from "@/features/admin/components/group-form-dialog";
import {
  apiGroupRepository,
  apiUserRepository,
} from "@/features/admin/repositories/api-admin-repository";
import type {
  GroupFormValues,
  ManagedGroup,
  ManagedUser,
} from "@/features/admin/types";

export function GroupsManagementPage() {
  const [groups, setGroups] = React.useState<ManagedGroup[]>([]);
  const [users, setUsers] = React.useState<ManagedUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingGroup, setEditingGroup] = React.useState<ManagedGroup | null>(
    null,
  );
  const [deletingGroup, setDeletingGroup] = React.useState<ManagedGroup | null>(
    null,
  );

  const usersById = React.useMemo(
    () => new Map(users.map((user) => [user.id, user])),
    [users],
  );

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [nextGroups, nextUsers] = await Promise.all([
          apiGroupRepository.listGroups(),
          apiUserRepository.listUsers(),
        ]);
        if (cancelled) return;
        setGroups(nextGroups);
        setUsers(nextUsers);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "خطا در بارگذاری گروه‌ها");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    const [nextGroups, nextUsers] = await Promise.all([
      apiGroupRepository.listGroups(),
      apiUserRepository.listUsers(),
    ]);
    setGroups(nextGroups);
    setUsers(nextUsers);
  };

  const openCreate = () => {
    setEditingGroup(null);
    setDialogOpen(true);
  };

  const openEdit = (group: ManagedGroup) => {
    setEditingGroup(group);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: GroupFormValues) => {
    if (editingGroup) {
      await apiGroupRepository.updateGroup(editingGroup.id, values);
    } else {
      await apiGroupRepository.createGroup(values);
    }
    await refresh();
  };

  const handleDelete = async () => {
    if (!deletingGroup) return;
    try {
      await apiGroupRepository.deleteGroup(deletingGroup.id);
      setDeletingGroup(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف گروه ناموفق بود");
    }
  };

  const memberNames = (group: ManagedGroup) => {
    const names = group.memberIds
      .map((id) => usersById.get(id)?.fullName)
      .filter(Boolean) as string[];
    if (names.length === 0) return "بدون عضو";
    if (names.length <= 2) return names.join("، ");
    return `${names.slice(0, 2).join("، ")} و ${names.length - 2} نفر دیگر`;
  };

  return (
    <AdminWorkspace
      title="مدیریت گروه‌ها"
      description="ایجاد، ویرایش گروه‌ها و اختصاص کاربران"
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          گروه جدید
        </Button>
      }
    >
      {error ? (
        <div
          role="alert"
          className="mb-4 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
        >
          {error}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 text-start font-medium">نام گروه</th>
              <th className="px-3 py-2 text-start font-medium">توضیحات</th>
              <th className="px-3 py-2 text-start font-medium">اعضا</th>
              <th className="px-3 py-2 text-start font-medium">تعداد</th>
              <th className="px-3 py-2 text-start font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  در حال بارگذاری…
                </td>
              </tr>
            ) : groups.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  گروهی ثبت نشده است.
                </td>
              </tr>
            ) : (
              groups.map((group) => (
                <tr
                  key={group.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-3 py-2.5 font-medium">{group.name}</td>
                  <td className="max-w-xs truncate px-3 py-2.5 text-muted-foreground">
                    {group.description || "—"}
                  </td>
                  <td className="max-w-xs truncate px-3 py-2.5">
                    {memberNames(group)}
                  </td>
                  <td className="px-3 py-2.5">{group.memberIds.length}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`ویرایش ${group.name}`}
                        onClick={() => openEdit(group)}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`حذف ${group.name}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingGroup(group)}
                      >
                        <Trash2
                          className="size-3.5"
                          aria-hidden
                        />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <GroupFormDialog
        open={dialogOpen}
        group={editingGroup}
        users={users}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(deletingGroup)}
        onOpenChange={(open) => {
          if (!open) setDeletingGroup(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف گروه؟</AlertDialogTitle>
            <AlertDialogDescription>
              «{deletingGroup?.name}» حذف می‌شود. این عمل قابل بازگشت نیست.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => void handleDelete()}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminWorkspace>
  );
}
