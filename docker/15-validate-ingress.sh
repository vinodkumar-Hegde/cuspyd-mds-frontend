#!/bin/sh
set -eu
case "${TRUSTED_INGRESS_CIDR:-}" in
    ''|'*'|*/0|*/00|*/000)
        echo 'Set TRUSTED_INGRESS_CIDR to a specific ingress peer or subnet' >&2
        exit 1
        ;;
esac
