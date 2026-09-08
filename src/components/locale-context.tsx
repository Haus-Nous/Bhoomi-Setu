"use client";
import { createContext, useContext, useEffect, useSyncExternalStore, type ReactNode } from "react";
import { copy, type Locale } from "@/lib/i18n";
const LocaleContext = createContext<{ locale: Locale; setLocale: (locale: Locale) => void } | null>(null);
export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "bhoomi-check-locale";
export function readPersistedLocale(value: string | null): Locale | null { return value === "hi" || value === "en" ? value : null; }
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());
const getServerLocale = () => DEFAULT_LOCALE;
const getBrowserLocale = () => readPersistedLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY)) ?? DEFAULT_LOCALE;
const subscribe = (listener: () => void) => { listeners.add(listener); const storageListener = (event: StorageEvent) => { if (event.key === LOCALE_STORAGE_KEY) listener(); }; window.addEventListener("storage", storageListener); return () => { listeners.delete(listener); window.removeEventListener("storage", storageListener); }; };
export function LocaleProvider({ children }: { children: ReactNode }) { const locale = useSyncExternalStore(subscribe, getBrowserLocale, getServerLocale); const setLocale = (next: Locale) => { window.localStorage.setItem(LOCALE_STORAGE_KEY, next); notify(); }; useEffect(() => { document.documentElement.lang = locale; }, [locale]); return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>; }
export function useLocale() { const context = useContext(LocaleContext); if (!context) throw new Error("useLocale must be used inside LocaleProvider"); return context; }
export function useTranslation() { const { locale } = useLocale(); return copy[locale]; }
