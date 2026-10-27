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
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new AppError(
      "Amsyong brader, Midtrans Reject Payment session: ${body}",
      502,
    );
  }
  return (await response.json()) as SnapResponse;
}
