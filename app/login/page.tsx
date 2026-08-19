import { LoginForm } from "@/features/auth/components/login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-md border border-border bg-surface p-6 shadow-none md:p-8">
        <LoginForm />
      </div>
    </main>
  );
}
