# LionsEvents

Local React + Vite design preview for event photography, videography, websites and software services.

## Development

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run lint`

If npm is not on the PowerShell path, first run:
`$env:Path = 'C:\Program Files\nodejs;' + $env:Path`

## Structure

- `src/App.jsx`: homepage, hash-based portfolio views and project brief form.
- `src/App.css`: responsive layout, design tokens and CSS decorative artwork.
- `#/portfolio/visual`: photography and videography portfolio.
- `#/portfolio/digital`: website and software portfolio.

Main sections stay on one page. Portfolio views currently have honest empty states pending real project content. The form only prepares/copies a brief; it does not send email or save data. Contact integration, approved logo, real work and business details are still to be supplied.

## Visual direction and assets

- Events Factory (https://eventsfactory.rw/): red #C41B1B, black #0C0C0C, white and condensed typography.
- Rwanda Convention Bureau (https://www.rcb.rw/): layered shapes and decorative background direction. The site uses original CSS patterns, not copied RCB illustrations.
- Preview concert photograph: https://unsplash.com/photos/a-crowd-of-people-sitting-in-front-of-a-stage-8xNAkPut8b4
- Preview crowd photograph: https://unsplash.com/@cerencalhan (image photo-1720658758741-6c030830ba75).
- Both photos are downloaded to public/images and are illustrative samples, not LionsEvents client work.
- Barlow Condensed and Inter load from Google Fonts, with local system fallbacks.
- Temporary LionsEvents wordmark is live text; the digital browser illustration is CSS.

Kept local while the design is refined. No hosting is configured.
