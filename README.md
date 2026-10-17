# Zest

Phase 0 prototype of the restaurant AI agent described in `../PLAN.md`: a web app plus a conversational copilot for restaurant owners selling on Zomato, Swiggy and dine-in.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build + type check
```

## What's here

| Route | What it is |
|---|---|
| `/` | Landing page: animated hero (thali plus agent tickets printing), product showcase of five auto-playing scenes (menu, orders, reviews, payouts, WhatsApp), the agent "brigade", journey, and the entry router |
| `/connect` | Email, then each live platform via partner app sign-in, partner API or MCP server, then WhatsApp |
| `/start` | Onboarding: documents and menu from photos (vision is simulated), listing application |
| `/app` | Today: yesterday's sales by channel, next payout, ratings, approvals queue, suggestions |
| `/app/menu` | Menu editor laid out like a Zomato listing: category rail, veg marks, bestseller tags, dish images with stock button, customer preview per platform, edit drawer, Zest suggestions, changes held for approval then published |
| `/app/orders`, `/reviews`, `/money`, `/connections` | Modules, filtered to the platforms the owner is live on |
| `/api/copilot` | Orchestrator endpoint. Routes to Money, Reviews, Menu, Orders or Growth agent and returns typed cards |

Hindi and English throughout; the copilot answers in Hindi when the owner writes in Devanagari or Hinglish.

## Design notes

- Dishes are SVG illustrations (`components/dishes.tsx`), served in steel katoris and thalis. Uploaded dish photos replace them in the menu editor; in production each restaurant's own photos are used.
- Animation uses `motion`. Everything respects reduced-motion settings.
- Palette: haldi yellow, curry-leaf green, chilli and masala brown on the landing; the app stays calm with the same accents.

## Where the real system plugs in

- `lib/agents.ts`: `orchestrate()` is keyword routing over sample data. Replace it with the model-driven orchestrator; keep the `AgentReply` / `Card` contract so the UI doesn't change.
- `lib/platforms.ts`: connector methods (API, MCP, portal sign-in). Each becomes an MCP server behind the same unified data model.
- `lib/data.ts`: sample data in the unified model. Replace with the data layer fed by email ingestion and connectors.
- `components/ticket.tsx`: the approval card. Approve/Skip/Undo is local state today; wire it to the action-tier enforcement and audit log.
- State (journey, platforms, connections, language) is kept in `localStorage` for the prototype only.
