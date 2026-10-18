import { useEffect } from "react";
import { company } from "@/data/site";

const DEFAULT_TITLE = `${company.name} | Industrial products and supply, Chennai`;

// Sets the tab title and meta description for the current page; restores the defaults on leave.
export function usePageMeta(title: string | null, description?: string) {
  useEffect(() => {
    if (title === null) return;
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    const previousDescription = meta?.content;
    document.title = title ? `${title} | ${company.name}` : DEFAULT_TITLE;
    if (meta && description) meta.content = description;
    return () => {
      document.title = DEFAULT_TITLE;
      if (meta && previousDescription) meta.content = previousDescription;
    };
  }, [title, description]);
}
