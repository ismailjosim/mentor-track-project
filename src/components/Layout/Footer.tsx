import { BrandLogo } from '@/components/BrandLogo';
import { APP_NAME } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border/70 bg-card/40">
      <div className="flex w-full flex-col items-center justify-between gap-4 px-4 py-6 text-center sm:flex-row sm:text-left sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <BrandLogo compact imageClassName="size-10 object-contain" />
          <div>
            <p className="text-sm font-semibold">{APP_NAME}</p>
            <p className="text-xs text-muted-foreground">Student success operations</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. Built for focused mentorship.
        </p>
      </div>
    </footer>
  );
}
