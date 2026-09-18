global.document={readyState:'complete',addEventListener(){},getElementById(){return null}};
global.window={};global.localStorage={getItem(){return null},setItem(){},removeItem(){}};
global.navigator={};
const q=require('./quiz.js');
function run(a,label){Object.keys(q.S.a).forEach(k=>delete q.S.a[k]);Object.assign(q.S.a,a);const c=q.calc();
console.log(label,'|',c.scope.kind,c.scope.n.join('-'),'|',c.platform,'| rate',c.rate,'|',c.lo.toLocaleString('ru'),'-',c.hi.toLocaleString('ru'),'| от',c.weeks,'нед | alt',c.altLo.toLocaleString('ru'),'-',c.altHi.toLocaleString('ru'));}
// контроль: завод, 12 страниц (8-15 услуг -> 10-18), Тильда
run({q_task:'a',q_scale_a:'s3',q_source:'seo',q_features:[],q_rhythm:'rare',q_industry:'industrial',q_company:'o100',q_assets:'nothing'},'завод 8-15 услуг ');
run({q_task:'a',q_scale_a:'s1',q_source:'ads',q_features:[],q_rhythm:'often',q_industry:'services',q_company:'ip',q_assets:'nothing'},'ИП лендинг       ');
run({q_task:'a',q_scale_a:'s1',q_source:'ads',q_features:['calc'],q_rhythm:'rare',q_industry:'realty',q_company:'u100',q_assets:'mockups'},'недвижка+кальк-20%');
run({q_task:'b',q_scale_b:'s4',q_features:['catalog','onec','pay'],q_rhythm:'rare',q_industry:'ecom',q_company:'o100',q_assets:'nothing'},'магазин 5000+ 1С ');
run({q_task:'c',q_scale_c:['about','team','cases','services','news','contacts'],q_features:['none'],q_rhythm:'often',q_industry:'finance',q_company:'u100',q_assets:'nothing'},'банк имидж       ');
run({q_task:'a',q_scale_a:'s2',q_source:'seo',q_features:['anim'],q_rhythm:'rare',q_industry:'it',q_company:'u20',q_assets:'nothing'},'IT + анимации    ');
run({q_task:'a',q_scale_a:'s4',q_source:'seo',q_features:['multilang'],q_rhythm:'rare',q_industry:'industrial',q_company:'holding',q_assets:'nothing'},'холдинг 15+ мультияз');
// проверка очереди
Object.keys(q.S.a).forEach(k=>delete q.S.a[k]);Object.assign(q.S.a,{q_task:'e',q_task2:'b'});
console.log('очередь E:',q.queue().join(' > '),'| шагов',q.queue().length);
Object.assign(q.S.a,{q_task:'a'});console.log('очередь A:',q.queue().length,'шагов');
