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
  icon: Icon,
  dark = false
}: PageHeaderProps) {
  return (
    <section
      className={
        dark
          ? 'border-b border-brand-900/20 bg-brand-950 py-12 text-white lg:py-16'
          : 'border-b border-stone-200/90 bg-ivory-200/70 py-12 text-slate-900 lg:py-16'
      }
    >
      <div className="container-max">
        <div className={dark ? '[&_a]:text-slate-300 [&_span]:text-white [&_svg]:text-slate-400' : ''}>
          <Breadcrumbs items={crumbs} />
        </div>

        <div className="mt-2 max-w-3xl">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider ${
              dark
                ? 'border border-white/15 bg-white/10 text-amberwarm-300'
                : 'border border-stone-300/80 bg-white text-amberwarm-700'
            }`}
          >
            {Icon && <Icon className="h-3.5 w-3.5 shrink-0" />}
            <span>{eyebrow}</span>
          </span>

          <h1
            className={`mt-4 font-heading text-3xl font-extrabold sm:text-4xl lg:text-[46px] lg:leading-[1.18] ${
              dark ? 'text-white' : 'text-brand-950'
            }`}
          >
            {title}
          </h1>

          {subtitle && (
            <p
              className={`mt-4 text-base leading-relaxed sm:text-lg ${
                dark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
