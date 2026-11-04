"use client";

import { QRCodeCanvas } from "qrcode.react";
import { ticketQrCanvasId } from "@/lib/ticketQr";

type TicketQrCodeProps = {
  ticketId: string;
  value: string; // the ticket's qrToken, matched against the database when scanned
};

// Draws the QR code of one ticket
export default function TicketQrCode({ ticketId, value }: TicketQrCodeProps) {
  return (
    <QRCodeCanvas
      id={ticketQrCanvasId(ticketId)}
      value={value}
      size={160}
      level="M"
      marginSize={2}
      title="Ticket QR code"
      className="rounded-xl border border-slate-200"
    />
  );
}
