// The QR canvas on the e-ticket page has this id,
// so the PDF button can copy the same QR image into the PDF.
export function ticketQrCanvasId(ticketId: string): string {
  return `ticket-qr-${ticketId}`;
}
