import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';

export const CookiePolicyPage: React.FC = () => {
  useEffect(() => {
    document.title = 'Cookie Policy | MoneyMapper';
  }, []);

  return (
    <>
      <header>
        <div className="brand">MoneyMapper</div>
        <h1>Cookie Policy</h1>
        <p>For the MoneyMapper web application and website login dashboard</p>
      </header>

      <div className="wrap" data-testid="cookie-policy-content">
        <div className="meta-box">
          <b>Effective Date:</b> 28 August 2026 &nbsp;|&nbsp;
          <b>Applies to:</b> moneymapper.in and the web-based login dashboard/application.
        </div>

        <p>
          This Cookie Policy explains how MoneyMapper (Monezra Mapper Private Limited) uses cookies, local storage, and similar tracking technologies on our website and web application, including for session management, authentication, and analytics purposes on the web login dashboard.
        </p>

        <h2><span className="num">1.</span>What Are Cookies?</h2>
        <p>
          Cookies are small text files stored on your browser/device when you visit a website or use a web application. They help the website remember your actions and preferences (such as staying logged in) and help us understand how the Platform is used.
        </p>

        <h2><span className="num">2.</span>Categories of Cookies We Use</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Category</th><th>Purpose</th><th>Examples</th><th>Can You Disable?</th></tr>
            </thead>
            <tbody>
              <tr>
                <td><span className="tag essential">Essential</span></td>
                <td>Required for core functionality of the web login dashboard &mdash; without these, you cannot log in or use the Platform securely.</td>
                <td>Session identifier cookie, authentication/JWT token, CSRF-protection token, load-balancer routing cookie</td>
                <td>No &mdash; essential cookies cannot be disabled as they are necessary for the Platform to function and to keep your account secure.</td>
              </tr>
              <tr>
                <td><span className="tag functional">Functional</span></td>
                <td>Remember your preferences and settings across sessions.</td>
                <td>Selected currency/display preferences, &quot;remember this device&quot; preference, last-viewed pillar/dashboard tab</td>
                <td>Yes &mdash; via cookie settings; disabling may reduce convenience.</td>
              </tr>
              <tr>
                <td><span className="tag analytics">Analytical / Performance</span></td>
                <td>Help us understand how users navigate the Platform, which features are used, and where users face friction, so we can improve the Financial Fitness Score experience.</td>
                <td>Page-view tracking, click/event tracking, session-duration tracking, aggregated funnel analytics (e.g., signup-to-subscription conversion)</td>
                <td>Yes &mdash; you may opt out via the cookie consent banner/settings.</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h2><span className="num">3.</span>Authentication Tokens &amp; Session Management</h2>
        <ul>
          <li>When you log in to the web dashboard, we issue a session cookie and/or authentication token (e.g., JWT) to keep you securely logged in without requiring you to re-enter your password on every page.</li>
          <li>These tokens are set with security attributes (such as <code>HttpOnly</code>, <code>Secure</code>, and appropriate <code>SameSite</code> settings) to reduce the risk of theft via cross-site scripting or cross-site request forgery.</li>
          <li>Session cookies/tokens automatically expire after a period of inactivity or upon logout, in accordance with our account security practices described in our <Link to="/terms-and-conditions.html">Terms and Conditions</Link>.</li>
          <li>If you log in from multiple devices, a separate session token is generated per device/browser, in line with our multi-device login rules.</li>
        </ul>

        <h2><span className="num">4.</span>Third-Party Cookies</h2>
        <p>
          We may use reputable third-party analytics providers (e.g., web/product analytics tools) that set their own cookies to help us measure Platform usage in aggregate. These providers are contractually bound to process data only for the purposes we specify and in compliance with applicable Indian data protection law.
        </p>

        <h2><span className="num">5.</span>Managing Your Cookie Preferences</h2>
        <ul>
          <li>On your first visit, you will see a cookie consent banner allowing you to accept all cookies, or to customize/reject non-essential (functional and analytical) cookies.</li>
          <li>You can change your cookie preferences at any time via the &quot;Cookie Settings&quot; link in the website footer or app settings.</li>
          <li>You can also manage or delete cookies directly through your browser settings; note that blocking essential cookies will prevent you from logging in or using the Platform.</li>
        </ul>

        <h2><span className="num">6.</span>Relationship to Our Privacy Policy</h2>
        <p>
          Any personal data collected through cookies is handled in accordance with our <Link to="/privacy-policy.html">Privacy Policy</Link>, including our commitment to storing data on servers located within India.
        </p>

        <h2><span className="num">7.</span>Changes to this Policy</h2>
        <p>
          We may update this Cookie Policy from time to time to reflect changes in technology, regulation, or our practices. Please check this page periodically.
        </p>

        <h2><span className="num">8.</span>Contact</h2>
        <p>
          For questions about our use of cookies, contact <a href="mailto:info@moneymapper.in">info@moneymapper.in</a>. For complaints, see our <Link to="/grievance-redressal-policy.html">Grievance Redressal Policy</Link>.
        </p>
      </div>
    </>
  );
};

export default CookiePolicyPage;

