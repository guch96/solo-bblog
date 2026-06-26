"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import DesktopNav from "@/components/nav/DesktopNav";
import BottomNav from "@/components/nav/BottomNav";
import { Toaster } from "@/components/ui/sonner";

function AuthGuardInner({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace("/login");
    }
    if (!isLoading && isAuthenticated && isLoginPage) {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="text-muted-foreground text-sm">加载中...</span>
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <body className="min-h-screen bg-background text-foreground antialiased pb-20 md:pb-0">
      <DesktopNav />
      <main className="container max-w-2xl mx-auto px-5 py-6 md:py-8">
        {children}
      </main>
      <BottomNav />
      <Toaster />
    </body>
  );
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <AuthGuardInner>{children}</AuthGuardInner>
    </AuthProvider>
  );
}
