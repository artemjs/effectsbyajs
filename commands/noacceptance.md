---
description: Stop asking — effectsbyajs skills start right away from now on
allowed-tools: Bash(node:*)
---
<!-- SPDX-License-Identifier: MIT · Copyright (c) 2026 Artem Bohdanov -->
!`node -e "const fs=require('fs'),os=require('os'),p=require('path'),d=p.join(os.homedir(),'.effectsbyajs');fs.mkdirSync(d,{recursive:true});fs.writeFileSync(p.join(d,'settings.json'),JSON.stringify({acceptance:'off'})+'\n');console.log('saved: acceptance off')"`

Acceptance is now off for effectsbyajs (saved in ~/.effectsbyajs/settings.json): its skills start working without
proposing a plan first. Tell the user in one line, and that `/effectsbyajs:acceptance` turns it back on.
If a plan was waiting for acceptance, start it now.
