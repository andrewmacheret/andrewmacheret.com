#!/bin/sh
# Rebuilds www/og.png, the picture shown when the site's link is pasted into a chat.
# Needs Google Chrome. Rename the file (and the og:image tag) after a change,
# because chat apps keep showing the old picture for days.
set -e
cd "$(dirname "$0")/.."
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless \
  --hide-scrollbars \
  --force-device-scale-factor=1 \
  --window-size=1200,630 \
  --virtual-time-budget=5000 \
  --screenshot=www/og.png \
  "file://$PWD/scripts/og.html"
