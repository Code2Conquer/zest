import "server-only";
import { claude, hasClaude, MODEL } from "./claude";

// Zest on the website: answers sellers' questions about getting online, in their language. Claude with
// what Zest does written into the prompt; without Claude, short answers matched by keyword.

export type Turn = { role: "user" | "assistant"; text: string };

const FACTS = `Zest gives a food seller their own ordering page and runs delivery, payments and orders around it.
Who it's for: home kitchens, tiffin services, stalls and thelas (the homepage), and restaurants already on Zomato or Swiggy (the /restaurants page).
- Getting started is free. Home chefs send a photo of their menu (Zest reads every dish and price), add FSSAI and GSTIN (read from a photo), set delivery and UPI, and the page is live in minutes, with a link, a QR and WhatsApp sharing. Restaurants paste their Zomato or Swiggy link and the page, menu and photos come from the listing.
- Customers order on the page or on WhatsApp and pay by UPI, straight to the seller's bank. Zest never holds the money.
- Delivery: for each order, a Zomato rider (booked as the food gets ready, tracked live, up to about 7 km), the seller's own helper or staff, or pickup. Delivery is priced by distance; the seller decides whether the customer pays, the seller pays, or it's free above an order amount. There is no fixed delivery price.
- Orders can close at a time the seller sets (e.g. 11 am for lunch) so they cook to the count; weekly or monthly tiffin plans let regulars pay for the week.
- Restaurants keep their Zomato and Swiggy listings exactly as they are; Zest adds the orders that never reach them (calls, WhatsApp, office and party orders, dine-in guests ordering from home, people searching their name). Zest does not talk about commissions or margins.
- The Zest Soundbox is a small box on the counter that speaks every order (from Zomato, Swiggy and the page) in Hindi or English; press the top to accept; with the ticket printer it prints KOTs; if nobody accepts it gets louder, then calls the owner. Sellers can ask for one on the website.
- For restaurants, a WhatsApp summary every morning at 7:30: yesterday's sales by channel, payouts on the way, reviews that need a reply (with one drafted).
- Help is on WhatsApp, in Hindi or English. Start at /join?journey=new (home kitchens) or /join?journey=live (restaurants).`;

const SYSTEM = `You are Zest, the assistant on Zest's website, talking to a home chef, tiffin owner, stall owner or restaurant owner in India who is thinking about selling online.
${FACTS}
How to answer:
- Reply in the language of the user's last message: Hindi (Devanagari), English, or Hinglish in kind.
- Two to four short sentences, plain words, no lists unless asked, no markdown. Warm and practical, like a helpful person at a counter.
- Only state what's above. If you don't know (exact fees, a city's coverage, legal advice), say so and suggest starting free or asking on WhatsApp.
- Never call Zomato and Swiggy "apps"; name them. Never quote a fixed delivery price; it depends on distance.
- When it helps, end with one next step, such as "Tap Get started to set up your page."`;

const FALLBACK: [RegExp, { en: string; hi: string }][] = [
  [/deliver|rider|zomato|डिलीवरी|राइडर/i, { en: "For every order you choose: a Zomato rider picks it up and the customer tracks it live, your own helper takes it, or the customer picks up. Delivery is priced by distance, and you decide who pays.", hi: "हर ऑर्डर पर आप चुनिए: Zomato राइडर उठाता है और ग्राहक लाइव ट्रैक करता है, आपका हेल्पर ले जाता है, या ग्राहक ख़ुद ले जाता है। डिलीवरी का दाम दूरी से तय होता है, और कौन देगा यह आप तय करते हैं।" }],
  [/cost|price|fee|free|charge|ख़र्च|खर्च|पैसा|फ़ीस/i, { en: "Getting started is free. Customers pay you by UPI, straight to your bank. Delivery is priced by distance, and you choose who pays for it.", hi: "शुरुआत मुफ़्त है। ग्राहक UPI से सीधे आपके बैंक में भुगतान करते हैं। डिलीवरी का दाम दूरी से तय होता है, और कौन देगा यह आप चुनते हैं।" }],
  [/pay|upi|money|bank|भुगतान/i, { en: "Customers pay by UPI when they order, straight to your bank account. Zest never holds your money.", hi: "ग्राहक ऑर्डर करते ही UPI से सीधे आपके बैंक खाते में भुगतान करते हैं। Zest आपका पैसा कभी नहीं रखता।" }],
  [/fssai|gst|licen|document|दस्तावेज़/i, { en: "You can add your FSSAI and GSTIN by taking a photo; Zest reads the number. FSSAI is needed to sell and deliver food, home kitchens included.", hi: "FSSAI और GSTIN आप फ़ोटो लेकर जोड़ सकते हैं, नंबर Zest पढ़ लेता है। खाना बेचने और पहुँचाने के लिए FSSAI ज़रूरी है, घर की रसोई के लिए भी।" }],
  [/soundbox|speaker|box|साउंडबॉक्स/i, { en: "The Zest Soundbox sits on your counter and speaks every order in Hindi or English. Press the top to accept; if nobody does, it gets louder, then calls you.", hi: "Zest Soundbox काउंटर पर रहता है और हर ऑर्डर हिंदी या अंग्रेज़ी में बोलता है। ऊपर दबाकर मंज़ूर कीजिए; कोई न दबाए तो आवाज़ तेज़ होती है, फिर आपको फ़ोन।" }],
  [/swiggy|restaurant|listing|रेस्टोरेंट/i, { en: "You stay on Zomato and Swiggy exactly as you are. Paste your listing link and Zest makes your own page for the orders that never reach them: calls, WhatsApp and party orders.", hi: "आप Zomato और Swiggy पर वैसे ही रहते हैं। अपना लिस्टिंग लिंक डालिए, Zest उन ऑर्डर के लिए आपका पेज बनाता है जो वहाँ नहीं पहुँचते: कॉल, WhatsApp और पार्टी ऑर्डर।" }],
  [/menu|start|setup|how|शुरू|मेन्यू|कैसे/i, { en: "Send a photo of your menu and Zest reads every dish and price. Add delivery and your UPI ID, and your page is live in minutes. Tap Get started to try it.", hi: "मेन्यू की फ़ोटो भेजिए, Zest हर डिश और दाम पढ़ लेता है। डिलीवरी और UPI ID जोड़िए, और कुछ ही मिनट में आपका पेज लाइव। आज़माने के लिए शुरू करें दबाइए।" }],
];

const isHindi = (t: string) => /[ऀ-ॿ]/.test(t);

function fallback(text: string): string {
  const hi = isHindi(text);
  const hit = FALLBACK.find(([re]) => re.test(text));
  if (hit) return hi ? hit[1].hi : hit[1].en;
  return hi
    ? "मैं Zest हूँ। आपकी रसोई के लिए ऑनलाइन ऑर्डर, UPI भुगतान और Zomato राइडर से डिलीवरी में मदद करता हूँ। मेन्यू, डिलीवरी, भुगतान या Soundbox के बारे में पूछिए।"
    : "I'm Zest. I help kitchens take online orders, get paid by UPI and deliver with Zomato riders. Ask me about your menu, delivery, payments or the Soundbox.";
}

export async function answer(history: Turn[]): Promise<string> {
  const last = history[history.length - 1]?.text ?? "";
  if (!hasClaude()) return fallback(last);
  try {
    const res = await claude().messages.create({
      model: MODEL,
      max_tokens: 400,
      system: SYSTEM,
      messages: history.slice(-12).map((t) => ({ role: t.role, content: t.text })),
    });
    const text = res.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("").trim();
    return text || fallback(last);
  } catch {
    return fallback(last);
  }
}
