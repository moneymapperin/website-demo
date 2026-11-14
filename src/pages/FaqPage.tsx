import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './FaqPage.css';

interface FaqItem {
  question: string;
  answer: string;
}

const FAQ_ITEMS: FaqItem[] = [
  {
    question: 'Is MoneyMapper a SEBI-registered investment adviser?',
    answer:
      'MoneyMapper is a financial wellness platform. The Investment pillar and any investment recommendations will be offered only after the required SEBI registration is in place. Market scores in the app are informational and not investment advice.',
  },
  {
    question: 'Do I need to share my bank login?',
    answer:
      'No. You enter your own numbers in a guided profile. MoneyMapper does not ask for net banking credentials.',
  },
  {
    question: 'How is the Financial Fitness Score calculated?',
    answer:
      'Each of the five pillars (Income, Expenses, Savings, Protection, Investment) is scored from 0 to 100 from your profile, and the Financial Fitness Score is the average of the five. The method is grounded in the RBI Household Finance Committee Report (2017).',
  },
  {
    question: 'Does the AI Assistant use ChatGPT or another external AI?',
    answer:
      'No. It is a transparent, rule-based assistant that reads your own dashboard data. Your questions are not sent to an external language-model service.',
  },
  {
    question: 'Is there a mobile app?',
    answer:
      'The web app works on any phone and you can sign in by scanning a QR code. The Android app is in testing and is being prepared for Google Play.',
  },
  {
    question: 'How much does it cost?',
    answer:
      'Plans are ₹499 per month (quarterly), ₹399 per month (half-yearly) and ₹299 per month (yearly). Business pricing is ₹199 per employee per month. Final checkout in app stores may include platform fees.',
  },
  {
    question: 'Can my employer see my personal data?',
    answer:
      'No. Corporate dashboards show aggregate analytics for the workforce, not individual employee details.',
  },
  {
    question: 'How do I delete my data?',
    answer:
      'Use the Data Deletion Request page linked in the footer and your data deletion request will be processed.',
  },
];

export const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  useEffect(() => {
    document.title = 'MoneyMapper FAQ';
    if (typeof window !== 'undefined') {
      window.scrollTo(0, 0);
    }
  }, []);

  const handleToggle = (idx: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <div className="faq-page-root">
      <div className="wrap" data-testid="faq-page-content">
        <p className="eyebrow">FAQ</p>
        <h1>Questions, <span className="grad">answered</span></h1>

        {FAQ_ITEMS.map((item, idx) => {
          const isOpen = openIndex === idx;
          return (
            <details key={idx} className="item" open={isOpen}>
              <summary onClick={handleToggle(idx)}>
                {item.question}
                <span className="chev"></span>
              </summary>
              <div className="answer">{item.answer}</div>
            </details>
          );
        })}

        <div className="center">
          <Link className="back" to="/">← Back to MoneyMapper</Link>
        </div>
      </div>
    </div>
  );
};

export default FaqPage;

