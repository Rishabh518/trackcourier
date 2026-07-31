
// ── Shared values ────────────────────────────────────────────────────
const NAVY       = '#1a3a6b';
const NAVY_DARK  = '#122a50';
const BLUE_LT    = '#dbeafe';
const AMBER_LT   = '#fef3c7';
const AMBER_TEXT = '#92400e';
const GREEN_LT   = '#dcfce7';
const GREEN_TEXT = '#166534';
const BORDER     = '#e5e7eb';
const MUTED      = '#6b7280';
const TEXT       = '#111827';
const BG         = '#f3f6fb';

// ── Shared blocks ─────────────────────────────────────────────────────

function header(tagText: string, tagBg: string, tagColor: string): string {
  return `
    <div style="background:${NAVY}; padding:10px 12px 8px;; text-align:center;">
      <div style="display:inline-flex; align-items:center; gap:10px; margin-bottom:10px;">
        <div style="width:150px; height:90px; border-radius:9px; background:rgba(255,255,255,0.15); display:inline-flex; align-items:center; justify-content:center;">
          <img src="cid:ryanlogo" width="150px" height="90px" alt="" style="display:block;" />
        </div>  
      </div>
        <div style="font-size:16px; font-weight:500; color:#ffffff; letter-spacing:0.3px; font-family:Arial,sans-serif;">
          Ryan Lab Enterprises
        </div>
      <div>
        <span style="display:inline-block; font-size:11px; font-weight:600; letter-spacing:0.08em; text-transform:uppercase; padding:4px 12px; border-radius:999px; background:${tagBg}; color:${tagColor}; font-family:Arial,sans-serif;">
          ${tagText}
        </span>
      </div>
    </div>
  `;
}

function illustration(emoji: string, bg: string): string {
  return `
    <div style="padding:20px 28px 8px; text-align:center;">
      <div style="width:160px; height:120px; border-radius:20px; background:${bg}; margin:0 auto; display:flex; align-items:center; justify-content:center;">
        <img src=${emoji} width="160px" height="120px" style="display:block;" />
      </div>
    </div>
  `;
}

function infoBlock(
  trackingNumber: string,
  invoiceRef: string,
  partner: string,
  statusLabel: string,
  statusColor: string,
): string {
  const row = (label: string, value: string, valueStyle = '') => `
    <tr>
      <td style="padding:10px 16px; font-size:12px; color:${MUTED}; font-family:Arial,sans-serif; border-bottom:0.5px solid ${BORDER}; width:45%;">
        ${label}
      </td>
      <td style="padding:10px 16px; font-size:13px; color:${TEXT}; font-weight:500; font-family:Arial,sans-serif; border-bottom:0.5px solid ${BORDER}; text-align:right; ${valueStyle}">
        ${value}
      </td>
    </tr>
  `;

  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0"
      style="background:#f9fafb; border:0.5px solid ${BORDER}; border-radius:10px; margin-bottom:18px; border-collapse:separate; border-spacing:0;">
      <tbody>
        ${row('Tracking no.', trackingNumber, 'font-family:monospace; font-size:12px;')}
        ${row('Invoice ref.', invoiceRef ?? '—')}
        ${row('Courier partner', partner.toUpperCase())}
        <tr>
          <td style="padding:10px 16px; font-size:12px; color:${MUTED}; font-family:Arial,sans-serif; width:45%;">
            Status
          </td>
          <td style="padding:10px 16px; font-size:13px; font-weight:600; font-family:Arial,sans-serif; text-align:right; color:${statusColor};">
            ${statusLabel}
          </td>
        </tr>
      </tbody>
    </table>
  `;
}

function statusPill(label: string, bg: string, color: string): string {
  return `
    <div style="margin-bottom:18px;">
      <span style="display:inline-flex; align-items:center; gap:6px; padding:6px 14px; border-radius:999px; font-size:12px; font-weight:600; letter-spacing:0.04em; background:${bg}; color:${color}; font-family:Arial,sans-serif;">
        ● ${label}
      </span>
    </div>
  `;
}

function footer(): string {
  return `
    <div style="background:#f9fafb; border-top:0.5px solid ${BORDER}; padding:14px 28px; text-align:center;">
      <div style="width:32px; height:2px; background:${NAVY}; border-radius:2px; margin:0 auto 8px;"></div>
      <p style="font-size:13px; font-weight:500; color:${NAVY}; margin:0 0 4px; font-family:Arial,sans-serif;">
        Ryan Lab Enterprises
      </p>
      <p style="font-size:11px; color:#9ca3af; line-height:1.8; margin:0; font-family:Arial,sans-serif;">
        Industrial Area Phase-8, Mohali, Punjab<br>
        <a href="mailto:sales@ryanlabenterprises.com" style="color:#9ca3af; text-decoration:none;">sales@ryanlabenterprises.com</a>
        &nbsp;·&nbsp;
        <a href="https://www.ryanlabenterprises.in" style="color:#9ca3af; text-decoration:none;">ryanlabenterprises.in</a><br>
        © ${new Date().getFullYear()} Ryan Lab Enterprises. All rights reserved.
      </p>
    </div>
  `;
}

function wrapper(content: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta http-equiv="X-UA-Compatible" content="IE=edge" />
      <title>Ryan Lab Enterprises</title>
    </head>
    <body style="margin:0; padding:0; background:${BG}; font-family:Arial,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG}; padding:24px 16px;">
        <tr>
          <td align="center">
            <table width="100%" cellpadding="0" cellspacing="0" border="0"
              style="max-width:480px; background:#ffffff; border-radius:12px; overflow:hidden; border-collapse:collapse;">
              <tr><td>${content}</td></tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// ── Template 1 — Dispatched ───────────────────────────────────────────
export function dispatchedEmail(
  custName: string,
  trackingNumber: string,
  invoiceRef: string,
  partner: string,
  currentStatus: string,
): string {
  const content = `
    ${header('Your order is on its way', 'rgba(255,255,255,0.15)', '#ffffff')}

    ${illustration("cid:dispatch", BLUE_LT)}

    <div style="padding:12px 28px 24px;">
      <h2 style="font-size:18px; font-weight:500; color:${TEXT}; margin:0 0 8px; line-height:1.35; font-family:Arial,sans-serif;">
        Hi ${custName}, your order<br>has been dispatched!
      </h2>
      <p style="font-size:13px; color:${MUTED}; line-height:1.7; margin:0 0 18px; font-family:Arial,sans-serif;">
        Thank you for your purchase with Ryan Lab Enterprises. Your items are packed
        and on their way. We'll keep you posted every step of the journey.
      </p>

      ${statusPill('Dispatched', BLUE_LT, NAVY)}

      ${infoBlock(trackingNumber, invoiceRef, partner, currentStatus, NAVY)}

      <p style="font-size:12px; color:${MUTED}; line-height:1.7; text-align:center; margin:0; font-family:Arial,sans-serif;">
        Have a question about your order?
        <a href="mailto:sales@ryanlabenterprises.com" style="color:#2563b0; text-decoration:none;">Contact us</a>
        and we'll be happy to help.
      </p>
    </div>

    ${footer()}
  `;
  return wrapper(content);
}

// ── Template 2 — Status update ────────────────────────────────────────
export function statusUpdatedEmail(
  custName: string,
  trackingNumber: string,
  invoiceRef: string,
  partner: string,
  newStatus: string,
): string {
  const content = `
    ${header('Shipment update', 'rgba(245,158,11,0.25)', '#fef3c7')}

    ${illustration("cid:statuschange", AMBER_LT)}

    <div style="padding:12px 28px 24px;">
      <h2 style="font-size:18px; font-weight:500; color:${TEXT}; margin:0 0 8px; line-height:1.35; font-family:Arial,sans-serif;">
        Dear ${custName}, there's an<br>update on your shipment.
      </h2>
      <p style="font-size:13px; color:${MUTED}; line-height:1.7; margin:0 0 18px; font-family:Arial,sans-serif;">
        Here's the latest status of your courier. We'll notify you again
        whenever there's a new update.
      </p>

      ${statusPill(newStatus, AMBER_LT, AMBER_TEXT)}

      ${infoBlock(trackingNumber, invoiceRef, partner, newStatus, AMBER_TEXT)}

      <p style="font-size:12px; color:${MUTED}; line-height:1.7; text-align:center; margin:0; font-family:Arial,sans-serif;">
        Any concerns about your shipment?
        <a href="mailto:sales@ryanlabenterprises.com" style="color:#2563b0; text-decoration:none;">Reach out to us</a>
        and we'll sort it out right away.
      </p>
    </div>

    ${footer()}
  `;
  return wrapper(content);
}

// ── Template 3 — Delivered ────────────────────────────────────────────
export function deliveredEmail(
  custName: string,
  trackingNumber: string,
  invoiceRef: string,
  partner: string,
  feedbackUrl: string = 'https://forms.gle/bgLFs8B43eUcC8ao7',
): string {
  const content = `
    ${header('Delivered successfully', 'rgba(22,163,74,0.25)', '#dcfce7')}

    ${illustration("cid:delivered", GREEN_LT)}

    <div style="padding:12px 28px 24px;">
      <h2 style="font-size:18px; font-weight:500; color:${TEXT}; margin:0 0 8px; line-height:1.35; font-family:Arial,sans-serif;">
        Dear ${custName}, your order<br>has been delivered!
      </h2>
      <p style="font-size:13px; color:${MUTED}; line-height:1.7; margin:0 0 18px; font-family:Arial,sans-serif;">
        Thank you for trusting Ryan Lab Enterprises. We hope you're happy with
        your order. If anything's not right, we're here for you within 7 days.
      </p>

      ${statusPill('Delivered successfully', GREEN_LT, GREEN_TEXT)}

      ${infoBlock(trackingNumber, invoiceRef, partner, 'Delivered', GREEN_TEXT)}

      <div style="margin-bottom:18px;">
        <a href="${feedbackUrl}"
          style="display:block; text-align:center; padding:12px; border-radius:9px; font-size:14px; font-weight:500; color:#ffffff; background:${NAVY}; text-decoration:none; font-family:Arial,sans-serif;">
          Leave us feedback
        </a>
      </div>

      <p style="font-size:12px; color:${MUTED}; line-height:1.7; text-align:center; margin:0; font-family:Arial,sans-serif;">
        Issue with your order?
        <a href="mailto:sales@ryanlabenterprises.com" style="color:#2563b0; text-decoration:none;">Contact us within 7 days</a>
        of delivery and we'll make it right.
      </p>
    </div>

    ${footer()}
  `;
  return wrapper(content);
}