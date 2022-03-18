#!/usr/bin/env bash
ls dist/esm/*.js | xargs sed -i .bak 's/^\(..port .* from .\..*\)\(.;\)$/\1.js\2/'
rm -rf dist/esm/*.bak
