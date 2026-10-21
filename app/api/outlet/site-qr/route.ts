import QRCode from "qrcode";
import { handler } from "@/lib/server/http";
import { appUrl } from "@/lib/server/oauth-state";

/** The ordering site's address and a QR code for it, to print for the counter, bills and bags. */
export const GET = handler(async (req, outlet) => {
  const url = `${appUrl(req)}/r/${outlet.slug}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#17201c", light: "#ffffff" } });
  return { url, svg };
});
