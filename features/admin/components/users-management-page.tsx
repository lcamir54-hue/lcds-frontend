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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AdminWorkspace } from "@/features/admin/components/admin-workspace";
import { UserFormDialog } from "@/features/admin/components/user-form-dialog";
import { apiUserRepository } from "@/features/admin/repositories/api-admin-repository";
import {
  type ManagedUser,
  ROLE_LABELS,
  type UserFormValues,
} from "@/features/admin/types";

export function UsersManagementPage() {
  const [users, setUsers] = React.useState<ManagedUser[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingUser, setEditingUser] = React.useState<ManagedUser | null>(null);
  const [deletingUser, setDeletingUser] = React.useState<ManagedUser | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const list = await apiUserRepository.listUsers();
        if (cancelled) return;
        setUsers(list);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "خطا در بارگذاری کاربران");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = async () => {
    const list = await apiUserRepository.listUsers();
    setUsers(list);
  };

  const openCreate = () => {
    setEditingUser(null);
    setDialogOpen(true);
  };

  const openEdit = (user: ManagedUser) => {
    setEditingUser(user);
    setDialogOpen(true);
  };

  const handleSubmit = async (values: UserFormValues) => {
    if (editingUser) {
      await apiUserRepository.updateUser(editingUser.id, values);
    } else {
      await apiUserRepository.createUser({
        username: values.username,
        fullName: values.fullName,
        email: values.email,
        role: values.role,
        password: values.password,
        isActive: values.isActive,
      });
    }
    await refresh();
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    try {
      await apiUserRepository.deleteUser(deletingUser.id);
      setDeletingUser(null);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "حذف کاربر ناموفق بود");
    }
  };

  return (
    <AdminWorkspace
      title="مدیریت کاربران"
      description="ایجاد، ویرایش و حذف کاربران سیستم"
      actions={
        <Button size="sm" onClick={openCreate}>
          <Plus className="size-4" aria-hidden />
          کاربر جدید
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
              <th className="px-3 py-2 text-start font-medium">نام کامل</th>
              <th className="px-3 py-2 text-start font-medium">نام کاربری</th>
              <th className="px-3 py-2 text-start font-medium">ایمیل</th>
              <th className="px-3 py-2 text-start font-medium">نقش</th>
              <th className="px-3 py-2 text-start font-medium">وضعیت</th>
              <th className="px-3 py-2 text-start font-medium">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  در حال بارگذاری…
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-3 py-8 text-center text-muted-foreground"
                >
                  کاربری ثبت نشده است.
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-border last:border-b-0"
                >
                  <td className="px-3 py-2.5">{user.fullName}</td>
                  <td className="px-3 py-2.5" dir="ltr">
                    {user.username}
                  </td>
                  <td className="px-3 py-2.5 text-muted-foreground" dir="ltr">
                    {user.email || "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge variant={user.isActive ? "secondary" : "outline"}>
                      {user.isActive ? "فعال" : "غیرفعال"}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`ویرایش ${user.fullName}`}
                        onClick={() => openEdit(user)}
                      >
                        <Pencil className="size-3.5" aria-hidden />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`حذف ${user.fullName}`}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => setDeletingUser(user)}
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

      <UserFormDialog
        open={dialogOpen}
        user={editingUser}
        onOpenChange={setDialogOpen}
        onSubmit={handleSubmit}
      />

      <AlertDialog
        open={Boolean(deletingUser)}
        onOpenChange={(open) => {
          if (!open) setDeletingUser(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف کاربر؟</AlertDialogTitle>
            <AlertDialogDescription>
              «{deletingUser?.fullName}» حذف می‌شود و از تمام گروه‌ها خارج می‌گردد.
              این عمل قابل بازگشت نیست.
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
