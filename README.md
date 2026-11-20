# andrewmacheret.com

[![Deploy](https://github.com/andrewmacheret/andrewmacheret.com/actions/workflows/deploy.yml/badge.svg)](https://github.com/andrewmacheret/andrewmacheret.com/actions/workflows/deploy.yml) [![License](https://img.shields.io/badge/license-MIT-lightgray.svg)](https://github.com/andrewmacheret/andrewmacheret.com/blob/master/LICENSE.md)

[My personal website.](https://andrewmacheret.com)

Plain static files in `www/`. Pushing to `master` syncs them to the `andrewmacheret.com` S3 bucket and invalidates CloudFront.

## Resume

`resume.pdf` isn't in git. Each deploy downloads it from the [Google Doc](https://docs.google.com/document/d/1Kyydz3vJ1sYyvfwZWNPxarSqZHmeRYpszG_mF5fqH5o/edit), and a daily scheduled run picks up edits. To publish right away, click "Run workflow" on the [Deploy workflow](https://github.com/andrewmacheret/andrewmacheret.com/actions/workflows/deploy.yml).

`/resume` (and anything else starting with `resume` that doesn't exist) redirects to `/resume.pdf`. That's a routing rule in the bucket's static website settings, not a file here.
