#!/bin/bash -e

travis encrypt access_key_id="$( awk '$1 == "aws_access_key_id" {print $3}' ~/.aws/credentials )"
travis encrypt secret_access_key="$( awk '$1 == "aws_secret_access_key" {print $3}' ~/.aws/credentials )"
