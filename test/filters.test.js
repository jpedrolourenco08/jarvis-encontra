import {test} from 'node:test';
import assert from 'node:assert/strict';
import {isEntryLevel, visibleJobs} from '../public/job-filters.js';

test('filtro inclui títulos de entrada e preserva acentos e abreviações', () => {
  for (const title of ['Analista de Produto Júnior', 'Analista de Projetos Jr.', 'Assistente de Processos', 'Auxiliar de Projetos', 'Product Owner - entrada']) {
    assert.equal(isEntryLevel(title), true, title);
  }
});

test('filtro não promove títulos ambíguos ou níveis altos a entrada', () => {
  for (const title of ['Product Owner', 'Product Manager', 'Analista de Produto', 'Assistente de Projetos Sênior', 'Analista de Produto Júnior/Pleno', 'Especialista de Produto Jr', 'Analista III de Produto', 'Analista II de Projetos']) {
    assert.equal(isEntryLevel(title), false, title);
  }
});

test('mostrar todos recupera anúncios ocultos sem alterar a coleta', () => {
  const jobs = [{title:'Assistente de Produto'}, {title:'Product Owner'}, {title:'Analista de Projetos Pleno'}];
  assert.equal(visibleJobs(jobs).length, 1);
  assert.deepEqual(visibleJobs(jobs, true), jobs);
  assert.equal(jobs.length, 3);
});
