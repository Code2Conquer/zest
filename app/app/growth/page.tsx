import { ComingSoon } from "@/components/coming-soon";

export default function Growth() {
  return (
    <ComingSoon
      phase={5}
      title={{ en: "Growth", hi: "ग्रोथ" }}
      body={{
        en: "Ads and promos on every platform you sell on, each with a spend cap, an expected return, and an automatic stop if it isn't paying off. Ask Zest for a promo to try it now.",
        hi: "हर प्लेटफ़ॉर्म पर ऐड और प्रोमो, हर एक की ख़र्च सीमा और अनुमानित फ़ायदे के साथ, और फ़ायदा न होने पर अपने-आप बंद। अभी आज़माने के लिए Zest से प्रोमो पूछें।",
      }}
    />
  );
}
