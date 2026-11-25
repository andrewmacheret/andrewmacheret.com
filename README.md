# andrewmacheret.com

[![Deploy](https://github.com/andrewmacheret/andrewmacheret.com/actions/workflows/deploy.yml/badge.svg)](https://github.com/andrewmacheret/andrewmacheret.com/actions/workflows/deploy.yml) [![Canary](https://github.com/andrewmacheret/andrewmacheret.com/actions/workflows/canary.yml/badge.svg)](https://github.com/andrewmacheret/andrewmacheret.com/actions/workflows/canary.yml) [![License](https://img.shields.io/badge/license-MIT-lightgray.svg)](https://github.com/andrewmacheret/andrewmacheret.com/blob/master/LICENSE.md)

[My personal website.](https://andrewmacheret.com)

Plain static files in `www/`. Pushing to `master` syncs them to the `andrewmacheret.com` S3 bucket and invalidates CloudFront.

## Shared project styles

`www/projects.css` is the shared look for the project pages (cube, Monty Hall, NHL, raytracer, colorblind, text-to-speech, sprite-sandbox, map-game, no-drone-zones, vta-tracker). Each page loads it from `https://andrewmacheret.com/projects.css` before its own CSS, so it works the same on localhost and in production. That also means local dev always gets the deployed copy. Deploy this repo before a project that starts using a new class from it, and check a few projects after changing it, since they all pick up the change within about 5 minutes.

## Health checks

`www/healthcheck.js` runs the health check pages for this site and every project. A project's `www/healthcheck/index.html` loads it from `https://andrewmacheret.com/healthcheck.js` and lists what to check. The top of the file explains the options. This site's own page is [`/healthcheck/`](https://andrewmacheret.com/healthcheck/). It checks the home page and everything it loads, the resume, the sitemap, the shared project styles and Google Analytics.

[andrewmacheret/canary](https://github.com/andrewmacheret/canary) starts each project's Canary workflow once a day, which opens its health check page and fails if anything is broken. Health check pages skip `analytics.js` so the canary doesn't count as a visit, and use `noindex` so search engines skip them.

## Resume

`resume.pdf` isn't in git. Each deploy downloads it from the [Google Doc](https://docs.google.com/document/d/1Kyydz3vJ1sYyvfwZWNPxarSqZHmeRYpszG_mF5fqH5o/edit), and a daily scheduled run picks up edits. To publish right away, click "Run workflow" on the [Deploy workflow](https://github.com/andrewmacheret/andrewmacheret.com/actions/workflows/deploy.yml).

`/resume` (and anything else starting with `resume` that doesn't exist) redirects to `/resume.pdf`. That's a routing rule in the bucket's static website settings, not a file here.
