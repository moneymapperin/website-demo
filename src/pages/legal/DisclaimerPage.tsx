import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const DisclaimerPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Disclaimer & Consent | MoneyMapper';
  }, []);

  return (
    <>
      <header>
        <div className="brand">MoneyMapper</div>
        <h1>Disclaimer &amp; Data Processing Consent</h1>
        <p>Please read this carefully before saving your profile</p>
      </header>

      <div className="wrap" data-testid="disclaimer-content">
        <div className="meta-box">
          <b>Effective Date:</b> 28 August 2026 &nbsp;|&nbsp;
          <b>Last Updated:</b> 11 October 2026<br />
          <b>Operated by:</b> Monezra Mapper Private Limited, Jawahar Nagar, D.S.S. Stadium, Shop No. 3, Satna, Raghurajnagar, Madhya Pradesh, India &ndash; 485001 (&quot;MoneyMapper&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
        </div>

        <p>
          This page explains what the consent you give while saving your profile means, what you are paying for (if you choose a paid plan), and the limits of what MoneyMapper provides. It should be read together with our <Link to="/privacy-policy.html">Privacy Policy</Link> and <Link to="/terms-and-conditions.html">Terms and Conditions</Link>.
        </p>

        <h2><span className="num">1.</span>Data Processing Consent</h2>
        <p>
          When you tick the &quot;Data Processing Consent&quot; box in your profile, you agree that MoneyMapper may collect, store and process the information you enter (such as income, expenses, savings, liabilities, insurance, investment details, risk appetite, investment goal, mutual fund portfolio details and equity exposure) in order to:
        </p>
        <ul>
          <li>calculate your MoneyMapper Score Card and Financial Fitness Score;</li>
          <li>provide personalized financial insights and statistics;</li>
          <li>show educational, rule-based suggestions relevant to your profile; and</li>
          <li>operate and improve the Platform, as described in our Privacy Policy.</li>
        </ul>
        <p>You may withdraw this consent at any time as described in our Privacy Policy.</p>

        <h2><span className="num">2.</span>What Our Charges / Subscriptions Are For</h2>
        <div className="callout">
          <span className="title">Paid plans = personal finance services</span>
          Any charges, fees or subscription amounts collected through the MoneyMapper app are for the personal finance tools and services offered in the app (such as access to premium features, tracking, planning tools and related functionality). They are <u>not</u> a fee, commission or payment for any guaranteed financial outcome, return, or investment result.
        </div>

        <h2><span className="num">3.</span>MoneyMapper Score Card is Free &amp; Educational Only</h2>
        <div className="callout edu">
          <span className="title">Free Score Card &ndash; For Educational Purposes Only</span>
          The MoneyMapper Score Card is provided to you <b>free of charge</b> and strictly for <b>educational and informational purposes</b>. It is a general, rule-based indicator based only on the information you enter. It is not a financial plan, a recommendation, or a guarantee of any kind.
        </div>
        <ul>
          <li>The Score Card, scores, insights, suggestions, gamification elements (XP, levels, streaks) and statistics are generated algorithmically from your inputs and may not reflect your complete financial situation.</li>
          <li>The quality of the output depends on the accuracy and completeness of the data you enter. You are responsible for entering correct information.</li>
          <li>Nothing in the Platform should be treated as investment advice, tax advice, legal advice, insurance advice, research analysis, or an offer or solicitation to buy or sell any security, mutual fund, insurance policy or other financial product.</li>
        </ul>

        <h2><span className="num">4.</span>Risk &amp; Responsibility</h2>
        <p>Investments in mutual funds, equities and other market-linked products are subject to market risks, and past performance is not an indicator of future returns. You acknowledge and agree that:</p>
        <ul>
          <li>Any financial, investment, insurance, borrowing or other decision you make is entirely your own, and you bear all risks arising from it.</li>
          <li>MoneyMapper does not guarantee any returns, savings, score improvement or financial result.</li>
          <li>To the fullest extent permitted by applicable law, MoneyMapper, its directors, team members and partners will not be responsible or liable for any loss, damage or consequence arising from your use of, or reliance on, the Score Card, insights or any other content on the Platform.</li>
          <li>You should consult a qualified and, where required, SEBI-registered financial adviser, tax professional or other expert before making important financial decisions.</li>
        </ul>
        <p>Nothing in this page limits any right you have under applicable law, including your rights as a Data Principal under the Digital Personal Data Protection Act, 2023 or any liability that cannot be excluded by law.</p>

        <h2><span className="num">5.</span>Your Acknowledgement</h2>
        <p>
          By ticking the consent box and saving your profile, you confirm that you have read and understood this page and the <Link to="/privacy-policy.html">Privacy Policy</Link>, that you are 18 years of age or older, and that you agree to the points above.
        </p>

        <h2><span className="num">6.</span>Contact</h2>
        <p>
          For any questions, opt-out requests or complaints, write to us at <a href="mailto:info@moneymapper.in">info@moneymapper.in</a> or see our <Link to="/grievance-redressal-policy.html">Grievance Redressal Policy</Link>.
        </p>
      </div>
    </>
  );
};

export default DisclaimerPage;
