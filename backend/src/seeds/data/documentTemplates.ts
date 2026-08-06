/**
 * Default HR letters. Written as plain semantic HTML so they render correctly
 * in the Quill editor, the on-screen preview and the exported image alike.
 *
 * Placeholders use {{snake_case}}; anything the generator can work out from
 * the employee record or site settings is filled in automatically.
 */

const letterhead = `
<p style="text-align:right"><em>{{today}}</em></p>
<p><strong>{{employee_name}}</strong><br/>{{employee_email}}</p>
`.trim();

const signOff = `
<p>Warm regards,</p>
<p><strong>{{signatory_name}}</strong><br/>{{signatory_designation}}<br/>{{company_name}}</p>
`.trim();

export const defaultDocumentTemplates = [
  {
    name: "Offer Letter",
    type: "offer",
    description:
      "Sent to a candidate once terms are agreed, before their appointment letter.",
    contentHtml: `
${letterhead}
<h2>Offer of Employment</h2>
<p>Dear {{employee_name}},</p>
<p>We are delighted to offer you the position of <strong>{{designation}}</strong> at {{company_name}}. Everyone who met you was impressed, and we think you'll do excellent work here.</p>
<p>The headline terms are:</p>
<ul>
  <li><strong>Position:</strong> {{designation}}</li>
  <li><strong>Start date:</strong> {{join_date}}</li>
  <li><strong>Monthly salary:</strong> {{base_salary}}</li>
  <li><strong>Working hours:</strong> {{working_hours}}</li>
  <li><strong>Location:</strong> {{work_location}}</li>
</ul>
<p>This offer is open until {{offer_valid_until}}. To accept, reply to this letter or email us at {{company_email}}.</p>
<p>We're looking forward to working with you.</p>
${signOff}
`.trim(),
  },
  {
    name: "Appointment Letter",
    type: "appointment",
    description: "Confirms employment once the offer has been accepted.",
    contentHtml: `
${letterhead}
<h2>Letter of Appointment</h2>
<p>Dear {{employee_name}},</p>
<p>Further to your acceptance of our offer, we are pleased to confirm your appointment as <strong>{{designation}}</strong> at {{company_name}}, effective {{join_date}}.</p>
<p><strong>Employee ID:</strong> {{employee_id}}</p>
<p><strong>Monthly salary:</strong> {{base_salary}}</p>
<p><strong>Probation period:</strong> {{probation_period}}</p>
<p>Your role reports to {{reporting_to}}. The terms set out in your offer letter, together with our employee handbook, form part of this appointment.</p>
<p>Welcome to the team.</p>
${signOff}
`.trim(),
  },
  {
    name: "Promotion Letter",
    type: "promotion",
    description: "Confirms a change of role, and optionally of salary.",
    contentHtml: `
${letterhead}
<h2>Letter of Promotion</h2>
<p>Dear {{employee_name}},</p>
<p>In recognition of your contribution and the standard of your work, we are pleased to confirm your promotion from <strong>{{previous_designation}}</strong> to <strong>{{new_designation}}</strong>, effective {{effective_date}}.</p>
<p>Your revised monthly salary will be <strong>{{new_salary}}</strong>, effective from the same date. All other terms of your employment remain unchanged.</p>
<p>This promotion reflects the trust the team places in you. Congratulations, and thank you for the work that earned it.</p>
${signOff}
`.trim(),
  },
  {
    name: "Resignation Acceptance",
    type: "resignation-acceptance",
    description: "Acknowledges a resignation and confirms the last working day.",
    contentHtml: `
${letterhead}
<h2>Acceptance of Resignation</h2>
<p>Dear {{employee_name}},</p>
<p>We acknowledge receipt of your resignation letter dated {{resignation_date}} from the position of {{designation}}.</p>
<p>Your resignation has been accepted, and your last working day with {{company_name}} will be <strong>{{last_working_date}}</strong>.</p>
<p>Please complete the handover of your responsibilities and return any company property before that date. Your final settlement will be processed in the payroll cycle following your departure.</p>
<p>Thank you for your contribution during your time here. We wish you well in what comes next.</p>
${signOff}
`.trim(),
  },
  {
    name: "Experience Certificate",
    type: "experience",
    description: "Confirms dates of employment and role for a departing employee.",
    contentHtml: `
<p style="text-align:right"><em>{{today}}</em></p>
<h2 style="text-align:center">To Whom It May Concern</h2>
<p>This is to certify that <strong>{{employee_name}}</strong> (Employee ID: {{employee_id}}) was employed at {{company_name}} as <strong>{{designation}}</strong> from {{join_date}} to {{last_working_date}}.</p>
<p>During this period they were found to be {{conduct_remark}}. Their responsibilities included {{responsibilities}}.</p>
<p>We wish them every success in their future endeavours.</p>
${signOff}
`.trim(),
  },
  {
    name: "No Objection Certificate",
    type: "noc",
    description: "Confirms the company has no objection, e.g. for a visa or loan.",
    contentHtml: `
<p style="text-align:right"><em>{{today}}</em></p>
<h2 style="text-align:center">No Objection Certificate</h2>
<p>This is to certify that <strong>{{employee_name}}</strong> (Employee ID: {{employee_id}}) has been employed with {{company_name}} as <strong>{{designation}}</strong> since {{join_date}}.</p>
<p>{{company_name}} has no objection to {{employee_name}} {{noc_purpose}}.</p>
<p>This certificate is issued at the request of the employee for {{noc_reason}}.</p>
${signOff}
`.trim(),
  },
];
