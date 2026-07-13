# Hello Home Buyers — Static Website

A plain HTML/CSS/JS static website (no build step, no backend) for a North Carolina
real estate acquisitions/wholesaling business. Open `index.html` directly in a
browser, or deploy the folder as-is to any static host.

## Pages

- `index.html` — Home
- `about.html` — About Us
- `how-it-works.html` — How It Works
- `reviews.html` — Seller Reviews (reads `data/reviews.json`)
- `leave-a-review.html` — Leave a Review form
- `request-an-offer.html` — Request an Offer lead form
- `faq.html` — FAQ accordion
- `contact.html` — Contact page + form
- `privacy-policy.html`, `terms-of-use.html`, `disclosure.html` — legal pages (drafts)
- `404.html` — not found page

## Before Going Live: Required Placeholders

Search the codebase for `[` to find bracketed placeholders, or update these:

- **Business name** — currently set to "Hello Home Buyers" as the display/trading
  name throughout. Confirm this is correct, or find-and-replace it.
- **Legal business name / NC registration details** — `about.html`
- **Phone number** — footer on every page, `contact.html`
- **Email address** — footer on every page, `contact.html`, `privacy-policy.html`
- **Business hours** — `contact.html`
- **Domain name** — `robots.txt`, `sitemap.xml` (`[YOUR-DOMAIN]`)
- **Formspree form IDs** — `leave-a-review.html`, `request-an-offer.html`,
  `contact.html` (see "Forms" below)
- **Attorney review** — `privacy-policy.html`, `terms-of-use.html`,
  `disclosure.html` are practical drafts, not reviewed legal documents. Have a
  North Carolina attorney review before launch.
- **Staff details** — `about.html` currently only lists first names (Lewis, Matt)
  and their roles, per instructions not to invent surnames/bios/photos.

## Forms (no backend — uses Formspree)

Since this is a static site with no server, the three forms (`leave-a-review.html`,
`request-an-offer.html`, `contact.html`) post to placeholder Formspree endpoints:

```
https://formspree.io/f/YOUR_FORM_ID
```

To connect them:

1. Create a free account at [formspree.io](https://formspree.io).
2. Create one form per page (or reuse one form for all three).
3. Replace `YOUR_FORM_ID` in each form's `action` attribute with your real form ID.
4. Formspree will email you each submission. You still need to manually decide
   whether to publish a review (see below) — there is no automated moderation
   queue since there's no database.

Each form includes a hidden honeypot field for basic spam filtering. Formspree
also offers built-in reCAPTCHA support if you want stronger spam protection —
enable it from your Formspree form settings.

## Managing Reviews (no database)

Reviews are stored in `data/reviews.json` and rendered client-side by
`js/main.js` on `reviews.html`. There is intentionally **no fake/example data**
in this file — it starts as an empty array (`[]`).

When a real seller submits a review (via the Leave a Review form → your email),
and you've decided to publish it:

1. Open `data/reviews.json`.
2. Add an object in this shape:

```json
{
  "id": "r1",
  "firstName": "Jane",
  "lastInitial": "D",
  "city": "Durham",
  "county": "Durham County",
  "propertyType": "Single-family house",
  "rating": 5,
  "reviewText": "The written review text.",
  "closingMonthYear": "March 2026",
  "verified": true,
  "status": "published",
  "response": {
    "text": "Optional public response from the company.",
    "responder": "Hello Home Buyers Team"
  }
}
```

3. Only set `"status": "published"` once you've moderated it, and only set
   `"verified": true` once you've confirmed it against a real transaction
   (e.g. matching the closing date/address from your own records).
4. Never copy the reviewer's full name, phone, email, or property address into
   this file — only first name + last initial, per the privacy policy.
5. Redeploy/republish the site (or just re-upload this one file, depending on
   your host).

## Deployment (GitHub + Render)

This repo includes a `render.yaml` blueprint, so Render can deploy it with no
manual configuration:

1. Push this repo to GitHub (see below).
2. In the Render dashboard, click **New +** → **Blueprint**, and select this
   GitHub repo. Render will read `render.yaml` and create a Static Site
   service automatically (no build command, publish directory is the repo root).
3. Alternatively, skip the blueprint and create the static site manually:
   **New +** → **Static Site** → select the repo → leave **Build Command**
   blank → set **Publish Directory** to `.`.
4. Once deployed, Render gives you a `*.onrender.com` URL. You can attach a
   custom domain from the service's **Settings** tab.

Every push to the connected branch will auto-redeploy.

No build step, `npm install`, or server process is required — this is plain
HTML/CSS/JS.

## What's Intentionally Not Included

Per the brief this site is based on, the following were deliberately left out
because they require a real backend/database (which conflicts with "static
site, no app"):

- Admin dashboard / login
- Automated review moderation queue
- Lead database / CRM
- Server-side validation, rate limiting, CSRF protection

If you later want automated review moderation or a lead pipeline, that would
require adding a backend (e.g., a small serverless API + database), which is a
separate, larger project from this static site.
