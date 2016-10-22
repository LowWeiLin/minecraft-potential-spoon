
node_modules\flow-bin\flow-win64-v0.33.0\flow.exe && ^
node node_modules\babel-cli\bin\babel.js src --out-dir=build && ^
node build\bot.js %*
