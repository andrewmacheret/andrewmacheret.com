#!/usr/bin/env python3
"""Build sitemap.xml from the links on the home page.

Every page we want Google to find is linked from www/index.html,
so adding a project there also adds it to the sitemap.

Usage: python3 scripts/sitemap.py > www/sitemap.xml
"""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urldefrag, urljoin, urlparse

SITE = 'https://andrewmacheret.com/'
DOMAIN = urlparse(SITE).netloc
HOME = Path(__file__).resolve().parent.parent / 'www' / 'index.html'


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.urls = [SITE]

    def handle_starttag(self, tag, attrs):
        href = dict(attrs).get('href')
        if tag != 'a' or not href:
            return
        url = urldefrag(urljoin(SITE, href)).url
        # this site and its subdomains like pun., not github or mailto
        host = urlparse(url).netloc
        if host == DOMAIN or host.endswith('.' + DOMAIN):
            if url not in self.urls:
                self.urls.append(url)


parser = LinkParser()
parser.feed(HOME.read_text())

print('<?xml version="1.0" encoding="UTF-8"?>')
print('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
for url in parser.urls:
    print(f'  <url><loc>{url}</loc></url>')
print('</urlset>')
