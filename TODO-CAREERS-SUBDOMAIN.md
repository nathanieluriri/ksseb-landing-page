# Later: point a careers subdomain at hiring-desk

Do this when you have DNS control. Until then, the same-domain pages on
`https://home.kgsseb.kogistate.gov.ng/` are the live careers site:

- `/` homepage + embedded job list
- `/jobs/` full listing
- `/job/?id=…` job details + apply
- `/portal/` candidate login
- `/portal/home/` applications / profile

## When you get the subdomain

Suggested host: `careers.kgsseb.kogistate.gov.ng`

1. In the DNS panel for `kogistate.gov.ng` (or whoever holds KGSSEB DNS), add:

   ```
   Type: CNAME
   Name: careers
   Target: hiring-desk.uririnathaniel.workers.dev
   ```

   If CNAME on that name is not allowed, use an A/AAAA record only after
   Cloudflare shows the worker custom-domain IPs.

2. In Cloudflare (hiring-desk account):
   - Workers & Pages → hiring-desk → Settings → Domains & Routes
   - Add custom domain `careers.kgsseb.kogistate.gov.ng`
   - Wait for the certificate to become Active

3. In hiring-desk env vars / wrangler:
   - Set `APP_ORIGIN` and `APP_URL` to `https://careers.kgsseb.kogistate.gov.ng`
   - Redeploy so sitemap, JobPosting JSON-LD, and apply links use the new host

4. On the homepage (`home.kgsseb.kogistate.gov.ng`):
   - Change “Open the full careers site” and `data-careers-base` to the subdomain
   - Or keep `/jobs/` on the homepage domain and treat the subdomain as the
     long-term SEO host

5. Check:
   - `https://careers.kgsseb.kogistate.gov.ng/w/6af8b26302b535a26e0c9b55`
   - HTTPS padlock
   - `/sitemap.xml` lists job URLs on the new host
   - Apply + portal still work

Do not delete the `/jobs/` pages on the homepage until the subdomain has been
live for a bit. You can then 301 `/jobs/` → the subdomain if you want one
canonical host.
