import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluate} from '../match.js';
const base={title:'Analista de Produto Júnior',description:'Superior cursando. Jira e Kanban.',mode:'remoto',city:'Brasil',salary:3500,contract:'CLT'};
test('prioriza vaga de entrada compatível',()=>assert.equal(evaluate(base).status,'Prioritária'));
test('exclui estágio e salário inferior',()=>{assert.equal(evaluate({...base,title:'Estágio em Produto'}).status,'Fora dos critérios'); assert.equal(evaluate({...base,salary:3499}).status,'Fora dos critérios');});
test('mantém salário não divulgado com alerta',()=>{const r=evaluate({...base,salary:''});assert.equal(r.status,'Revisar');assert.ok(r.alerts.includes('Salário não divulgado'));});
test('destaca graduação completa e experiência específica',()=>{const r=evaluate({...base,description:'Superior completo e 3 anos de experiência como PO'});assert.ok(r.alerts.some(x=>x.includes('graduação completa')));assert.ok(r.alerts.some(x=>x.includes('3 ano')));});
test('remoto no exterior exige confirmação de elegibilidade',()=>assert.equal(evaluate({...base,city:'Estados Unidos'}).status,'Revisar'));
test('cidade próxima não é presumida elegível',()=>assert.equal(evaluate({...base,mode:'presencial',city:'Batatais'}).status,'Revisar'));

test('aceita cidades regionais informadas em híbrido e presencial',()=>{
 for(const city of ['Franca/SP','Ribeirão Preto, SP','Campinas - SP','Araraquara']) {
  for(const mode of ['hibrido','presencial']) assert.equal(evaluate({...base,city,mode}).status,'Prioritária',`${city} ${mode}`);
 }
});
test('São Paulo capital permanece apenas na preferência híbrida',()=>{
 assert.equal(evaluate({...base,mode:'hibrido',city:'São Paulo/SP'}).status,'Prioritária');
 assert.equal(evaluate({...base,mode:'presencial',city:'São Paulo/SP'}).status,'Revisar');
});
test('não confunde nomes parciais com cidades aceitas',()=>{
 for(const city of ['Franca do Norte','Campinas do Sul','Estado de São Paulo']) assert.equal(evaluate({...base,mode:'hibrido',city}).status,'Revisar');
});
