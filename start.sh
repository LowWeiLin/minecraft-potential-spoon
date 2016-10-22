#!/bin/bash

flow
babel src --out-dir=build
node build/bot.js "$@"
