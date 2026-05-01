"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./useAuthStore";

type AllowedRole = "admin" | "manager" | "cashier";

/**
 * Use this hook in protected pages.
 * Pass `allowedRoles` to restrict access by role.
 * - Cashier is redirected to /cashier if they try to access restricted pages.
 * - Non-authenticated users are redirected to /login.
 */
export function useRequireAuth(allowedRoles?: AllowedRole[]) {
  const router = useRouter();
  const { user, isLoggedIn, isChecked, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (!isChecked) return;

    if (!isLoggedIn) {
      router.replace("/login");
      return;
    }

    // Role-based access: if roles specified, check if user role is allowed
    if (allowedRoles && user && !allowedRoles.includes(user.role as AllowedRole)) {
      // Cashier only allowed on /cashier
      router.replace("/cashier");
    }
  }, [isChecked, isLoggedIn, user, router]);

  return { user, isChecked, isLoggedIn };
}
