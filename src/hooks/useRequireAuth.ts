"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "./useAuthStore";

/**
 * Use this hook in any protected page.
 * Returns { user, isChecked }.
 * While isChecked is false, the page should show a loading spinner.
 * If the user is not logged in after check, it redirects to /login.
 */
export function useRequireAuth() {
  const router = useRouter();
  const { user, isLoggedIn, isChecked, loadFromStorage } = useAuthStore();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (isChecked && !isLoggedIn) {
      router.replace("/login");
    }
  }, [isChecked, isLoggedIn, router]);

  return { user, isChecked, isLoggedIn };
}
