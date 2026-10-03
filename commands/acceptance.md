---
description: Turn the effectsbyajs proposal step back on (Claude proposes a plan before starting)
allowed-tools: Bash(node:*)
---
<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
!`node -e "const fs=require('fs'),os=require('os'),p=require('path'),d=p.join(os.homedir(),'.effectsbyajs');fs.mkdirSync(d,{recursive:true});fs.writeFileSync(p.join(d,'settings.json'),JSON.stringify({acceptance:'on'})+'\n');console.log('saved: acceptance on')"`

Acceptance is on again for effectsbyajs: before using its skills, Claude proposes a plan and waits for
`/effectsbyajs:accept` or `/effectsbyajs:deny`. Tell the user in one line.
