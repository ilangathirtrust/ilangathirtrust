'use client';

import { useEffect, useRef, useState } from 'react';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  wrapperClassName?: string;
}

export function LazyImage({
  wrapperClassName = '',
  className = '',
  alt = '',
  loading = 'lazy',
  decoding = 'async',
  onLoad,
  onError,
  ...props
}: LazyImageProps) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    if (img.complete) {
      setLoaded(true);
      return;
    }

    // Catch cached or fast-decoding images even if load fired right around hydration
    const poll = window.setInterval(() => {
      if (img.complete && img.naturalWidth > 0) {
        setLoaded(true);
        window.clearInterval(poll);
      }
    }, 180);

    const safety = window.setTimeout(() => {
      window.clearInterval(poll);
      if (loading === 'eager') {
        setLoaded(true);
      }
    }, 2200);

    return () => {
      window.clearInterval(poll);
      window.clearTimeout(safety);
    };
  }, [props.src, loading]);

  return (
    <div className={`relative overflow-hidden bg-sand-100 ${wrapperClassName}`}>
      {!loaded && (
        <div
          aria-hidden="true"
          className="skeleton-box absolute inset-0 rounded-none"
        />
      )}
      <img
        ref={imgRef}
        {...props}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={(e) => {
          setLoaded(true);
          onError?.(e);
        }}
        className={`transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      />
    </div>
  );
}

export function LazyReveal({
  children,
  className = '',
  delayMs = 0
}: {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window !== 'undefined' &&
      (window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !('IntersectionObserver' in window) ||
        el.getBoundingClientRect().top <= window.innerHeight + 160)
    ) {
      setShown(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true);
            observer.disconnect();
            break;
          }
        }
      },
      { rootMargin: '180px 0px', threshold: 0.01 }
    );

    observer.observe(el);

    // Guarantee mobile views never get stranded in an invisible reveal state
    const safety = window.setTimeout(() => {
      setShown(true);
      observer.disconnect();
    }, 900);

    return () => {
      observer.disconnect();
      window.clearTimeout(safety);
    };
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delayMs}ms` }}
      className={`transition-all duration-500 ease-out ${
        shown ? 'translate-y-0 opacity-100' : 'translate-y-3 opacity-0'
      } ${className}`}
    >
      {children}
    </div>
  );
}
