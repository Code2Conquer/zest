"use client";

import { api, refreshAll, useApi } from "./api";

export type Me = {
  user: { name: string; email: string | null } | null;
  role: "owner" | "manager" | "kitchen" | "cashier" | "rider" | null;
  outletId: string | null;
  staffCode: string | null;
  methods: { google: boolean; dev: boolean };
};

/** Who is signed in on this browser. */
export const useMe = () => useApi<Me>("/api/auth/me");

export async function signOutHere() {
  await api("/api/auth/logout", { method: "POST" });
  refreshAll();
}
