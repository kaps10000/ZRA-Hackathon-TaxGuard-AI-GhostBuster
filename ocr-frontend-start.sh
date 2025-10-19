#!/bin/bash

if [ ! -d "ocr-frontend" ]; then
    cd ocr-frontend
    pnpm install
fi
cd ocr-frontend
pnpm dev