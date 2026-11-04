// The 4 tabs of the customer dashboard (/dashboard-customer?tab=...)
export const CUSTOMER_TABS = [
  { value: "overview", label: "Overview" },
  { value: "tickets", label: "My Tickets" },
  { value: "transactions", label: "Transactions" },
  { value: "reviews", label: "Reviews" },
] as const;

export type CustomerTab = (typeof CUSTOMER_TABS)[number]["value"];

// Never trust the URL: unknown values fall back to Overview
export function toCustomerTab(value?: string): CustomerTab {
  return CUSTOMER_TABS.some((tab) => tab.value === value) ? (value as CustomerTab) : "overview";
}

// Link to a tab, e.g. customerTabHref("tickets") → "/dashboard-customer?tab=tickets"
export function customerTabHref(tab: CustomerTab) {
  return tab === "overview" ? "/dashboard-customer" : `/dashboard-customer?tab=${tab}`;
}
