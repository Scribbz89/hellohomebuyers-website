require("dotenv").config();

const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const multer = require("multer");
const { Resend } = require("resend");

const app = express();
const resend = new Resend(process.env.RESEND_API_KEY);

const NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || "lewis@hellohomebuyers.net";
const FROM_EMAIL = process.env.FROM_EMAIL || "onboarding@resend.dev";
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGIN || "https://hellohomebuyers-website.onrender.com"
)
  .split(",")
  .map((s) => s.trim());

app.set("trust proxy", 1);
app.use(cors({ origin: ALLOWED_ORIGINS }));

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
app.use("/api/", limiter);

const upload = multer({ limits: { fileSize: 5 * 1024 * 1024 } });

function escapeHtml(str) {
  return String(str).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        c
      ])
  );
}

function fieldsToHtmlTable(fields) {
  const rows = Object.entries(fields)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;">${escapeHtml(
          k
        )}</td><td>${escapeHtml(String(v))}</td></tr>`
    )
    .join("");
  return `<table cellpadding="0" cellspacing="0">${rows}</table>`;
}

async function sendNotification({ subject, fields, replyTo, attachments }) {
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: NOTIFY_EMAIL,
    reply_to: replyTo,
    subject,
    html: fieldsToHtmlTable(fields),
    attachments,
  });

  if (error) {
    throw new Error(
      `Resend API error: ${error.message || JSON.stringify(error)}`
    );
  }
}

app.post("/api/contact", upload.none(), async (req, res) => {
  try {
    const { name, email, phone, message, privacyConsent, company2 } =
      req.body;

    if (company2) return res.json({ ok: true }); // honeypot: pretend success, do nothing

    if (!name || !email || !message || !privacyConsent) {
      return res
        .status(400)
        .json({ ok: false, error: "Please fill in all required fields." });
    }

    await sendNotification({
      subject: `New contact form message from ${name}`,
      fields: { Name: name, Email: email, Phone: phone, Message: message },
      replyTo: email,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("contact form error", err);
    res
      .status(500)
      .json({ ok: false, error: "Something went wrong. Please try again." });
  }
});

app.post("/api/request-offer", upload.none(), async (req, res) => {
  try {
    const body = req.body;

    if (body.website) return res.json({ ok: true }); // honeypot

    if (!body.address || !body.fullName || !body.email || !body.phone) {
      return res
        .status(400)
        .json({ ok: false, error: "Please fill in all required fields." });
    }

    await sendNotification({
      subject: `New offer request: ${body.address}, ${body.city || ""}`,
      fields: body,
      replyTo: body.email,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("request-offer form error", err);
    res
      .status(500)
      .json({ ok: false, error: "Something went wrong. Please try again." });
  }
});

app.post("/api/review", upload.single("photo"), async (req, res) => {
  try {
    const body = req.body;

    if (body.company) return res.json({ ok: true }); // honeypot

    if (!body.firstName || !body.lastName || !body.email || !body.reviewText || !body.rating) {
      return res
        .status(400)
        .json({ ok: false, error: "Please fill in all required fields." });
    }

    const attachments = req.file
      ? [
          {
            filename: req.file.originalname,
            content: req.file.buffer.toString("base64"),
          },
        ]
      : undefined;

    await sendNotification({
      subject: `New review submission from ${body.firstName} ${body.lastName}`,
      fields: body,
      replyTo: body.email,
      attachments,
    });

    res.json({ ok: true });
  } catch (err) {
    console.error("review form error", err);
    res
      .status(500)
      .json({ ok: false, error: "Something went wrong. Please try again." });
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`API listening on port ${PORT}`));
