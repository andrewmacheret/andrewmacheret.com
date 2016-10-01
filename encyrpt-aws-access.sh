#!/bin/bash -e

echo '  access_key_id:'
(travis encrypt "$( awk '$1 == "aws_access_key_id" {print $3}' ~/.aws/credentials )" | sed 's/^/    secure: /') 2>&1 | grep -v '^detected repository '

echo '  secret_access_key:'
(travis encrypt "$( awk '$1 == "aws_secret_access_key" {print $3}' ~/.aws/credentials )" | sed 's/^/    secure: /') 2>&1 | grep -v '^detected repository '
