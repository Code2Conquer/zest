import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = { title: "Terms · Zest" };

export default function Terms() {
  return (
    <LegalPage title="Terms" updated="25 October 2026">
      <p>These terms cover using Zest as a seller, and ordering from a seller&apos;s page as a customer.</p>
      <h2>For sellers</h2>
      <ul>
        <li>You are responsible for your food: its quality, its safety, your prices and the licences your business needs (such as FSSAI registration).</li>
        <li>Starting on Zest is free. Delivery by Zomato riders is charged per trip by distance, shown before the order is placed, paid by the customer or by you as you choose.</li>
        <li>Money customers pay online reaches your bank account through our payment partner, after its standard settlement time.</li>
        <li>Keep your login to yourself. You can add managers and kitchen staff, and you are responsible for what they do in your dashboard.</li>
      </ul>
      <h2>For customers</h2>
      <ul>
        <li>Your order is with the seller, who cooks it and is responsible for it. Zest runs the page and passes your order on.</li>
        <li>If the seller can&apos;t take a paid order, it&apos;s refunded in full to the way you paid.</li>
        <li>For a problem with an order, reach the seller first; if it isn&apos;t sorted, contact us.</li>
      </ul>
      <h2>Changes</h2>
      <p>We may update these terms as the product grows. When we make a change that matters, we&apos;ll tell sellers in their dashboard before it takes effect.</p>
    </LegalPage>
  );
}
