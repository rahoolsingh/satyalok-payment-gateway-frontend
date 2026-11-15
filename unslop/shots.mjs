import { chromium } from "playwright";

const BASE = "http://localhost:4173";
const tag = process.argv[2] || "before";

const PLANS = {
  plans: [
    { id: "monthly_500", amount: 500, frequency: "MONTHLY", label: "500 / month", title: "Sponsor a child's education", impact: "1 child supported every month" },
    { id: "monthly_1000", amount: 1000, frequency: "MONTHLY", label: "1,000 / month", title: "Fund a study centre day", impact: "2 children supported every month" },
    { id: "monthly_2500", amount: 2500, frequency: "MONTHLY", label: "2,500 / month", title: "Sustain a mentor", impact: "5 children supported every month" },
  ],
  rules: { currency: "INR", minAmount: 100, maxAmount: 10000, consentVersion: "2026-11-v1", termsUrl: "/terms", privacyUrl: "/privacy", grievanceEmail: "support@satyalok.in" },
};

const STATUS = {
  data: {
    pledgeRef: "PLG-8F3K2A", status: "PENDING_AUTH", amount: 500, currency: "INR",
    frequency: "MONTHLY", nextDebitAt: "2026-12-15T04:30:00.000Z",
    maskedInstrument: "ve****@okhdfcbank", cyclesCompleted: 0, donorFirstName: "Veer",
  },
};

const PORTAL = {
  data: {
    pledge: {
      pledgeRef: "PLG-8F3K2A", status: "ACTIVE", amount: 500, currency: "INR", frequency: "MONTHLY",
      startedAt: "2026-08-15T04:30:00.000Z", nextDebitAt: "2026-12-15T04:30:00.000Z",
      expiresAt: "2031-08-15T04:30:00.000Z", cyclesCompleted: 3, totalDonated: 1500,
      consecutiveFailures: 0, maskedInstrument: "ve****@okhdfcbank",
      donor: { name: "Veer Singh", phone: "98******01", taxBenefit: true, panMasked: "XXXXXX234F" },
      consent: { version: "2026-11-v1", acceptedAt: "2026-08-15T04:30:00.000Z" },
    },
    debits: [
      { cycleNumber: 3, attempt: 1, amount: 500, scheduledFor: "2026-11-15T04:30:00.000Z", status: "SUCCESS", maskedInstrument: "ve****@okhdfcbank", utr: "402311998877", receiptAvailable: true },
      { cycleNumber: 2, attempt: 1, amount: 500, scheduledFor: "2026-10-15T04:30:00.000Z", status: "SUCCESS", receiptAvailable: true },
      { cycleNumber: 1, attempt: 1, amount: 500, scheduledFor: "2026-09-15T04:30:00.000Z", status: "SUCCESS", receiptAvailable: true },
    ],
    donations: [
      { transactionId: "HOPER-8KQ2WD-c0003-a01", amount: 500, donatedAt: "2026-11-15T04:30:00.000Z", certificate: true },
      { transactionId: "HOPER-8KQ2WD-c0002-a01", amount: 500, donatedAt: "2026-10-15T04:30:00.000Z", certificate: true },
    ],
  },
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });

await page.route("**/undefined/pledge/plans", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PLANS) }));
await page.route("**/undefined/pledge/manage/**", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(PORTAL) }));
await page.route("**/undefined/pledge/PLG-*/status", (r) => r.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STATUS) }));

const shots = [
  ["/pledge", "pledge"],
  ["/pledge/status?ref=PLG-8F3K2A", "status"],
  ["/pledge/manage/demo-token", "portal"],
];

for (const [path, name] of shots) {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `unslop/${tag}-${name}.png`, fullPage: true });
  console.log("shot", tag, name);
}

await browser.close();
