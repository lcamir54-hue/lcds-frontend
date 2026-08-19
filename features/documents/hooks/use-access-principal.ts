"use client";

import * as React from "react";

import {
  type AccessPrincipal,
  getAccessPrincipal,
} from "@/features/documents/lib/access-control";

let cachedKey = "";
let cachedPrincipal: AccessPrincipal | null = null;

function readPrincipal(): AccessPrincipal | null {
  const next = getAccessPrincipal();
  const key = next
    ? `${next.userId ?? ""}:${next.username}:${next.role}:${next.groupIds.join(",")}`
    : "";
  if (key === cachedKey) return cachedPrincipal;
  cachedKey = key;
  cachedPrincipal = next;
  return next;
}

function subscribeToAccess(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => undefined;
  const notify = () => {
    cachedKey = "";
    onStoreChange();
  };
  window.addEventListener("lcds-auth-change", notify);
  window.addEventListener("storage", notify);
  return () => {
    window.removeEventListener("lcds-auth-change", notify);
    window.removeEventListener("storage", notify);
  };
}

function getServerSnapshot(): AccessPrincipal | null {
  return null;
}

export function useAccessPrincipal(): AccessPrincipal | null {
  return React.useSyncExternalStore(
    subscribeToAccess,
    readPrincipal,
    getServerSnapshot,
  );
}
