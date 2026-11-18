import { useCallback, useEffect, useState } from "react";
import { AdminApiError } from "@/admin/api";
import type { Notice } from "@/admin/components/FormShell";

// Form values plus "has it changed since it was loaded or saved", field errors and a notice.
export function useFormState<T>(initial: T | null, onDirtyChange: (dirty: boolean) => void) {
  const [values, setValues] = useState<T | null>(initial);
  const [baseline, setBaseline] = useState(() => JSON.stringify(initial));
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const dirty = values !== null && JSON.stringify(values) !== baseline;
  useEffect(() => onDirtyChange(dirty), [dirty, onDirtyChange]);

  const load = useCallback((next: T) => {
    setValues(next);
    setBaseline(JSON.stringify(next));
    setErrors({});
  }, []);

  const set = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => {
      if (!current[key as string]) return current;
      const rest = { ...current };
      delete rest[key as string];
      return rest;
    });
  }, []);

  // Runs a save; maps a field error from the API next to its field.
  const run = useCallback(async (action: () => Promise<string>) => {
    setSaving(true);
    setNotice(null);
    setErrors({});
    try {
      setNotice({ tone: "success", text: await action() });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Something went wrong";
      if (error instanceof AdminApiError && error.field) setErrors({ [error.field.split(".")[0]]: message });
      setNotice({ tone: "error", text: message });
    } finally {
      setSaving(false);
    }
  }, []);

  return { values, set, load, dirty, saving, notice, setNotice, errors, run };
}
