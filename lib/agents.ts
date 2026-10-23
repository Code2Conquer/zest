// Names of the specialist agents, for labelling their work in the UI.
// The agents themselves run on the server (lib/server/copilot.ts).

import type { Bi } from "./i18n";
import type { CopilotReply } from "./types";

export type AgentId = CopilotReply["agent"];

export const AGENT_NAME: Record<AgentId, Bi> = {
  orchestrator: { en: "Zest", hi: "Zest" },
  finance: { en: "Money agent", hi: "पैसे वाला एजेंट" },
  reviews: { en: "Reviews agent", hi: "रिव्यू एजेंट" },
  menu: { en: "Menu agent", hi: "मेन्यू एजेंट" },
  orders: { en: "Orders agent", hi: "ऑर्डर एजेंट" },
  growth: { en: "Growth agent", hi: "ग्रोथ एजेंट" },
  onboarding: { en: "Onboarding agent", hi: "ऑनबोर्डिंग एजेंट" },
};

export const agentName = (id: string): Bi => AGENT_NAME[id as AgentId] ?? AGENT_NAME.orchestrator;

/** For a home kitchen, tiffin or stall: their own page, menu and regulars; nothing about Zomato or Swiggy. */
export const HOME_STARTER_SUGGESTIONS: Bi[] = [
  { en: "How did we do yesterday?", hi: "कल का दिन कैसा रहा?" },
  { en: "Rajma is finished, turn it off", hi: "राजमा ख़त्म है, बंद करो" },
  { en: "Who are my regulars?", hi: "मेरे पुराने ग्राहक कौन हैं?" },
  { en: "Write today's menu for WhatsApp", hi: "आज का मेन्यू WhatsApp के लिए लिखो" },
];

export const STARTER_SUGGESTIONS: Bi[] = [
  { en: "Why is my Swiggy payout lower this week?", hi: "इस हफ़्ते Swiggy पेआउट कम क्यों है?" },
  { en: "Reply to new reviews", hi: "नए रिव्यू का जवाब दो" },
  { en: "Paneer is finished, turn off paneer dishes", hi: "पनीर ख़त्म है, पनीर वाली डिश बंद करो" },
  { en: "How did we do yesterday?", hi: "कल का दिन कैसा रहा?" },
  { en: "Suggest a promo for the weekend", hi: "वीकेंड के लिए प्रोमो बताओ" },
];
