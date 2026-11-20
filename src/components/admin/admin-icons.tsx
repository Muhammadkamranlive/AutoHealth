import type { ComponentType, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

export function IconDashboard({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

export function IconPatients({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
    </svg>
  );
}

export function IconQueue({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round" />
      <path d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" strokeLinecap="round" />
      <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconInbox({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M4 4h16v12H4z" strokeLinejoin="round" />
      <path d="M4 13l4 4h8l4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconShield({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M12 3l8 4v5c0 5-3.5 9-8 9s-8-4-8-9V7l8-4z" strokeLinejoin="round" />
      <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevron({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconMenu({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
  );
}

export function IconLogout({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" strokeLinecap="round" />
      <path d="M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconUsers({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconForms({ className, ...props }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} {...props}>
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" />
      <path d="M14 2v6h6M8 13h8M8 17h8M8 9h2" strokeLinecap="round" />
    </svg>
  );
}

export const ADMIN_NAV_ICONS: Record<string, ComponentType<IconProps>> = {
  dashboard: IconDashboard,
  patients: IconPatients,
  orders: IconQueue,
  inbox: IconInbox,
  access: IconShield,
  users: IconUsers,
  roles: IconShield,
  forms: IconForms,
};
