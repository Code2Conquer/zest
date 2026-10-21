// Every selling platform is one interchangeable connector. Modules and agents
// read the unified data model and never branch on how a platform was connected.

export type Platform = "zomato" | "swiggy";
/** Where an order came from. `web`, `whatsapp` and `phone` are the restaurant's own (direct) channels. */
export type Channel = Platform | "ondc" | "web" | "whatsapp" | "phone" | "dine";
export const CHANNELS: readonly Channel[] = ["zomato", "swiggy", "ondc", "web", "whatsapp", "phone", "dine"];
export const DIRECT_CHANNELS = ["web", "whatsapp", "phone"] as const;
export const isDirect = (c: Channel) => (DIRECT_CHANNELS as readonly Channel[]).includes(c);
export type ConnectMethod = "api" | "mcp" | "portal";

export const PLATFORMS: Platform[] = ["zomato", "swiggy"];

export const CHANNEL_NAME: Record<Channel, string> = {
  zomato: "Zomato",
  swiggy: "Swiggy",
  ondc: "ONDC",
  web: "Website",
  whatsapp: "WhatsApp",
  phone: "Phone",
  dine: "Dine-in",
};

export const CHANNEL_COLOR: Record<Channel, string> = {
  zomato: "var(--ch-zomato)",
  swiggy: "var(--ch-swiggy)",
  ondc: "var(--ch-ondc)",
  // The three direct channels share one colour: they are the restaurant's own business.
  web: "var(--ch-direct)",
  whatsapp: "var(--ch-direct)",
  phone: "var(--ch-direct)",
  dine: "var(--ch-dine)",
};

export type MethodField = {
  key: string;
  label: { en: string; hi: string };
  type: "text" | "password" | "url" | "tel";
  placeholder: string;
};

export type MethodSpec = {
  id: ConnectMethod;
  name: { en: string; hi: string };
  summary: { en: string; hi: string };
  liveData: { en: string; hi: string };
  fields: MethodField[];
};

export const METHODS: MethodSpec[] = [
  {
    id: "portal",
    name: { en: "Partner app sign-in", hi: "पार्टनर ऐप साइन-इन" },
    summary: {
      en: "Use the phone number you log in to the partner app with. We'll ask for the OTP when it arrives.",
      hi: "जिस फ़ोन नंबर से आप पार्टनर ऐप में लॉग-इन करते हैं, वही डालें। OTP आने पर हम आपसे पूछेंगे।",
    },
    liveData: { en: "Syncs every 5 minutes", hi: "हर 5 मिनट में सिंक" },
    fields: [
      {
        key: "phone",
        label: { en: "Registered phone number", hi: "रजिस्टर्ड फ़ोन नंबर" },
        type: "tel",
        placeholder: "98xxxxxx21",
      },
    ],
  },
  {
    id: "api",
    name: { en: "Partner API", hi: "पार्टनर API" },
    summary: {
      en: "If the platform gave you API access, sign in with it for instant order updates.",
      hi: "अगर प्लेटफ़ॉर्म ने आपको API एक्सेस दिया है, तो तुरंत ऑर्डर अपडेट के लिए उससे जोड़ें।",
    },
    liveData: { en: "Instant updates", hi: "तुरंत अपडेट" },
    fields: [
      { key: "clientId", label: { en: "Client ID", hi: "क्लाइंट ID" }, type: "text", placeholder: "zp_live_…" },
      { key: "secret", label: { en: "API key", hi: "API की" }, type: "password", placeholder: "••••••••" },
    ],
  },
  {
    id: "mcp",
    name: { en: "MCP server", hi: "MCP सर्वर" },
    summary: {
      en: "Paste the MCP server address from the platform or your POS provider. Its tools become available to your agents.",
      hi: "प्लेटफ़ॉर्म या POS प्रोवाइडर का MCP सर्वर पता डालें। उसके टूल आपके एजेंट इस्तेमाल कर पाएँगे।",
    },
    liveData: { en: "Depends on the server", hi: "सर्वर पर निर्भर" },
    fields: [
      { key: "url", label: { en: "Server address", hi: "सर्वर पता" }, type: "url", placeholder: "https://…/mcp" },
      { key: "token", label: { en: "Access token", hi: "एक्सेस टोकन" }, type: "password", placeholder: "••••••••" },
    ],
  },
];

export type SalesSegment = { key: Channel | "direct"; name: string; color: string; amount: number; orders: number };

/**
 * Sales grouped for display: the channels asked for, then one "Direct" segment
 * for website, WhatsApp and phone orders when there were any.
 */
export function salesSegments(sales: Record<Channel, { amount: number; orders: number }>, channels: Channel[]): SalesSegment[] {
  const segs: SalesSegment[] = channels.filter((c) => !isDirect(c)).map((c) => ({ key: c, name: CHANNEL_NAME[c], color: CHANNEL_COLOR[c], ...sales[c] }));
  const direct = DIRECT_CHANNELS.reduce((s, c) => ({ amount: s.amount + sales[c].amount, orders: s.orders + sales[c].orders }), { amount: 0, orders: 0 });
  if (direct.amount > 0) segs.push({ key: "direct", name: "Direct", color: "var(--ch-direct)", ...direct });
  return segs;
}
