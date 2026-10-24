import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Privacy · Zest" };

export default function Privacy() {
  return (
    <LegalPage title="Privacy" updated="25 October 2026">
      <p>Zest gives home kitchens, tiffin services, stalls and restaurants their own ordering page and the tools to run it. This page says what we collect, why, and what you can ask us to do with it.</p>
      <h2>Sellers</h2>
      <ul>
        <li>Your mobile number, to log you in with a one-time code, and your name.</li>
        <li>Your kitchen&apos;s details: name, address, location, menu, photos, opening hours, FSSAI, GSTIN, PAN and UPI ID, to run your page and pay you.</li>
        <li>If you connect an email inbox, the order, payout and review emails from Zomato and Swiggy in it, to build your summaries. We read only those, and you can disconnect at any time.</li>
      </ul>
      <h2>Customers ordering from a seller&apos;s page</h2>
      <ul>
        <li>Your name, mobile number, delivery address and, if you share it, your location, to deliver the order and price delivery by distance.</li>
        <li>Your number is used to send order updates and the tracking link on WhatsApp or by SMS. The seller sees your name, number and address so they can cook and deliver.</li>
        <li>Payments go through our payment partner; we never see or keep your card or UPI PIN.</li>
        <li>When a Zomato rider delivers your order, your address and number are shared with them for that delivery.</li>
      </ul>
      <h2>What we don&apos;t do</h2>
      <ul>
        <li>We don&apos;t sell your data or share it for advertising.</li>
        <li>We send marketing messages only to people who have agreed to receive them, and every such message says how to stop them.</li>
      </ul>
      <h2>Keeping and deleting</h2>
      <p>We keep order records as long as the law requires for tax and accounting. You can ask us to correct your details or delete your account; we&apos;ll do it unless the law says we must keep a record.</p>
    </LegalPage>
  );
}
