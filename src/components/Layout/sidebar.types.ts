import type { ComponentType } from 'react';
import { LayoutDashboard, Users, RefreshCw, FileBarChart } from 'lucide-react';
import { PAGE_ROUTES } from '@/lib/constants';

export interface NavLinkItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
}

export const NAV_LINKS: NavLinkItem[] = [
  { label: 'Dashboard', href: PAGE_ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: 'Students', href: PAGE_ROUTES.STUDENTS, icon: Users },
  { label: 'Bulk Update', href: PAGE_ROUTES.BULK_UPDATE, icon: RefreshCw },
  { label: 'Reports', href: PAGE_ROUTES.REPORTS, icon: FileBarChart },
];

export interface SidebarProps {
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}
