import type { LucideIcon } from 'lucide-react';
import { Breadcrumbs, type CrumbItem } from './Breadcrumbs';

interface PageHeaderProps {
  crumbs: CrumbItem[];
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}

export function PageHeader({
  crumbs,
  eyebrow,
  title,
  subtitle,
  icon: Icon
}: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-sand-200 bg-gradient-to-b from-sand-100 via-sand-50 to-sand-50 py-9 text-slate-900 sm:py-12 lg:py-14">
      <div className="container-max relative z-10">
        <Breadcrumbs items={crumbs} />

        <div className="mt-2 max-w-4xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-saffron-200 bg-saffron-50 px-3 py-1 text-[11px] font-bold tracking-wider text-saffron-700">
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span>{eyebrow}</span>
          </span>

          <h1 className="mt-3.5 font-heading text-2xl font-extrabold leading-tight text-brand-900 min-[360px]:text-3xl sm:text-4xl lg:text-[42px] lg:leading-[1.18]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-600 min-[360px]:text-base sm:text-lg">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
