import { Fragment } from "react";
import { Link } from "react-router";
import { cn } from "@/lib/utils";

type Crumb = { label: string; to?: string };

function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={cn("type-small", className)}>
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, i) => (
          <Fragment key={item.label}>
            {i > 0 && (
              <li aria-hidden className="opacity-50">
                /
              </li>
            )}
            <li>
              {item.to ? (
                <Link to={item.to} className="link-rule">
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-semibold">
                  {item.label}
                </span>
              )}
            </li>
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
