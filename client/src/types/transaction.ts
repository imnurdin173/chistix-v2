export type TransactionStatus = "WAITING_PAYMENT" | "WAITING_CONFIRM" | "PAID" | "CANCELLED" | "EXPIRED";

// One e-ticket (one person) inside a paid transaction
export interface TransactionTicket {
  id: string;
  ticketCode: string;     // e.g. "CHX-D791A0A8"
  isAttended: boolean;    // true after it is scanned at the entrance
  attendedAt: string | null; // NEW: when the ticket was scanned at the entrance
  qrToken: string;        // random code inside the QR, matched against the database when scanned
}

// Shape of one transaction from GET /api/transactions and /api/transactions/:id (fields we use)
export interface TransactionDetail {
  id: string;
  status: TransactionStatus;
  quantity: number;
  priceAtPurchase: number;
  discountAmount: number;
  pointsUsed: number;
  paymentDeadline: string;
  paidAt: string | null;
  createdAt: string;
  event: {
    id: string;
    title: string;
    slug: string;
    thumbnailImage: string | null;
    eventStartDate: string;
    eventEndDate: string;
    venueAddress: string;
    cityName: string;
    provinceName: string;
  };
  ticketType: {
    id: string;
    name: string;
  };
  voucher: { code: string } | null;
  tickets?: TransactionTicket[]; // NEW
}

// Shape of GET /api/transactions (list)
export interface TransactionListResponse {
  transactions: TransactionDetail[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}