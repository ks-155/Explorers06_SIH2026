"use client";

export async function enableMocks() {
  if (process.env.NODE_ENV !== "development") return;
  const { worker } = await import("./browser");
  return worker.start({ onUnhandledRequest: "bypass" });
}