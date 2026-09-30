/**
 * Thin compatibility layer so page code written against the Next.js router API
 * (Link href, useRouter, usePathname, useParams, useSearchParams) runs on react-router.
 */
import { forwardRef, useMemo, type AnchorHTMLAttributes, type ReactNode } from "react";
import {
  Link as RRLink,
  useLocation,
  useNavigate,
  useParams as useRRParams,
  useSearchParams as useRRSearchParams,
} from "react-router-dom";

type LinkProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string;
  replace?: boolean;
  prefetch?: boolean;
  scroll?: boolean;
  children?: ReactNode;
};

const isExternal = (h: string) => /^(https?:|mailto:|tel:|#)/.test(h);

export const Link = forwardRef<HTMLAnchorElement, LinkProps>(function Link(
  { href, replace, prefetch: _p, scroll: _s, children, ...rest },
  ref,
) {
  if (isExternal(href)) {
    return (
      <a ref={ref} href={href} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <RRLink ref={ref} to={href} replace={replace} {...rest}>
      {children}
    </RRLink>
  );
});

export function useRouter() {
  const navigate = useNavigate();
  return useMemo(
    () => ({
      push: (to: string) => navigate(to),
      replace: (to: string) => navigate(to, { replace: true }),
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => {},
      prefetch: (_to: string) => {},
    }),
    [navigate],
  );
}

export const usePathname = () => useLocation().pathname;

export function useSearchParams() {
  const [sp] = useRRSearchParams();
  return sp;
}

export function useParams<T extends Record<string, string> = Record<string, string>>() {
  return useRRParams() as unknown as T;
}
