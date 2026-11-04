import type { Metadata } from "next";
import CustomerSidebar from "@/components/sidebar/customerSidebar";
import OverviewTab from "@/components/dashboard/customer/OverviewTab";
import TicketsTab from "@/components/dashboard/customer/TicketsTab";
import TransactionsTab from "@/components/dashboard/customer/TransactionsTab";
import ReviewsTab from "@/components/dashboard/customer/ReviewsTab";
import { requireCustomer } from "@/lib/auth.server";
import { CUSTOMER_TABS, toCustomerTab } from "@/lib/customerTabs";

export const instant = false;

// Everything the dashboard reads from the URL
type CustomerQuery = {
  tab?: string; // overview | tickets | transactions | reviews
  status?: string; // Transactions filter
  page?: string; // Transactions page number
  view?: string; // Reviews: "mine" = My Review
  reviewed?: string; // Reviews: "1" right after posting a review
};

type CustomerPageProps = {
  searchParams: Promise<CustomerQuery>;
};

// Browser tab title follows the open tab
export async function generateMetadata({ searchParams }: CustomerPageProps): Promise<Metadata> {
  const tab = toCustomerTab((await searchParams).tab);
  return { title: CUSTOMER_TABS.find((t) => t.value === tab)?.label ?? "Overview" };
}

// Customer dashboard: one page, the sidebar picks the tab
export default async function CustomerPage({ searchParams }: CustomerPageProps) {
  const user = await requireCustomer(); // customers only (401 / 403 otherwise)
  const query = await searchParams;
  const activeTab = toCustomerTab(query.tab);

  return (
    <div className="flex min-h-screen flex-col bg-[#faf8f4] font-sans text-neutral-800">
      <div className="w-full flex-1 p-4 md:p-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start gap-6 md:flex-row">
          <CustomerSidebar activeTab={activeTab} />

          <div className="w-full min-w-0 flex-1">
            {activeTab === "overview" && <OverviewTab user={user} />}
            {activeTab === "tickets" && <TicketsTab />}
            {activeTab === "transactions" && <TransactionsTab status={query.status} page={query.page} />}
            {activeTab === "reviews" && <ReviewsTab user={user} view={query.view} reviewed={query.reviewed} />}
          </div>
        </div>
      </div>
    </div>
  );
}
