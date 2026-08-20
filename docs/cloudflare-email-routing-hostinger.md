# Cloudflare Email Routing — Hostinger domain

Last updated: 2026-08-20  
Domain: `brieflynewsstream.com`  
Goal: free `hello@brieflynewsstream.com` that forwards to your personal Gmail/Outlook

---

## Short answer

**Yes.** Keep the domain **registered** at Hostinger. Move **DNS management** to Cloudflare (change nameservers). Then enable Cloudflare Email Routing.

You do **not** need to transfer the domain away from Hostinger for this.

| Stays at Hostinger | Moves to Cloudflare |
| --- | --- |
| Domain registration / renewal / payment | DNS records (A, CNAME, TXT, MX) |
| | Email Routing (free forward) |

---

## What you get (free)

- Addresses like `hello@brieflynewsstream.com`
- Incoming mail **forwards** to Gmail / Outlook / any destination inbox
- No paid mailbox on Cloudflare
- Site can still run on **Vercel** (you re-add Vercel DNS records in Cloudflare)

What you do **not** get:

- A Cloudflare-hosted inbox UI (mail lives in Gmail/Outlook after forward)
- Automatic “Reply as hello@…” unless you set Gmail **Send mail as** (optional, below)

---

## Before you start — checklist

1. Cloudflare account: [https://dash.cloudflare.com](https://dash.cloudflare.com) (free plan is enough)
2. Access to Hostinger (domain → nameservers)
3. Access to Vercel (domain / DNS values for the website)
4. Destination inbox ready (e.g. your personal Gmail)
5. **Export / screenshot** current Hostinger DNS records first (so nothing is lost)

Especially note any existing:

- Root / `www` records for the website
- `TXT` for verification / SPF
- Any existing `MX` (old email)

---

## Step 1 — Add the domain to Cloudflare

1. Cloudflare Dashboard → **Add a site**
2. Enter `brieflynewsstream.com`
3. Choose the **Free** plan
4. Cloudflare will scan existing DNS — review the list
5. Cloudflare shows two **nameservers**, for example:

   ```text
   ada.ns.cloudflare.com
   bob.ns.cloudflare.com
   ```

   (Yours will be different — copy the ones Cloudflare shows you.)

Do **not** change Hostinger nameservers yet. Finish Step 2 first so the site DNS is ready in Cloudflare.

---

## Step 2 — Put website DNS in Cloudflare (Vercel)

If the site is (or will be) on Vercel:

1. Vercel → Project → **Settings** → **Domains**
2. Add `brieflynewsstream.com` and `www.brieflynewsstream.com` if not already added
3. Copy the DNS targets Vercel shows (usually something like):

   | Type | Name | Value (example — use Vercel’s exact value) |
   | --- | --- | --- |
   | `A` | `@` | `76.76.21.21` (or current Vercel IP) |
   | `CNAME` | `www` | `cname.vercel-dns.com` |

4. In Cloudflare → **DNS** → **Records**, add those exact records
5. Recommended for Vercel on Cloudflare:
   - Orange cloud (Proxied) often works for the apex/www
   - If the site fails after cutover, set the Vercel records to **DNS only** (grey cloud) and retest

Also re-add any other needed TXT records later (Supabase, Google Search Console, Resend, etc.).

---

## Step 3 — Point Hostinger nameservers to Cloudflare

1. Hostinger → **Domains** → `brieflynewsstream.com` → **DNS / Nameservers**
2. Change from Hostinger default nameservers to the **two Cloudflare nameservers**
3. Save
4. Wait for propagation (often 15 minutes–a few hours; can take up to 24–48h)

In Cloudflare, the domain status should move to **Active**.

Until Active:

- Site may still use old Hostinger DNS
- Do not delete Hostinger DNS early if you can avoid it; after nameservers flip, Hostinger DNS is ignored

---

## Step 4 — Enable Cloudflare Email Routing

1. Cloudflare → domain → **Email** → **Email Routing**
2. Click **Get started** / **Enable Email Routing**
3. Cloudflare will add the required **MX** + **TXT** (SPF) records automatically — confirm them
4. Add a **destination address** (your personal Gmail) and **verify** it (Cloudflare sends a confirmation link)
5. Create a custom address:

   | Custom address | Action | Destination |
   | --- | --- | --- |
   | `hello@brieflynewsstream.com` | Send to | your Gmail |
   | (optional) `admin@…` | Send to | same or another inbox |

6. Optional: enable **Catch-all** → forward unknown `*@brieflynewsstream.com` to Gmail (handy, but expect more spam)

---

## Step 5 — Test

1. From a **different** email account (not the destination Gmail), send to `hello@brieflynewsstream.com`
2. Confirm it arrives in Gmail (check spam once)
3. Open the site `https://brieflynewsstream.com` and confirm it still loads on Vercel

If mail works but the site does not: fix Vercel A/CNAME records in Cloudflare DNS first.

---

## Optional — Reply as `hello@…` from Gmail

Forwarding alone means replies may show your personal Gmail address. To send **from** `hello@brieflynewsstream.com`:

### Option A — Gmail “Send mail as” (common)

1. Gmail → **Settings** → **Accounts and Import** → **Send mail as** → **Add another email address**
2. Use `hello@brieflynewsstream.com`
3. Gmail will ask for SMTP. Cloudflare Email Routing is **receive/forward only** — it does **not** provide SMTP send.

So you need a free/cheap SMTP sender for outbound, for example:

- **Resend** (verify domain, use their SMTP/API), or
- **Google Workspace** (paid, full mailbox), or
- Another SMTP provider that supports your domain

Practical pattern many teams use:

- **Inbound:** Cloudflare Email Routing → Gmail  
- **Outbound branded:** Resend SMTP / API as `hello@` or `noreply@`

### Option B — Just reply from Gmail

Fine for early stage. Recipients see your personal address unless you set Option A.

---

## Important rules (avoid breakage)

1. **Only one mail system on the root domain MX.**  
   Cloudflare Email Routing owns MX after enable. Do not also point root MX at Resend, Zoho, Google Workspace, etc. at the same time.

2. **Resend for app sending is OK** if you only add Resend **SPF/DKIM TXT** (and maybe a subdomain for inbound later). Do **not** replace Cloudflare’s root MX with Resend receiving MX if you want Cloudflare forwarding.

3. **Domain stay at Hostinger is fine.** You only changed nameservers.

4. **SSL / site:** still handled by Vercel after DNS points there.

---

## Minimal record picture (after setup)

Conceptual — exact values come from Cloudflare + Vercel:

```text
# Website (Vercel)
A      @      → Vercel IP          (Proxy optional)
CNAME  www    → cname.vercel-dns.com

# Email Routing (Cloudflare auto-adds)
MX     @      → Cloudflare Email Routing hosts
TXT    @      → v=spf1 include:_spf.mx.cloudflare.net ...

# Optional later
TXT    @ or resend._domainkey → Resend DKIM / SPF includes for sending
```

---

## Troubleshooting

| Problem | Likely fix |
| --- | --- |
| Cloudflare domain stuck on “Pending” | Nameservers not updated at Hostinger, or still propagating |
| Site down after nameserver change | Missing/wrong Vercel A/CNAME in Cloudflare DNS |
| Mail not arriving | Destination not verified; Email Routing disabled; old MX still conflicting; wait for DNS TTL |
| Mail in spam | Add DMARC later (`TXT` `_dmarc`); ask contacts to mark Not spam |
| Want full inbox (folders, calendar, mobile app as the mailbox) | Cloudflare Routing is not enough — use Google Workspace / Zozo / Microsoft 365 instead |

---

## Recommended order for Briefly NewsStream

1. Screenshot Hostinger DNS  
2. Add domain to Cloudflare (Free)  
3. Add Vercel DNS records in Cloudflare  
4. Switch Hostinger nameservers → Cloudflare  
5. Wait until Cloudflare = **Active**  
6. Enable Email Routing → `hello@brieflynewsstream.com` → your Gmail  
7. Send a test message  
8. (Later) Add Resend only if the app needs branded outbound mail  

Contact CTAs on the site already use `hello@brieflynewsstream.com` — this is the free path to make that address real.
