export type Lang = "en" | "hi";

const dict = {
  // Landing
  "landing.title": { en: "Where is your restaurant today?", hi: "आपका रेस्टोरेंट आज कहाँ है?" },
  "landing.sub": {
    en: "Zest runs the day-to-day of selling on Zomato, Swiggy and your own tables, and talks to you in Hindi or English, here or on WhatsApp.",
    hi: "Zest, Zomato, Swiggy और आपकी अपनी डाइनिंग का रोज़ का काम संभालता है, और आपसे हिंदी या अंग्रेज़ी में बात करता है, यहाँ या WhatsApp पर।",
  },
  "journey.new": { en: "I'm starting a new restaurant", hi: "मैं नया रेस्टोरेंट शुरू कर रहा/रही हूँ" },
  "journey.new.sub": {
    en: "Licences, menu and getting listed, step by step",
    hi: "लाइसेंस, मेन्यू और लिस्टिंग, एक-एक कदम",
  },
  "journey.notlive": { en: "I have a restaurant, but I'm not online yet", hi: "मेरा रेस्टोरेंट है, पर अभी ऑनलाइन नहीं है" },
  "journey.notlive.sub": {
    en: "Get listed on Zomato and Swiggy",
    hi: "Zomato और Swiggy पर लिस्ट हों",
  },
  "journey.live": { en: "I already sell on Zomato or Swiggy", hi: "मैं पहले से Zomato या Swiggy पर बेचता/बेचती हूँ" },
  "journey.live.sub": {
    en: "Connect in two minutes and see your payouts, orders and reviews",
    hi: "दो मिनट में जोड़ें और अपने पेआउट, ऑर्डर और रिव्यू देखें",
  },
  "landing.where": { en: "Where are you live?", hi: "आप कहाँ लाइव हैं?" },
  "landing.where.sub": {
    en: "We'll only show the platforms you pick. You can add one later.",
    hi: "हम सिर्फ़ वही प्लेटफ़ॉर्म दिखाएँगे जो आप चुनेंगे। बाद में और जोड़ सकते हैं।",
  },
  "landing.continue": { en: "Continue to connect", hi: "जोड़ने के लिए आगे बढ़ें" },
  "landing.demo": { en: "Look around with sample data", hi: "सैंपल डेटा के साथ देखें" },
  "landing.stages": { en: "From first licence to fiftieth outlet", hi: "पहले लाइसेंस से पचासवें आउटलेट तक" },
  "stage.1": { en: "Get onboarded", hi: "ऑनबोर्ड हों" },
  "stage.1.sub": {
    en: "Photograph your FSSAI, GST and bank documents. We check them, turn a photo of your paper menu into a digital one, and follow up on your listing.",
    hi: "FSSAI, GST और बैंक दस्तावेज़ों की फ़ोटो लें। हम उन्हें जाँचते हैं, पेपर मेन्यू की फ़ोटो से डिजिटल मेन्यू बनाते हैं, और लिस्टिंग का फ़ॉलो-अप करते हैं।",
  },
  "stage.2": { en: "Settle in", hi: "जमें" },
  "stage.2.sub": {
    en: "For your first 90 days: reply to every review, fix slow prep times, and see how you compare with kitchens nearby.",
    hi: "पहले 90 दिन: हर रिव्यू का जवाब, धीमे प्रेप टाइम ठीक करना, और आस-पास की किचन से तुलना।",
  },
  "stage.3": { en: "Grow", hi: "बढ़ें" },
  "stage.3.sub": {
    en: "Promos and ads that pay for themselves, a sharper menu, and a weekly leaderboard on WhatsApp.",
    hi: "ऐसे प्रोमो और ऐड जो अपना ख़र्च निकालें, बेहतर मेन्यू, और हर हफ़्ते WhatsApp पर लीडरबोर्ड।",
  },

  // Connect
  "connect.title": { en: "Connect your restaurant", hi: "अपना रेस्टोरेंट जोड़ें" },
  "connect.sub": {
    en: "Start with email, it's where every payout and statement already lands. Then connect each platform the way that suits you.",
    hi: "ईमेल से शुरू करें, हर पेआउट और स्टेटमेंट वहीं आता है। फिर हर प्लेटफ़ॉर्म को अपने तरीक़े से जोड़ें।",
  },
  "connect.email": { en: "Email", hi: "ईमेल" },
  "connect.email.sub": {
    en: "We read only mail from Zomato, Swiggy, your bank and your POS.",
    hi: "हम सिर्फ़ Zomato, Swiggy, आपके बैंक और POS के मेल पढ़ते हैं।",
  },
  "connect.google": { en: "Connect Gmail", hi: "Gmail जोड़ें" },
  "connect.outlook": { en: "Connect Outlook", hi: "Outlook जोड़ें" },
  "connect.platforms": { en: "Your platforms", hi: "आपके प्लेटफ़ॉर्म" },
  "connect.how": { en: "How do you want to connect?", hi: "कैसे जोड़ना चाहेंगे?" },
  "connect.button": { en: "Connect", hi: "जोड़ें" },
  "connect.connected": { en: "Connected", hi: "जुड़ गया" },
  "connect.whatsapp": { en: "WhatsApp updates", hi: "WhatsApp अपडेट" },
  "connect.whatsapp.sub": {
    en: "A short summary every morning, a message when a payout lands, and the weekly leaderboard. Reply to chat with your copilot.",
    hi: "हर सुबह छोटा सारांश, पेआउट आने पर मैसेज, और हर हफ़्ते लीडरबोर्ड। जवाब देकर अपने कोपायलट से बात करें।",
  },
  "connect.whatsapp.on": { en: "Send me WhatsApp updates", hi: "मुझे WhatsApp अपडेट भेजें" },
  "connect.finish": { en: "Open my dashboard", hi: "मेरा डैशबोर्ड खोलें" },
  "connect.later": { en: "You can connect the rest later from Connections.", hi: "बाक़ी आप बाद में कनेक्शन से जोड़ सकते हैं।" },
  "connect.safe": { en: "How we keep this safe", hi: "हम इसे कैसे सुरक्षित रखते हैं" },
  "connect.safe.1": {
    en: "Passwords and keys are encrypted and never shown to the AI.",
    hi: "पासवर्ड और की एन्क्रिप्टेड रहते हैं और AI को कभी नहीं दिखते।",
  },
  "connect.safe.2": {
    en: "Nothing changes on Zomato or Swiggy without your OK.",
    hi: "आपकी मंज़ूरी के बिना Zomato या Swiggy पर कुछ नहीं बदलता।",
  },
  "connect.safe.3": {
    en: "Disconnect any time, and we delete what we stored.",
    hi: "कभी भी डिस्कनेक्ट करें, और हम सेव किया डेटा मिटा देते हैं।",
  },

  // Shell
  "nav.today": { en: "Today", hi: "आज" },
  "nav.orders": { en: "Orders", hi: "ऑर्डर" },
  "nav.menu": { en: "Menu", hi: "मेन्यू" },
  "nav.reviews": { en: "Reviews", hi: "रिव्यू" },
  "nav.money": { en: "Money", hi: "पैसे" },
  "nav.dining": { en: "Dining", hi: "डाइनिंग" },
  "nav.growth": { en: "Growth", hi: "ग्रोथ" },
  "nav.connections": { en: "Connections", hi: "कनेक्शन" },
  "nav.copilot": { en: "Ask Zest", hi: "Zest से पूछें" },
  "nav.more": { en: "More", hi: "और" },
  "soon": { en: "Coming soon", hi: "जल्द आ रहा है" },

  // Copilot
  "copilot.placeholder": { en: "Ask anything, in Hindi or English", hi: "कुछ भी पूछें, हिंदी या अंग्रेज़ी में" },
  "copilot.hello": {
    en: "Good morning. I've gone through last night's orders and your inbox. Ask me anything, or pick one of these.",
    hi: "सुप्रभात। मैंने कल रात के ऑर्डर और आपका इनबॉक्स देख लिया है। कुछ भी पूछें, या इनमें से चुनें।",
  },
  "copilot.send": { en: "Send", hi: "भेजें" },
  "copilot.voice": { en: "Speak", hi: "बोलें" },

  // Tickets
  "ticket.needsOk": { en: "Needs your OK", hi: "आपकी मंज़ूरी चाहिए" },
  "ticket.approve": { en: "Approve", hi: "मंज़ूर करें" },
  "ticket.edit": { en: "Edit", hi: "बदलें" },
  "ticket.skip": { en: "Skip", hi: "छोड़ें" },
  "ticket.approved": { en: "Approved", hi: "मंज़ूर" },
  "ticket.skipped": { en: "Skipped", hi: "छोड़ा" },
  "ticket.undo": { en: "Undo", hi: "वापस लें" },

  // Today
  "today.hello": { en: "Good morning", hi: "सुप्रभात" },
  "today.yesterday": { en: "Yesterday's sales", hi: "कल की बिक्री" },
  "today.payout": { en: "Next payout", hi: "अगला पेआउट" },
  "today.rating": { en: "Rating", hi: "रेटिंग" },
  "today.complaints": { en: "Open complaints", hi: "खुली शिकायतें" },
  "today.approvals": { en: "Waiting for your OK", hi: "आपकी मंज़ूरी का इंतज़ार" },
  "today.next": { en: "Worth doing today", hi: "आज करने लायक" },
  "today.sources": { en: "Data sources", hi: "डेटा स्रोत" },
  "today.empty": { en: "Nothing waiting. Your agents will put drafts here.", hi: "कुछ बाक़ी नहीं। आपके एजेंट ड्राफ़्ट यहाँ रखेंगे।" },
} as const;

export type Key = keyof typeof dict;

export function translate(lang: Lang, key: Key): string {
  return dict[key][lang];
}

export type Bi = { en: string; hi: string };
