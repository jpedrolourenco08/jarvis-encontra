const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function isEntryLevel(title) {
  const value = normalize(title);
  if (/senior|\bsr\b|pleno|gerente|head|diretor|coordenador|especialista|\blead\b|\b(?:ii|iii|iv)\b/.test(value)) return false;
  return /junior|\bjr\b|assistente|auxiliar|entrada/.test(value);
}

export function visibleJobs(jobs, showAll = false) {
  return showAll ? jobs : jobs.filter(job => isEntryLevel(job.title));
}
