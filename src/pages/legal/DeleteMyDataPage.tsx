import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import './DeleteMyDataPage.css';

function normalizePhone(raw: string): string {
  let digits = String(raw).replace(/[\s\-()]/g, '');
  digits = digits.replace(/^\+?91/, '').replace(/^0/, '');
  return digits;
}

export const DeleteMyDataPage: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [honeypot, setHoneypot] = useState('');

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    document.title = 'Data Deletion Request | MoneyMapper';
  }, []);

  const handleInputChange = (field: string, setter: (val: string) => void) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setter(e.target.value);
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: false }));
    }
  };

  const validate = () => {
    const checks: Record<string, boolean> = {
      first_name: firstName.trim().length > 0,
      last_name: lastName.trim().length > 0,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim()),
      phone: /^[6-9]\d{9}$/.test(normalizePhone(phone.trim())),
      reason: reason.trim().length >= 5,
    };

    const newErrors: Record<string, boolean> = {};
    let ok = true;
    for (const key of Object.keys(checks)) {
      if (!checks[key]) {
        newErrors[key] = true;
        ok = false;
      }
    }
    setErrors(newErrors);
    return ok;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    // Honeypot check: bots fill this, humans never see it
    if (honeypot) return;

    if (!validate()) {
      setStatus({
        type: 'error',
        message: 'Please correct the highlighted fields and try again.',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: normalizePhone(phone.trim()),
        reason: reason.trim(),
      };

      const { error } = await supabase.from('deletion_requests').insert([payload]);
      if (error) {
        throw error;
      }

      setIsSuccess(true);
      setStatus({
        type: 'success',
        message:
          'Your deletion request has been received. We will verify your details and process it within the timeline prescribed under the DPDPA. A confirmation may be sent to the email you provided.',
      });
    } catch {
      setStatus({
        type: 'error',
        message:
          'We could not submit your request right now. Please try again in a few minutes or email info@moneymapper.in.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <header>
        <div className="brand">MoneyMapper</div>
        <h1>Data Deletion Request</h1>
        <p>Exercise your Right to Erasure under the Digital Personal Data Protection Act, 2023 (DPDPA)</p>
      </header>

      <div className="wrap" data-testid="delete-my-data-content">
        <div className="callout critical">
          <span className="title">&#9888;&#65039; Permanent Action</span>
          Once processed, deletion of your account and personal data is permanent and cannot be undone. Data we are legally required to retain (for example, financial or tax records) may be kept only for the period the law requires.
        </div>

        <p>
          Please fill in the details below. Use the same email address and phone number that are linked to your MoneyMapper account so that we can verify your request. Read how we handle your data in our <Link to="/privacy-policy.html">Privacy Policy</Link>.
        </p>

        <form id="deletion-form" className="del-form" noValidate autoComplete="on" onSubmit={handleSubmit}>
          {!isSuccess && (
            <>
              <div className="del-grid">
                <div className={`del-field ${errors.first_name ? 'invalid' : ''}`} data-field="first_name">
                  <label htmlFor="first_name">First Name<span className="req">*</span></label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    maxLength={80}
                    autoComplete="given-name"
                    value={firstName}
                    onChange={handleInputChange('first_name', setFirstName)}
                    required
                  />
                  <span className="del-error">Please enter your first name.</span>
                </div>
                <div className={`del-field ${errors.last_name ? 'invalid' : ''}`} data-field="last_name">
                  <label htmlFor="last_name">Last Name<span className="req">*</span></label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    maxLength={80}
                    autoComplete="family-name"
                    value={lastName}
                    onChange={handleInputChange('last_name', setLastName)}
                    required
                  />
                  <span className="del-error">Please enter your last name.</span>
                </div>
              </div>

              <div className={`del-field ${errors.email ? 'invalid' : ''}`} data-field="email">
                <label htmlFor="email">Email ID<span className="req">*</span></label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  maxLength={254}
                  autoComplete="email"
                  value={email}
                  onChange={handleInputChange('email', setEmail)}
                  required
                />
                <span className="del-error">Please enter a valid email address.</span>
              </div>

              <div className={`del-field ${errors.phone ? 'invalid' : ''}`} data-field="phone">
                <label htmlFor="phone">Phone Number<span className="req">*</span></label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  maxLength={15}
                  inputMode="numeric"
                  autoComplete="tel"
                  placeholder="10-digit mobile number"
                  value={phone}
                  onChange={handleInputChange('phone', setPhone)}
                  required
                />
                <span className="del-error">Please enter a valid 10-digit mobile number.</span>
              </div>

              <div className={`del-field ${errors.reason ? 'invalid' : ''}`} data-field="reason">
                <label htmlFor="reason">Why are you deleting your data?<span className="req">*</span></label>
                <textarea
                  id="reason"
                  name="reason"
                  maxLength={1000}
                  value={reason}
                  onChange={handleInputChange('reason', setReason)}
                  required
                />
                <span className="del-error">Please tell us the reason (at least 5 characters).</span>
              </div>

              <div className="del-hp" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input
                  type="text"
                  id="website"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>

              <button type="submit" id="submit-btn" className="del-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Deletion Request'}
              </button>
            </>
          )}

          {status && (
            <div id="form-status" className={`del-status ${status.type}`} role="status" aria-live="polite">
              {status.message}
            </div>
          )}
        </form>

        <p style={{ marginTop: '24px' }}>
          Questions? Write to <a href="mailto:info@moneymapper.in">info@moneymapper.in</a> or see our <Link to="/grievance-redressal-policy.html">Grievance Redressal Policy</Link>.
        </p>
      </div>
    </>
  );
};

export default DeleteMyDataPage;
