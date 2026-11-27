import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export interface CrumbItem {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items }: { items: CrumbItem[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1.5 text-xs font-medium text-slate-500">
      <Link href="/" className="inline-flex items-center gap-1 transition hover:text-brand-600">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {items.map((item, idx) => (
        <span key={idx} className="inline-flex items-center gap-1.5">
          <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          {item.href ? (
            <Link href={item.href} className="transition hover:text-brand-600">
              {item.label}
            </Link>
          ) : (
            <span className="font-semibold text-slate-800">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
