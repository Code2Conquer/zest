import QRCode from "qrcode";
import { handler } from "@/lib/server/http";
import { appUrl } from "@/lib/server/oauth-state";

/** The table QR code (SVG) that opens this restaurant's dine-in menu. */
export const GET = handler(async (req, outlet) => {
  const url = `${appUrl(req)}/m/${outlet.id}`;
  const svg = await QRCode.toString(url, { type: "svg", margin: 1, color: { dark: "#17201c", light: "#ffffff" } });
  return { url, svg };
});
