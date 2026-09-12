# Lions Entertainment

Local React + Vite implementation of `Lions_ENT_One_Page_Website_Final_Layout.pdf` (five pages). This document is the approved content and layout blueprint and supersedes the first LionsEvents draft.

## Run locally

```powershell
$env:Path = 'C:\Program Files\nodejs;' + $env:Path
npm run dev
```

`npm run build` creates the production output. `npm run lint` checks the source.

## Supabase authentication

Copy `.env.example` to `.env` and provide both server-side and browser-safe credentials. The secret/service-role key is used only by Node.js. `VITE_SUPABASE_PUBLISHABLE_KEY` is the browser-safe key used by Supabase Auth.

Run `npm run dev` and `npm run dev:api` in separate terminals.

## Automatic database migrations

Create every database change as a new timestamped SQL file under `supabase/migrations`. The GitHub workflow applies pending migrations when they are pushed to `main`.

In GitHub, open **Settings → Secrets and variables → Actions** and add `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_ID`, and `SUPABASE_DB_PASSWORD`. Never commit those values or the Supabase secret/service-role key.

## Approved section order

1. Header: supplied logo; About Us, Services, Portfolio, Contact Us, Portal.
2. Hero: exact approved heading, both paragraphs, Explore Our Services and View Portfolio.
3. About Us: both approved paragraphs, including over 5 years of experience.
4. Our Services: four approved categories and descriptions.
5. Event Planning & Management Solutions: approved headline, introduction, nine solutions, closing paragraph.
6. Our Work: approved introduction and six categories in a three-column desktop grid.
7. Clients & Partners: Trusted By, approved introduction, eight logo spaces.
8. Our Team: approved heading and paragraph, four photo/name/role spaces.
9. Contact Us: approved copy, Phone / WhatsApp, Email, Kigali location, Get in Touch.
10. Footer: approved positioning, four link groups, 2026 copyright.

The current blueprint is one page. Previous draft portfolio routes and brief form were removed. All navigation targets resolve to the corresponding page section. The separate registration/booking platform is not recreated in this site.

## Pending owner content

Update `src/content.js` with the portal URL, phone, WhatsApp, email and social URLs. Client and team arrays intentionally preserve the PDF's eight and four placeholders. Add approved project assets to the six portfolio categories when available.

Until configured, Portal and Get in Touch open an explanatory, keyboard-accessible dialog. They do not send requests or pretend to connect to a live platform. Social labels explicitly say Link pending. No client brands, staff identities, testimonials or project claims were invented.

## Branding and imagery

Both supplied logo files are copied unchanged to `public/brand/`. CSS clips transparent canvas margins without modifying the source image or its aspect ratio. The white logo appears on dark backgrounds and the black logo on the light About Us background.

The previous reference direction is retained: Events Factory's #C41B1B red, #0C0C0C black, white and condensed headings; RCB-inspired decorative layers, using original CSS patterns.

Hero image is illustrative and credited on the page. Source: https://unsplash.com/photos/a-crowd-of-people-sitting-in-front-of-a-stage-8xNAkPut8b4. It is not presented as Lions Entertainment portfolio work. No project samples are substituted for actual work.

Inter and Barlow Condensed use Google Fonts with system fallbacks.

## Verification

The PDF was extracted and all five pages visually inspected. Rendered React text was compared against the PDF's copy. Checks covered ten-section order, four services, nine event solutions, six work categories, eight client spaces, four team profiles, anchor targets, image availability, and SHA-256 equality of the supplied/copied logos. Build and lint are checked separately. Browser visual and interaction testing is unavailable in the current session.

Local only, as requested. No deployment or external submissions.

## Latest owner updates

- Only Instagram (https://www.instagram.com/lions_ent_/) and YouTube (https://www.youtube.com/@golive-r9e) are used. Tracking/query parameters were removed; Facebook and LinkedIn were removed at the owner's request.
- Nine real Flickr album covers are stored locally in public/portfolio. Original titles, image URLs, dimensions and album URLs are recorded in public/portfolio/sources.json. No Flickr credentials or runtime API dependency is needed.
- The portfolio now has six approved category filters plus All Work, six initial album cards, a show-more control, native accessible image dialog, previous/next controls, arrow-key navigation and direct full-album links. Photographs are not represented as website or software projects. Film/AV categories link to the supplied YouTube channel until specific video projects are supplied.
- The hero uses the supplied portfolio's Kigali Twataramye 3rd edition image. The earlier stock imagery is removed.
- The supplied logo files remain unchanged. The display now includes breathing room and explicit proportional dimensions, with larger header/mobile/footer versions and the correct light/dark artwork. A diagnostic rendering confirmed that the original artwork is intact on both backgrounds.
- Get in Touch now links to Instagram. Unconfigured phone/email rows stay hidden until filled in content.js.
- The portal URL and approved client/team details are still missing; no replacements have been invented.
- Build/lint, rendered-content checks, all nine image decodes, social URL checks and local HTTP response were verified. Browser-based visual/interaction testing remains unavailable.
