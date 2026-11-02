(function () {
  'use strict';

  var SUPABASE_URL = 'https://upxsmlmsqxcwknvtywgk.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVweHNtbG1zcXhjd2tudnR5d2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxNjc3OTQsImV4cCI6MjA5NDc0Mzc5NH0.WTim-6TNx9l8TSmKJKf5xZVN1ZAy3uMKPUyi1otCblk';
  var TABLE = 'deletion_requests';

  var form = document.getElementById('deletion-form');
  var btn = document.getElementById('submit-btn');
  var statusBox = document.getElementById('form-status');
  if (!form) return;

  function setStatus(type, msg) {
    statusBox.className = 'del-status ' + type;
    statusBox.textContent = msg;
  }

  function setInvalid(name, isInvalid) {
    var wrap = form.querySelector('[data-field="' + name + '"]');
    if (wrap) wrap.classList.toggle('invalid', isInvalid);
  }

  function normalizePhone(raw) {
    var digits = String(raw).replace(/[\s\-()]/g, '');
    digits = digits.replace(/^\+?91/, '').replace(/^0/, '');
    return digits;
  }

  function validate(values) {
    var ok = true;
    var checks = {
      first_name: values.first_name.length > 0,
      last_name: values.last_name.length > 0,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email),
      phone: /^[6-9]\d{9}$/.test(normalizePhone(values.phone)),
      reason: values.reason.length >= 5
    };
    Object.keys(checks).forEach(function (k) {
      setInvalid(k, !checks[k]);
      if (!checks[k]) ok = false;
    });
    return ok;
  }

  form.addEventListener('input', function (e) {
    var wrap = e.target.closest && e.target.closest('.del-field');
    if (wrap) wrap.classList.remove('invalid');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    statusBox.className = 'del-status';
    statusBox.textContent = '';

    // Honeypot: bots fill this, humans never see it
    if (form.elements['website'].value) return;

    var values = {
      first_name: form.elements['first_name'].value.trim(),
      last_name: form.elements['last_name'].value.trim(),
      email: form.elements['email'].value.trim().toLowerCase(),
      phone: form.elements['phone'].value.trim(),
      reason: form.elements['reason'].value.trim()
    };

    if (!validate(values)) {
      setStatus('error', 'Please correct the highlighted fields and try again.');
      return;
    }

    btn.disabled = true;
    var originalLabel = btn.textContent;
    btn.textContent = 'Submitting...';

    fetch(SUPABASE_URL + '/rest/v1/' + TABLE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: normalizePhone(values.phone),
        reason: values.reason
      })
    })
      .then(function (res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        form.reset();
        Array.prototype.forEach.call(form.children, function (el) {
          if (el !== statusBox) el.style.display = 'none';
        });
        setStatus('success', 'Your deletion request has been received. We will verify your details and process it within the timeline prescribed under the DPDPA. A confirmation may be sent to the email you provided.');
      })
      .catch(function () {
        btn.disabled = false;
        btn.textContent = originalLabel;
        setStatus('error', 'We could not submit your request right now. Please try again in a few minutes or email info@moneymapper.in.');
      });
  });
})();
