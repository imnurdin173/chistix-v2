import { AppError } from "./AppError";
import { env } from "../config/env";
import { PAYMENT_DEADLINE_MINUTES } from "./constants";

const MIDTRANS_SNAP_URL =
  "https://app.sandbox.midtrans.com/snap/v1/transactions";

interface SnapRequest {
  orderId: string;
  grossAmount: number;
  customerEmail: string;
}

interface SnapResponse {
  token: string;
  redirect_url: string;
}

export async function createSnapTransaction(
  params: SnapRequest,
): Promise<SnapResponse> {
  const basicAuth = Buffer.from(`${env.midtransServerKey}:`).toString("base64");

  const response = await fetch(MIDTRANS_SNAP_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: params.orderId,
        gross_amount: params.grossAmount,
      },
      customer_details: {
        email: params.customerEmail,
      },
      expiry: {
        unit: "minutes",
        duration: PAYMENT_DEADLINE_MINUTES,
      },
      // After paying, Midtrans sends the customer back to our invoice page
      callbacks: {
        finish: `${env.appUrl}/cart/checkout/invoice?id=${params.orderId}`,
      },
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(
      `Amsyong brader, Midtrans Reject Payment session: ${body}`,
      502,
    );
  }
  return (await response.json()) as SnapResponse;
}

const MIDTRANS_API_URL = "https://api.sandbox.midtrans.com/v2";

// Same fields Midtrans sends in the webhook (incl. signature_key)
export interface MidtransStatus {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
}

// Ask Midtrans for the latest status of one order (works on localhost)
export async function getMidtransStatus(orderId: string): Promise<MidtransStatus> {
  const basicAuth = Buffer.from(`${env.midtransServerKey}:`).toString("base64");

  const response = await fetch(`${MIDTRANS_API_URL}/${encodeURIComponent(orderId)}/status`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${basicAuth}`,
    },
  });

  const body = await response.json().catch(() => null);
  if (!body) {
    throw new AppError("Could not reach the payment service", 502);
  }
  return body as MidtransStatus;
}
