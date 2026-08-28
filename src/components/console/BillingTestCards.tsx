"use client";

import { useConsoleCopy } from "@/components/console/ConsoleLang";

const TEST_CARDS = [
  { label: "Visa — success", number: "4242 4242 4242 4242" },
  { label: "Mastercard — success", number: "5555 5555 5555 4444" },
  { label: "Declined", number: "4000 0000 0000 0002" },
] as const;

export function BillingTestCards() {
  const { copy } = useConsoleCopy();
  const t = copy.billing;

  return (
    <section className="console-panel billing-test-cards" aria-labelledby="billing-test-cards-title">
      <div className="console-panel-heading">
        <div>
          <h2 id="billing-test-cards-title">{t.testCardsTitle}</h2>
          <p>{t.testCardsHint}</p>
        </div>
      </div>
      <ul className="billing-test-cards__list">
        {TEST_CARDS.map((card) => (
          <li key={card.number}>
            <span className="billing-test-cards__label">{card.label}</span>
            <code dir="ltr" className="billing-test-cards__number">
              {card.number}
            </code>
          </li>
        ))}
      </ul>
      <p className="billing-test-cards__meta">{t.testCardsMeta}</p>
    </section>
  );
}
