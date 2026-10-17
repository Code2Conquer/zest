import { ComingSoon } from "@/components/coming-soon";

export default function Dining() {
  return (
    <ComingSoon
      phase={4}
      title={{ en: "Dining", hi: "डाइनिंग" }}
      body={{
        en: "Tables, reservations, the waitlist and your QR menu, with dine-in sales counted alongside Zomato and Swiggy.",
        hi: "टेबल, रिज़र्वेशन, वेटलिस्ट और QR मेन्यू, और डाइन-इन बिक्री Zomato और Swiggy के साथ एक जगह।",
      }}
    />
  );
}
