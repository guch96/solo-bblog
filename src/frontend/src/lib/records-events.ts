"use client";

export const RECORDS_CHANGED_EVENT = "pooptracker:records-changed";

export const emitRecordsChanged = () => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(RECORDS_CHANGED_EVENT));
};

