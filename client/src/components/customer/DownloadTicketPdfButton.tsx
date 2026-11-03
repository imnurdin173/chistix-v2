"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { ticketQrCanvasId } from "@/lib/ticketQr";

// One ticket inside the PDF
export type PdfTicket = {
  id: string;
  ticketCode: string;
  isAttended: boolean;
};

type DownloadTicketPdfButtonProps = {
  eventTitle: string;
  customerName: string;
  ticketTypeName: string;
  schedule: string;
  location: string;
  total: string;
  orderId: string;
  tickets: PdfTicket[];
};

// Same colours as the e-ticket card on screen
const BLACK: [number, number, number] = [0, 0, 0];
const SLATE_500: [number, number, number] = [100, 116, 139]; // labels
const SLATE_400: [number, number, number] = [148, 163, 184]; // small notes
const SLATE_300: [number, number, number] = [203, 213, 225]; // divider, QR box
const SLATE_800: [number, number, number] = [30, 41, 59]; // card border
const RED_600: [number, number, number] = [220, 38, 38];

export default function DownloadTicketPdfButton({
  eventTitle,
  customerName,
  ticketTypeName,
  schedule,
  location,
  total,
  orderId,
  tickets,
}: DownloadTicketPdfButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");

  async function handleDownload() {
    setIsGenerating(true);
    setError("");

    try {
      // Load jsPDF only when the button is clicked (keeps the page light)
      const { jsPDF } = await import("jspdf");

      // A5 portrait: 148 x 210 mm, one page per ticket
      const doc = new jsPDF({ unit: "mm", format: "a5" });
      const pageWidth = doc.internal.pageSize.getWidth();

      // The card: same look as the e-ticket on screen
      const cardX = 14;
      const cardY = 14;
      const cardWidth = pageWidth - cardX * 2;
      const left = cardX + 10; // inner padding
      const right = cardX + cardWidth - 10;
      const innerWidth = right - left;
      const center = pageWidth / 2;
      const labelWidth = 32;

      // One row: grey label on the left, bold value on the right (wraps if long)
      function drawRow(label: string, value: string, y: number, mono = false) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...SLATE_500);
        doc.text(label, left, y);

        doc.setFont(mono ? "courier" : "helvetica", "bold");
        doc.setTextColor(...BLACK);
        const lines: string[] = doc.splitTextToSize(value, innerWidth - labelWidth);
        doc.text(lines, right, y, { align: "right" });
        return y + lines.length * 5 + 4; // next row position
      }

      tickets.forEach((ticket, index) => {
        if (index > 0) doc.addPage();

        // ----- HEADER -----
        doc.setFont("helvetica", "bold");
        doc.setFontSize(20);
        doc.setTextColor(...BLACK);
        doc.text("E-TICKET", center, cardY + 18, { align: "center" });

        doc.setFontSize(11);
        doc.text("The bill has been paid", center, cardY + 27, { align: "center" });

        doc.setFont("helvetica", ticket.isAttended ? "bold" : "normal");
        doc.setFontSize(8.5);
        doc.setTextColor(...(ticket.isAttended ? RED_600 : SLATE_500));
        doc.text(
          ticket.isAttended ? "This ticket has already been used." : "Valid ticket. Guest may enter.",
          center,
          cardY + 33,
          { align: "center" },
        );

        // ----- DETAILS -----
        let y = cardY + 46;
        y = drawRow("Event", eventTitle, y);
        y = drawRow("Customer", customerName, y);
        y = drawRow("Ticket Type", ticketTypeName, y);
        y = drawRow("Date & Time", schedule, y);
        y = drawRow("Location", location, y);

        // divider
        doc.setDrawColor(...SLATE_300);
        doc.setLineWidth(0.3);
        doc.line(left, y - 1, right, y - 1);
        y += 5;

        y = drawRow("Total Amount", total, y);
        y = drawRow("Ticket ID", ticket.ticketCode, y, true);

        // ----- QR -----
        const qrSize = 40;
        const qrX = center - qrSize / 2;
        const qrY = y + 2;
        // Copy the QR that is already drawn on the page (same canvas, same qrToken)
        const qrCanvas = document.getElementById(ticketQrCanvasId(ticket.id)) as HTMLCanvasElement | null;
        if (qrCanvas) {
          doc.addImage(qrCanvas.toDataURL("image/png"), "PNG", qrX, qrY, qrSize, qrSize);
        } else {
          doc.setDrawColor(...SLATE_300);
          doc.setLineDashPattern([1.5, 1.5], 0);
          doc.roundedRect(qrX, qrY, qrSize, qrSize, 3, 3, "S");
          doc.setLineDashPattern([], 0);

          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...SLATE_400);
          doc.text(["QR code not available", "yet"], center, qrY + qrSize / 2 - 1, { align: "center" });
        }

        doc.setFontSize(8);
        doc.setTextColor(...SLATE_500);
        doc.text("Show this QR code at the event entrance", center, qrY + qrSize + 7, { align: "center" });
        doc.setTextColor(...SLATE_400);
        doc.text(`Ticket ${index + 1} of ${tickets.length}`, center, qrY + qrSize + 12, { align: "center" });

        // ----- CARD BORDER (drawn last so it fits the content height) -----
        const cardHeight = qrY + qrSize + 20 - cardY;
        doc.setDrawColor(...SLATE_800);
        doc.setLineWidth(0.6);
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 5, 5, "S");
      });

      // Starts the download in the browser
      doc.save(`E-Ticket-${orderId}.pdf`);
    } catch {
      setError("Failed to create the PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDownload}
        disabled={isGenerating}
        className="flex items-center gap-2 rounded-full bg-[#EA580C] px-4 py-2 text-sm font-bold text-white hover:bg-[#BB4D00] disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Download className="size-4" />
        {isGenerating ? "Preparing PDF..." : "Download PDF"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
