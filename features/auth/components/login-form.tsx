"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import * as React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/features/auth/lib/auth-session";
import { getErrorDetail } from "@/lib/api/errors";
import { APP_NAME, APP_TITLE_FA } from "@/lib/constants";

const loginSchema = z.object({
  username: z.string().min(1, "نام کاربری الزامی است"),
  password: z.string().min(1, "رمز عبور الزامی است"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null);
    try {
      await login(values);
      router.replace("/knowledge");
      router.refresh();
    } catch (err) {
      setError(getErrorDetail(err, "نام کاربری یا رمز عبور نادرست است"));
    }
  });

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-8">
      <div className="space-y-2 text-center">
        <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
        <h1 className="text-base font-medium text-foreground">{APP_TITLE_FA}</h1>
        <p className="text-sm text-muted-foreground">
          برای ورود، نام کاربری و رمز عبور خود را وارد کنید.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="username">نام کاربری</Label>
          <Input
            id="username"
            autoComplete="username"
            autoFocus
            aria-invalid={Boolean(errors.username) || undefined}
            {...register("username", {
              onChange: () => {
                if (error) setError(null);
              },
            })}
          />
          {errors.username ? (
            <p className="text-xs text-destructive">{errors.username.message}</p>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">رمز عبور</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password) || undefined}
            {...register("password", {
              onChange: () => {
                if (error) setError(null);
              },
            })}
          />
          {errors.password ? (
            <p className="text-xs text-destructive">{errors.password.message}</p>
          ) : null}
        </div>

        {error ? (
          <div
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </div>
        ) : null}

        <Button type="submit" className="w-full" isLoading={isSubmitting}>
          ورود
        </Button>
      </form>
    </div>
  );
}
