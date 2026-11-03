const norm = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
export function evaluate(job) {
  const title = norm(job.title), description = norm(job.description), city = norm(job.city), mode = norm(job.mode);
  const alerts = [], reasons = [], exclusions = [];
  const area = /product owner|product manager|product operations|product ops|\bpo\b|\bpm\b|produto|projetos|processos/.test(title);
  if (area) reasons.push('Cargo na área desejada'); else alerts.push('Cargo fora das áreas prioritárias');
  if (/estagi|internship/.test(title)) exclusions.push('Estágio não faz parte da busca');
  if (/senior|\bsr\b|pleno|gerente|head|diretor|coordenador/.test(title)) alerts.push('Senioridade acima do foco de entrada: avaliar requisitos');
  if (/junior|\bjr\b|assistente|auxiliar|entrada/.test(title)) reasons.push('Nível de entrada identificado');
  if (/graduacao completa|superior completo|bacharelado completo|diploma obrigatorio/.test(description)) alerts.push('Anúncio menciona graduação completa: você conclui em 2027. Confirme se é obrigatória ou desejável');
  if (/cursando|em andamento|superior incompleto/.test(description)) reasons.push('Graduação em andamento mencionada');
  const years = [...description.matchAll(/(?:minimo de\s*|pelo menos\s*|mais de\s*)?(\d+)\s*(?:\+\s*)?anos?\s*(?:de\s*)?(?:experiencia|atuacao)/g)].map(m => Number(m[1]));
  if (years.length) alerts.push(`Experiência anunciada: ${Math.max(...years)} ano(s). Conferir experiência específica; atuação prática como PO/PM não equivale a esse tempo em cargo formal`);
  const skills = ['jira','kanban','trello','figma','sql','javascript','apis','onboarding','documentacao','processos','stakeholders'];
  const matches = skills.filter(skill => description.includes(skill));
  if (matches.length) reasons.push(`Conhecimentos em comum: ${matches.join(', ')}`);
  if (mode === 'remoto') {
    if (/brasil|brazil/.test(city)) reasons.push('Remoto no Brasil');
    else alerts.push('Confirmar se o trabalho remoto aceita residentes no Brasil');
  } else {
    // Match a city field, not a substring (e.g. Franca must not match Franco).
    const location = city.trim().replace(/\s*(?:[,/–-]\s*sp|\(sp\))\s*$/, '').trim();
    const regionalCities = ['franca', 'ribeirao preto', 'campinas', 'araraquara'];
    if (mode === 'hibrido' && [...regionalCities, 'sao paulo'].includes(location)) reasons.push('Híbrido em cidade desejada');
    else if (mode === 'presencial' && regionalCities.includes(location)) reasons.push('Presencial em cidade desejada');
    else alerts.push('Confirmar cidade e deslocamento: alcance aproximado até Campinas; outras cidades dependem de avaliação');
  }
  const salary = job.salary === '' || job.salary == null ? null : Number(job.salary);
  if (salary === null) alerts.push('Salário não divulgado');
  else if (!Number.isFinite(salary) || salary <= 0) alerts.push('Salário inválido: informe valor mensal em reais');
  else if (salary < 3500) exclusions.push('Salário mensal abaixo de R$ 3.500');
  else reasons.push('Salário mensal atende ao mínimo');
  if (!['CLT','PJ'].includes(job.contract)) alerts.push('Tipo de contratação não informado');
  return {status: exclusions.length ? 'Fora dos critérios' : !area || alerts.length ? 'Revisar' : 'Prioritária', reasons, alerts, exclusions};
}
