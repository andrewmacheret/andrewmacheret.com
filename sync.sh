#!/bin/sh

aws s3 sync . s3://andrewmacheret.com --acl public-read --exclude ".git*" --exclude "README.md" --exclude "Dockerfile" --exclude "sync.sh"
