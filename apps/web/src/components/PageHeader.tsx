import type { LucideIcon } from 'lucide-react';
import { Breadcrumbs, type CrumbItem } from './Breadcrumbs';

interface PageHeaderProps {
  crumbs: CrumbItem[];
  eyebrow: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  dark?: boolean;
}

export function PageHeader({
  crumbs,
  eyebrow,
  title,
  subtitle,
  icon: Icon
}: PageHeaderProps) {
  return (
    <section className="border-b border-slate-200 bg-white py-10 text-slate-900 lg:py-14">
      <div className="container-max">
        <Breadcrumbs items={crumbs} />

        <div className="mt-2 max-w-4xl">
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-700">
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span>{eyebrow}</span>
          </span>

          <h1 className="mt-3 font-heading text-3xl font-extrabold text-slate-900 sm:text-4xl lg:text-[42px] lg:leading-[1.18]">
            {title}
          </h1>

          {subtitle && (
            <p className="mt-3 text-base leading-relaxed text-slate-600 sm:text-lg">
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
