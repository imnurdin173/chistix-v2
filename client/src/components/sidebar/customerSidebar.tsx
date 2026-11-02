"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
// import { KeyRound, LayoutGrid, Receipt, Ticket, UserRound } from "lucide-react";
import { KeyRound, LayoutGrid, Receipt, Star, Ticket, UserRound } from "lucide-react";

const MENU_ITEMS = [
  { name: "Overview", href: "/dashboard/overview", icon: LayoutGrid },
  { name: "My Tickets", href: "/dashboard/tickets", icon: Ticket },
  { name: "Transactions", href: "/dashboard/transactions", icon: Receipt },
  { name: "Reviews", href: "/dashboard/reviews/create-review", icon: Star },         
//   { name: "Profile", href: "/profile", icon: UserRound },
//   { name: "Change Password", href: "/change-password", icon: KeyRound },
];

export default function CustomerSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full shrink-0 rounded-2xl border border-neutral-100 bg-white p-4 shadow-xs md:w-64">
      <nav className="flex gap-1.5 overflow-x-auto md:flex-col md:overflow-visible">
        {MENU_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={`group flex shrink-0 items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "border border-[#BB4D00]/15 bg-[#FFF5ED] font-semibold text-[#BB4D00]"
                  : "text-neutral-900 hover:bg-[#FFF5ED]/60 hover:text-[#BB4D00]"
              }`}
            >
              <Icon
                className={`size-5 transition-colors duration-200 ${
                  isActive ? "text-[#BB4D00]" : "text-neutral-900 group-hover:text-[#BB4D00]"
                }`}
              />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}