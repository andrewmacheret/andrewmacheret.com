#!/bin/bash -e

echo '  access_key_id:'
awk '$1 == "aws_access_key_id" {print $3}' ~/.aws/credentials | travis encrypt access_key_id | sed 's/^/    secure: /'

echo '  secret_access_key:'
awk '$1 == "aws_secret_access_key" {print $3}' ~/.aws/credentials | travis encrypt secret_access_key | sed 's/^/    secure: /'
