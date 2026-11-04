import Link from "next/link";
import { Check, Clock, TimerOff, X, type LucideIcon } from "lucide-react";
import { ApiError } from "@/lib/api";
import { apiFetchServer } from "@/lib/api.server";
import { formatRupiah } from "@/lib/format";
import { formatEventSchedule } from "@/lib/date";
import { POINT_TO_RUPIAH } from "@/lib/constants";
import type { TransactionDetail, TransactionStatus } from "@/types/transaction";
import CancelOrderButton from "@/components/customer/CancelOrderButton";
import PaymentCountdown from "@/components/customer/PaymentCountdown";

export const instant = false;

// Where "View My Tickets" goes (customer dashboard event list). Change here if the team picks another URL.
const MY_TICKETS_URL = "/dashboard-customer/tickets";

type InvoiceQuery = {
    id?: string;
    order_id?: string; // name used by Midtrans when it sends the user back
};

type InvoiceResult =
    | { ok: true; transaction: TransactionDetail; customerName: string }
    | { ok: false; title: string; message: string; needLogin?: boolean };

// One "recipe" per status: icon, colours, and text
const STATUS_VIEW: Record<
    TransactionStatus,
    { title: string; subtitle: string; icon: LucideIcon; iconBg: string; subtitleColor: string }
> = {
    PAID: {
        title: "Payment Successful!",
        subtitle: "Your order is confirmed. See you at the event!",
        icon: Check,
        iconBg: "bg-emerald-500",
        subtitleColor: "text-emerald-600",
    },
    WAITING_PAYMENT: {
        title: "Waiting for Payment",
        subtitle: "Please complete your payment before the deadline below.",
        icon: Clock,
        iconBg: "bg-amber-500",
        subtitleColor: "text-amber-600",
    },
    WAITING_CONFIRM: {
        title: "Waiting for Confirmation",
        subtitle: "Your payment is being confirmed.",
        icon: Clock,
        iconBg: "bg-amber-500",
        subtitleColor: "text-amber-600",
    },
    EXPIRED: {
        title: "Payment Expired",
        subtitle: "The payment deadline has passed and your tickets were released.",
        icon: TimerOff,
        iconBg: "bg-neutral-400",
        subtitleColor: "text-neutral-500",
    },
    CANCELLED: {
        title: "Order Cancelled",
        subtitle: "This order has been cancelled.",
        icon: X,
        iconBg: "bg-red-500",
        subtitleColor: "text-red-600",
    },
};

function formatDateTime(iso: string) {
    return new Date(iso).toLocaleString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
    });
}

async function loadInvoice(query: InvoiceQuery): Promise<InvoiceResult> {
    const id = query.id ?? query.order_id;
    if (!id) {
        return { ok: false, title: "Invoice not found", message: "No transaction was specified." };
    }

    try {
        const [transaction, me] = await Promise.all([
            apiFetchServer<TransactionDetail>(`/transactions/${encodeURIComponent(id)}`),
            apiFetchServer<{ name: string }>("/profile/me"),
        ]);
        return { ok: true, transaction, customerName: me.name };
    } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
            return {
                ok: false,
                title: "Please log in",
                message: "You need to log in to view this invoice.",
                needLogin: true,
            };
        }
        if (error instanceof ApiError && (error.status === 403 || error.status === 404 || error.status === 400)) {
            return { ok: false, title: "Invoice not found", message: "This transaction does not exist or is not yours." };
        }
        return { ok: false, title: "Something went wrong", message: "Failed to load the invoice. Please try again." };
    }
}

function DetailRow({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
    return (
        <div className="flex justify-between gap-6 text-sm">
            <span className="shrink-0 text-neutral-400">{label}</span>
            <span className={`text-right ${strong ? "font-bold text-neutral-900" : "font-semibold text-neutral-800"}`}>
                {value}
            </span>
        </div>
    );
}

type InvoicePageProps = {
    searchParams: Promise<InvoiceQuery>;
};

export default async function InvoicePage({ searchParams }: InvoicePageProps) {
    const query = await searchParams;
    const result = await loadInvoice(query);

    // ----- ERROR STATES -----
    if (!result.ok) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
                <div className="w-full max-w-md space-y-4 rounded-3xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
                    <h1 className="text-xl font-bold text-neutral-900">{result.title}</h1>
                    <p className="text-sm text-neutral-500">{result.message}</p>
                    <Link
                        href={result.needLogin ? "/login" : "/"}
                        className="inline-block rounded-full bg-[#EA580C] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#BB4D00]"
                    >
                        {result.needLogin ? "Log In" : "Back to Home"}
                    </Link>
                </div>
            </main>
        );
    }

    // ----- SUCCESS: show the invoice -----
    const { transaction: t, customerName } = result;
    const view = STATUS_VIEW[t.status];
    const StatusIcon = view.icon;

    // Same formula the backend uses when it bills Midtrans
    const subtotal = t.quantity * t.priceAtPurchase;
    const pointDiscount = t.pointsUsed * POINT_TO_RUPIAH;
    const total = subtotal - t.discountAmount - pointDiscount;

    const isClosed = t.status === "EXPIRED" || t.status === "CANCELLED";
    const primaryHref = isClosed ? `/events/${t.event.slug}` : MY_TICKETS_URL;
    const primaryLabel = isClosed ? "Buy Again" : "View My Tickets";

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
            <div className="w-full max-w-md space-y-4">
                <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm md:p-8">
                    {/* STATUS HEADER */}
                    <div className="flex flex-col items-center text-center">
                        <div className={`flex size-16 items-center justify-center rounded-full ${view.iconBg}`}>
                            <StatusIcon className="size-8 text-white" strokeWidth={3} />
                        </div>
                        <h1 className="mt-4 text-2xl font-bold text-neutral-900">{view.title}</h1>
                        <p className={`mt-1 text-sm ${view.subtitleColor}`}>{view.subtitle}</p>
                    </div>

                    {/* PAYMENT COUNTDOWN: only while waiting for payment */}
                    {t.status === "WAITING_PAYMENT" && (
                        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center">
                            <p className="text-xs text-amber-700">Complete your payment within</p>
                            <p className="mt-1 text-2xl">
                                <PaymentCountdown deadline={t.paymentDeadline} />
                            </p>
                        </div>
                    )}

                    {/* ORDER DETAILS */}
                    <div className="mt-6 space-y-3 border-t border-neutral-100 pt-5">
                        <DetailRow label="Order ID" value={t.id.slice(0, 8).toUpperCase()} />
                        <DetailRow label="Event" value={t.event.title} />
                        <DetailRow label="Customer" value={customerName} />
                        <DetailRow label="Ticket Type" value={`${t.ticketType.name} (${t.quantity}x Ticket)`} />
                        <DetailRow label="Date & Time" value={formatEventSchedule(t.event.eventStartDate, t.event.eventEndDate)} />
                        <DetailRow label="Location" value={`${t.event.venueAddress}, ${t.event.cityName}, ${t.event.provinceName}`} />
                        {t.status === "WAITING_PAYMENT" && (
                            <DetailRow label="Pay Before" value={formatDateTime(t.paymentDeadline)} />
                        )}
                        {t.paidAt && <DetailRow label="Paid At" value={formatDateTime(t.paidAt)} />}
                    </div>

                    {/* PAYMENT BREAKDOWN */}
                    <div className="mt-5 space-y-2 border-t border-neutral-100 pt-5">
                        <DetailRow label="Subtotal" value={formatRupiah(subtotal)} />
                        {t.discountAmount > 0 && (
                            <DetailRow
                                label={`Voucher${t.voucher ? ` (${t.voucher.code})` : ""}`}
                                value={`−${formatRupiah(t.discountAmount)}`}
                            />
                        )}
                        {pointDiscount > 0 && (
                            <DetailRow
                                label={`Points (${t.pointsUsed.toLocaleString("id-ID")})`}
                                value={`−${formatRupiah(pointDiscount)}`}
                            />
                        )}
                        <div className="flex items-center justify-between pt-2">
                            <span className="text-sm text-neutral-400">Total Amount</span>
                            <span className={`text-lg font-bold ${t.status === "PAID" ? "text-emerald-600" : "text-neutral-900"}`}>
                                {formatRupiah(total)}
                            </span>
                        </div>
                    </div>
                </section>

                {/* ACTIONS */}
                <Link
                    href={primaryHref}
                    className="block w-full rounded-full bg-[#EA580C] py-3 text-center text-sm font-bold text-white hover:bg-[#BB4D00]"
                >
                    {primaryLabel}
                </Link>
                {t.status === "WAITING_PAYMENT" && (
                    <div className="text-center">
                        <CancelOrderButton transactionId={t.id} eventTitle={t.event.title} />
                    </div>
                )}
                <Link
                    href="/"
                    className="block w-full rounded-full bg-slate-200 py-3 text-center text-sm font-bold text-neutral-700 hover:bg-slate-300"
                >
                    Back to Home
                </Link>
            </div>
        </main>
    );
}