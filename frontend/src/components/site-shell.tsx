import Image from 'next/image';
import Link from 'next/link';
import { navigation } from '@/constants/navigation';

export function SiteHeader() {
  return (
    <header className="border-b border-line bg-paper">
      <div className="wrap flex flex-wrap items-center justify-between gap-x-5 gap-y-3 py-4">
        <Link className="flex items-center gap-2 font-bold tracking-tight" href="/">
          <Image src="/bav-mark.svg" width={34} height={34} alt="" />
          BAV-Connect
        </Link>
        <nav
          aria-label="Điều hướng chính"
          className="order-last flex w-full flex-wrap gap-x-5 gap-y-2 text-sm sm:order-none sm:w-auto"
        >
          {navigation.map(({ href, title }) => (
            <Link key={href} href={href} className="hover:text-brand">
              {title}
            </Link>
          ))}
        </nav>
        <Link className="button" href="/create-post">
          Đăng tin
        </Link>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper">
      <div className="wrap flex flex-wrap justify-between gap-2 py-6 text-sm text-muted">
        <span>BAV-Connect · Dự án của ICU Code</span>
        <span>Cộng đồng sinh viên Học viện Ngân hàng</span>
      </div>
    </footer>
  );
}
