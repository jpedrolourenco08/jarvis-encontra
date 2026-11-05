import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isGupyPage} from '../automation/inspect.js';

test('inspeção aceita somente páginas HTTPS da Gupy',()=>{
  for(const url of ['https://login.gupy.io/','https://empresa.gupy.io/jobs/123','https://gupy.io/'])assert.equal(isGupyPage(url),true);
  for(const url of ['http://login.gupy.io/','https://gupy.io.evil.example/','https://evil.example/','https://user:password@login.gupy.io/','javascript:alert(1)','invalid'])assert.equal(isGupyPage(url),false);
});
