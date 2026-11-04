import Link from "next/link";
import { LayoutGrid, Receipt, Star, Ticket, type LucideIcon } from "lucide-react";
import { CUSTOMER_TABS, customerTabHref, type CustomerTab } from "@/lib/customerTabs";

const TAB_ICONS: Record<CustomerTab, LucideIcon> = {
  overview: LayoutGrid,
  tickets: Ticket,
  transactions: Receipt,
  reviews: Star,
};

// Menu of the customer dashboard. The page tells it which tab is open.
export default function CustomerSidebar({ activeTab }: { activeTab: CustomerTab }) {
  return (
    <aside className="w-full shrink-0 rounded-2xl border border-neutral-100 bg-white p-4 shadow-xs md:w-64">
      <nav className="flex gap-1.5 overflow-x-auto md:flex-col md:overflow-visible">
        {CUSTOMER_TABS.map((tab) => {
          const Icon = TAB_ICONS[tab.value];
          const isActive = tab.value === activeTab;

          return (
            <Link
              key={tab.value}
              href={customerTabHref(tab.value)}
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
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
