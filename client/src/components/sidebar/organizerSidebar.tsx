"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Squares2X2Icon,
  CalendarIcon,
  ReceiptPercentIcon,
  UserGroupIcon,
  TicketIcon,
  StarIcon,
} from "@heroicons/react/24/outline";

export default function OrganizerSidebar() {
  const pathname = usePathname();

  const menuItems = [
    { name: "Overview", href: "/dashboard", icon: Squares2X2Icon },
    { name: "Events", href: "/dashboard/events", icon: CalendarIcon },
    { name: "Transactions", href: "/dashboard/transactions", icon: ReceiptPercentIcon },
    { name: "Attendee list", href: "/dashboard/attendee-list", icon: UserGroupIcon },
    { name: "Voucher", href: "/dashboard/vouchers", icon: TicketIcon },
    { name: "Reviews", href: "/dashboard/reviews", icon: StarIcon },
  ];

  return (
    <aside className="w-full md:w-64 bg-white rounded-2xl p-4 shadow-xs border border-neutral-100 shrink-0">
      <nav className="space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 group ${
                isActive
                  ? "text-[#BB4D00] font-semibold bg-[#FFF5ED] border border-[#BB4D00]/15"
                  : "text-neutral-900 hover:text-[#BB4D00] hover:bg-[#FFF5ED]/60"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors duration-200 ${
                  isActive
                    ? "text-[#BB4D00]"
                    : "text-neutral-900 group-hover:text-[#BB4D00]"
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