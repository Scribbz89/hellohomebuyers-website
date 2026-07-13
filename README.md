# Hello Home Buyers — Static Website + Form API

A plain HTML/CSS/JS static website (no build step) for a North Carolina real
estate acquisitions/wholesaling business, plus a small Node API (`server/`)
that receives the three forms and emails you each submission. Open
`index.html` directly in a browser for the static pages, or deploy as
described below.

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
- `server/` — Node/Express API that receives the three forms above and emails
  submissions via Resend (see "Forms" below)

## Before Going Live: Required Placeholders

Search the codebase for `[` to find bracketed placeholders, or update these:

- **Business name** — currently set to "Hello Home Buyers" as the display/trading
  name throughout. Confirm this is correct, or find-and-replace it.
- **Legal business name / NC registration details** — `about.html`
- **Domain name** — `robots.txt`, `sitemap.xml` (`[YOUR-DOMAIN]`)
- **RESEND_API_KEY** — set as a secret environment variable on the
  `hellohomebuyers-api` Render service (see "Forms" below); not committed to
  the repo
- **Attorney review** — `privacy-policy.html`, `terms-of-use.html`,
  `disclosure.html` are practical drafts, not reviewed legal documents. Have a
  North Carolina attorney review before launch.
- **Staff details** — `about.html` currently only lists first names (Lewis, Matt)
  and their roles, per instructions not to invent surnames/bios/photos.

## Forms (in-house API, no third-party form service)

The three forms (`contact.html`, `request-an-offer.html`, `leave-a-review.html`)
submit via JavaScript (see `initApiForms()` in `js/main.js`) to a small
Node/Express API in `server/`, deployed as a separate Render service named
`hellohomebuyers-api` (see `render.yaml`). No Formspree or other third-party
form service is used — submissions never leave infrastructure you control.

How it works:

1. Each form's JS intercepts submit, POSTs the form data (as `FormData`, so
   the optional photo upload on the review form works too) to one of:
   `/api/contact`, `/api/request-offer`, `/api/review`.
2. The API validates required fields, rejects spam caught by the hidden
   honeypot field, and emails you the submission via
   [Resend](https://resend.com)'s free tier (3,000 emails/month).
3. You get an email per submission with all fields laid out in a table, and
   `reply-to` set to the submitter's email so you can just hit reply.
4. There is no database and no admin panel — email is the record. You still
   need to manually decide whether to publish a review (see below).

**Setting it up:**

1. Sign up free at [resend.com](https://resend.com) (use the email address
   you want notifications sent to, or verify your own domain later for more
   flexibility — see the sandbox note below).
2. Grab an API key from the Resend dashboard.
3. Deploy `server/` as a Render **Web Service** — either via the
   `render.yaml` blueprint (**New +** → **Blueprint**, same repo), or
   manually: **New +** → **Web Service** → this repo → **Root Directory**
   `server` → Build Command `npm install` → Start Command `npm start`.
4. If the service was created via the Blueprint, set `RESEND_API_KEY` in its
   **Environment** tab (it's `sync: false` in `render.yaml`, so Render won't
   set it automatically). If it was created manually as a plain **Web
   Service** instead (as this one currently is), `render.yaml`'s env vars
   aren't applied at all — set `RESEND_API_KEY`, `NOTIFY_EMAIL`, `FROM_EMAIL`,
   and `ALLOWED_ORIGIN` directly in that service's Environment tab.
5. Confirm the deployed service's URL matches
   `https://hellohomebuyers-api.onrender.com` (Render assigns this from the
   service name; if it's already taken, Render will suffix it — update the
   `data-api`/`action` URLs in the three form pages to match whatever URL
   Render actually gives you).

**Resend sandbox limitation:** without verifying a sending domain in Resend,
the shared `onboarding@resend.dev` "from" address can only deliver to the
email address your Resend account is registered with. `NOTIFY_EMAIL` is
currently set to `lsleadgeneration@gmail.com` (the Resend account's email)
for that reason. To send to `lewis@hellohomebuyers.net` instead, verify
`hellohomebuyers.net` as a domain in Resend (adds a few DNS records), then
update `NOTIFY_EMAIL` back.

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

`render.yaml` defines **two** Render services as a single blueprint:

- `hello-home-buyers` — the static site (repo root)
- `hellohomebuyers-api` — the form-intake API (`server/` subdirectory)

To deploy both at once:

1. Push this repo to GitHub (see below).
2. In the Render dashboard, click **New +** → **Blueprint**, and select this
   GitHub repo. Render reads `render.yaml` and creates both services.
3. Set `RESEND_API_KEY` on the `hellohomebuyers-api` service (see "Forms"
   above) — it's marked `sync: false` in the blueprint, so Render won't
   create it automatically; you add it manually in that service's
   Environment tab.
4. Each service gets its own `*.onrender.com` URL. You can attach a custom
   domain to either from its **Settings** tab.

Every push to the connected branch auto-redeploys both services.

The static site itself still needs no build step. The API needs Node and
`npm install` (handled automatically by Render per `render.yaml`).

## What's Intentionally Not Included

Per the brief this site is based on, the following were deliberately left out
because they'd require a database, not just a form-intake API:

- Admin dashboard / login
- Automated review moderation queue (moderation is manual — see "Managing
  Reviews" above)
- CRM / lead database (the API just emails you each submission; wiring it
  into an actual CRM instead of/alongside email is a follow-up, once the
  CRM's intake endpoint is known)

The form API does include basic server-side validation, a honeypot spam
field, and rate limiting (20 requests per 15 minutes per IP) — see
`server/index.js`.
