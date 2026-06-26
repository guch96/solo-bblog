"use client";

const BEIJING_OFFSET_MINUTES = 8 * 60;

const pad = (n: number) => String(n).padStart(2, "0");

export const getBeijingDateParts = (date = new Date()) => {
  const local = new Date(date.getTime() + BEIJING_OFFSET_MINUTES * 60 * 1000);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
  };
};

export const getBeijingTodayString = () => {
  const { year, month, day } = getBeijingDateParts();
  return `${year}-${pad(month)}-${pad(day)}`;
};

export const formatRecordDateTime = (iso: string) => {
  const d = new Date(iso);
  return new Intl.DateTimeFormat("zh-CN", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
};

export const formatLocalDateInput = (iso: string): string => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(d);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
};

