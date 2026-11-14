import React, { useEffect } from 'react';

export const GrievancePage: React.FC = () => {
  useEffect(() => {
    document.title = 'Grievance Redressal Policy | MoneyMapper';
  }, []);

  return (
    <>
      <header>
        <div className="brand">MoneyMapper</div>
        <h1>Grievance Redressal Policy</h1>
        <p>How to raise a complaint, and how we resolve it</p>
      </header>

      <div className="wrap" data-testid="grievance-content">
        <div className="meta-box">
          <b>Effective Date:</b> 28 August 2026 &nbsp;|&nbsp;
          <b>Last Updated:</b> 15 October 2026 &nbsp;|&nbsp;
          <b>Applies to:</b> All users of the MoneyMapper website and web application.
        </div>

        <p>
          MoneyMapper (operated by Monezra Mapper Private Limited) is committed to addressing user complaints and grievances &mdash; whether relating to account/billing issues, data privacy under the Digital Personal Data Protection Act, 2023, service quality, or content on the Platform &mdash; in a fair, transparent, and timely manner, in line with applicable Indian consumer protection and data protection law.
        </p>

        <h2><span className="num">1.</span>Grievance Officer</h2>
        <div className="officer-card">
          <h3>Designated Grievance Officer</h3>
          <div className="name">Sagar Nigam</div>
          <dl>
            <dt>Designation</dt>
            <dd>Compliance Head, Monezra Mapper Private Limited</dd>
            <dt>Email</dt>
            <dd><a href="mailto:grievance@moneymapper.in">grievance@moneymapper.in</a></dd>
            <dt>Phone</dt>
            <dd><a href="tel:+917987469093">+91-7987469093</a></dd>
            <dt>Correspondence / Registered Office Address</dt>
            <dd>Jawahar Nagar, D.S.S. Stadium, Shop No. 3, Satna, Raghurajnagar, Madhya Pradesh, India &ndash; 485001</dd>
            <dt>Working Hours for Grievance Response</dt>
            <dd>Monday&ndash;Friday, 10:00 AM &ndash; 6:00 PM IST (excluding public holidays)</dd>
          </dl>
        </div>

        <h2><span className="num">2.</span>What You Can Raise a Grievance About</h2>
        <ul>
          <li>Billing, subscription, or payment/auto-debit issues;</li>
          <li>Concerns about how your personal or financial data has been collected, used, or stored;</li>
          <li>Requests to access, correct, or delete your personal data (Data Principal rights under the DPDPA);</li>
          <li>Complaints regarding content, calculators, or the Financial Fitness Score;</li>
          <li>Account security concerns, including suspected unauthorized access;</li>
          <li>Any other concern regarding your experience on the Platform.</li>
        </ul>

        <h2><span className="num">3.</span>How to Raise a Grievance</h2>
        <ol>
          <li>Email the Grievance Officer at <a href="mailto:grievance@moneymapper.in">grievance@moneymapper.in</a>, with a subject line that clearly describes the issue (e.g., &quot;Billing Complaint&quot;, &quot;Data Deletion Request&quot;).</li>
          <li>Include your registered email ID/mobile number, a description of the issue, and any relevant screenshots or transaction reference numbers.</li>
          <li>Alternatively, you may use the in-app &quot;Help &amp; Support&quot; / &quot;Raise a Complaint&quot; option, where available.</li>
          <li>You may also write to us at the correspondence address given in Section 1.</li>
        </ol>
        <p>There is no fee for raising a grievance. Every complaint receives a unique reference number, which you can quote in all further communication.</p>

        <h2><span className="num">4.</span>Resolution Process &amp; Timelines</h2>
        <div className="table-scroll">
          <table>
            <thead>
              <tr><th>Step</th><th>Action</th><th>Timeline</th></tr>
            </thead>
            <tbody>
              <tr><td>1. Acknowledgement</td><td>Grievance Officer acknowledges receipt of your complaint</td><td>Within 48 hours of receipt</td></tr>
              <tr><td>2. Investigation</td><td>Relevant team investigates the complaint (billing, tech, data privacy, as applicable)</td><td>Within 7 working days</td></tr>
              <tr><td>3. Resolution</td><td>Final resolution communicated to the user, including reasoning</td><td>Within 15 working days from date of receipt (or such other period as may be required under applicable law, e.g., DPDPA timelines for data-related requests)</td></tr>
              <tr><td>4. Escalation</td><td>If unresolved, user may request escalation to senior management</td><td>Escalation reviewed within a further 7 working days</td></tr>
            </tbody>
          </table>
        </div>
        <p>For grievances specifically relating to personal data processing (as a Data Principal under the DPDPA), we will respond within the timeline prescribed under the Digital Personal Data Protection Act, 2023 and its rules.</p>

        <h2><span className="num">5.</span>Confidentiality</h2>
        <p>All grievances and the personal information shared in them are treated as confidential and used only to investigate and resolve your complaint, in line with our Privacy Policy. No user will face any adverse action or loss of service for raising a genuine grievance.</p>

        <h2><span className="num">6.</span>Escalation &mdash; Data Protection Board of India</h2>
        <p>If you are not satisfied with the resolution provided by our Grievance Officer regarding a personal data grievance, you have the right to file a complaint with the Data Protection Board of India, constituted under the Digital Personal Data Protection Act, 2023, in the manner prescribed by the Board.</p>

        <h2><span className="num">7.</span>Escalation &mdash; Consumer Forums</h2>
        <p>For grievances relating to deficiency in service or unfair trade practice, you may also approach the appropriate consumer dispute redressal forum/commission under the Consumer Protection Act, 2019, or contact the National Consumer Helpline at <a href="tel:1915">1915</a> or <a href="https://consumerhelpline.gov.in" target="_blank" rel="noopener noreferrer">consumerhelpline.gov.in</a>.</p>

        <h2><span className="num">8.</span>Review of this Policy</h2>
        <p>This Grievance Redressal Policy will be reviewed periodically and updated as required by law or business need. The latest version will always be available on this page, with the &quot;Last Updated&quot; date shown at the top.</p>
      </div>
    </>
  );
};

export default GrievancePage;
