const sports=[['Badminton','badminton.html'],['Futsal','futsal.html'],['Chess','chess.html'],['Table Tennis','table-tennis.html'],['Football','football.html'],['Fishing','fishing.html']];
export function shell(active,tabs,render){const nav=document.querySelector('#sports-menu');nav.innerHTML=sports.map(([name,url])=>`<a ${name===active?'class="active" aria-current="page"':''} href="${url}">${name}</a>`).join('');const tabbar=document.querySelector('.view-tabs');tabbar.innerHTML=tabs.map((t,i)=>`<button type="button" data-view="${t.id}" ${i?'':'class="active"'}>${t.label}</button>`).join('');const toggle=document.querySelector('.sports-menu-toggle');toggle.addEventListener('click',()=>{const open=document.body.classList.toggle('sports-nav-open');toggle.setAttribute('aria-expanded',String(open))});function show(id,push=false){if(!tabs.some(t=>t.id===id))id=tabs[0].id;tabbar.querySelectorAll('button').forEach(b=>{const on=b.dataset.view===id;b.classList.toggle('active',on);b.setAttribute('aria-selected',String(on))});render(id);if(push)history.pushState({view:id},'',`#${id}`);document.body.classList.remove('sports-nav-open')}tabbar.addEventListener('click',e=>{const b=e.target.closest('button[data-view]');if(b)show(b.dataset.view,true)});addEventListener('popstate',()=>show(location.hash.slice(1)));show(location.hash.slice(1)||tabs[0].id)}
export const scheduleView=rows=>`<header class="view-heading"><span>MATCH DAY</span><h1>JADWAL PERTANDINGAN</h1><p>BRIDGESTONE CUP BP 2026</p></header><section class="match-list">${rows.length?rows.map((r,i)=>`<article class="match-row"><div class="match-number">${String(i+1).padStart(2,'0')}</div><time>${r[0]}</time><strong>${r[1]}</strong><b>VS</b><strong>${r[2]}</strong><small>${r[3]}</small></article>`).join(''):'<div class="public-empty-state"><strong>JADWAL BELUM TERSEDIA</strong></div>'}</section>`;
export const standingView=groups=>`<header class="view-heading"><span>LEAGUE TABLE</span><h1>GROUP STANDING</h1><p>BRIDGESTONE CUP BP 2026</p></header><section class="standing-grid">${groups.length?groups.map((g,i)=>`<article class="standing-card"><header><span>0${i+1}</span><h2>GROUP ${i+1}</h2><small>POINTS</small></header>${g.map((t,j)=>`<div><b>${String(j+1).padStart(2,'0')}</b><strong>${t[0]}</strong><span>${t[1]} PTS</span></div>`).join('')}</article>`).join(''):'<div class="public-empty-state"><strong>KLASEMEN BELUM TERSEDIA</strong></div>'}</section>`;
export function bracketView(title,teams,winner='MENUNGGU HASIL'){
 let current=teams.map(x=>({name:x[0],score:x[1]??'—'}));const stages=[];
 while(current.length>1){stages.push(current);current=Array.from({length:Math.ceil(current.length/2)},(_,i)=>({name:i===0&&stages.length?winner:'MENUNGGU HASIL',score:'—'}))}
 stages.push([{name:winner,score:''}]);
 const allLabels=['ROUND OF 16','QUARTER FINAL','SEMI FINAL','GRAND FINAL','CHAMPION'];
 const labels=allLabels.slice(5-Math.min(5,stages.length));
 const startDate=8+(5-labels.length);
 return `<section class="bracket-shell"><header class="view-heading bracket-heading"><span>SINGLE ELIMINATION</span><h1>${title}</h1><p>ROAD TO CHAMPION • BRIDGESTONE CUP BP 2026</p></header><div class="bracket">${stages.slice(-5).map((stage,i)=>{const date=`${startDate+i} DES`;const time=i===labels.length-1?'16.45 WIB':'16.30 WIB';return `<section class="stage" style="--stage:${i}"><h3><em>${String(i+1).padStart(2,'0')}</em>${labels[i]}</h3><div class="stage-matches">${i===labels.length-1?`<div class="champion"><small>CHAMPION</small><strong>${winner}</strong><span>PENGUMUMAN • ${date} • ${time}</span></div>`:Array.from({length:Math.ceil(stage.length/2)},(_,j)=>`<article class="match"><div><strong>${stage[j*2]?.name||'MENUNGGU HASIL'}</strong><b>${stage[j*2]?.score||'—'}</b></div><span>VS</span><div><strong>${stage[j*2+1]?.name||'MENUNGGU HASIL'}</strong><b>${stage[j*2+1]?.score||'—'}</b></div><footer><time datetime="2026-12-${String(startDate+i).padStart(2,'0')}T${time.startsWith('16.45')?'16:45':'16:30'}:00+07:00">${date}</time><b>${time}</b></footer></article>`).join('')}</div></section>`}).join('')}</div></section>`
}

const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'
}[char]));

function matchSchedule(match){
 if(!match.scheduledAt)return '<span>JADWAL MENUNGGU</span>';
 const date=new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',timeZone:'Asia/Jakarta'}).format(new Date(match.scheduledAt)).toUpperCase();
 const time=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Jakarta'}).format(new Date(match.scheduledAt)).replace('.',':');
 return `<time datetime="${escapeHtml(match.scheduledAt)}">${date}</time><b>${time} WIB${match.venue?` &bull; ${escapeHtml(match.venue)}`:''}</b>`;
}

export function apiBracketView(title,bracket){
 if(!bracket?.participants?.length||!bracket?.rounds?.length)return '';
 const participantName=id=>bracket.participants?.find(participant=>participant.id===id)?.name||'MENUNGGU HASIL';
 const matchCard=match=>{
  const home=match.homeParticipant?.name||'MENUNGGU HASIL';
  const away=match.awayParticipant?.name||(match.status==='bye'?'BYE':'MENUNGGU HASIL');
  const homeScore=match.homeScore??'&mdash;';
  const awayScore=match.awayScore??'&mdash;';
  return `<article class="match" data-match-id="${escapeHtml(match.id)}"><div><strong>${escapeHtml(home)}</strong><b>${homeScore}</b></div><span>VS</span><div><strong>${escapeHtml(away)}</strong><b>${awayScore}</b></div><footer>${matchSchedule(match)}</footer></article>`;
 };
 const rounds=bracket.rounds||[];
 const finalRound=rounds.at(-1);
 const openingStages=rounds.slice(0,-1).map((round,index)=>`<section class="stage" style="--stage:${index}"><h3><em>${String(index+1).padStart(2,'0')}</em>${escapeHtml(round.name.toUpperCase())}</h3><div class="stage-matches">${round.matches.map(matchCard).join('')}</div></section>`).join('');
 const final=bracket.rounds.at(-1)?.matches?.[0];
 const champion=participantName(bracket.championParticipantId);
 const runnerUp=final?.status==='completed'?(final.winnerParticipantId===final.homeParticipant?.id?final.awayParticipant?.name:final.homeParticipant?.name):'MENUNGGU HASIL';
 const thirdPlace=participantName(bracket.thirdPlaceParticipantId);
 const thirdNumber=rounds.length;
 const thirdPlaceStage=bracket.thirdPlaceMatch?`<section class="stage third-place-stage" style="--stage:${thirdNumber-1}"><h3><em>${String(thirdNumber).padStart(2,'0')}</em>THIRD PLACE</h3><div class="stage-matches">${matchCard(bracket.thirdPlaceMatch)}</div></section>`:'';
 const finalNumber=thirdNumber+(bracket.thirdPlaceMatch?1:0);
 const finalStage=finalRound?`<section class="stage final-stage" style="--stage:${finalNumber-1}"><h3><em>${String(finalNumber).padStart(2,'0')}</em>${escapeHtml(finalRound.name.toUpperCase())}</h3><div class="stage-matches">${finalRound.matches.map(matchCard).join('')}</div></section>`:'';
 const podiumNumber=finalNumber+1;
 return `<section class="bracket-shell"><header class="view-heading bracket-heading"><span>SINGLE ELIMINATION</span><h1>${escapeHtml(title)}</h1><p>ROAD TO CHAMPION &bull; BRIDGESTONE CUP BP 2026</p></header><div class="bracket api-bracket">${openingStages}${thirdPlaceStage}${finalStage}<section class="stage champion-stage"><h3><em>${String(podiumNumber).padStart(2,'0')}</em>PODIUM</h3><div class="stage-matches"><div class="champion"><small>JUARA 1</small><strong>${escapeHtml(champion)}</strong><span>JUARA 2 &bull; ${escapeHtml(runnerUp)}</span><span>JUARA 3 &bull; ${escapeHtml(thirdPlace)}</span></div></div></section></div></section>`;
}

export function bracketWinnerView(title,bracket){
 const final=bracket?.rounds?.at(-1)?.matches?.[0];
 const champion=bracket?.participants?.find(item=>item.id===bracket.championParticipantId)?.name||'MENUNGGU HASIL';
 let runnerUp='MENUNGGU HASIL';
 if(final?.status==='completed')runnerUp=final.winnerParticipantId===final.homeParticipant?.id?final.awayParticipant?.name:final.homeParticipant?.name;
 const thirdPlace=bracket?.participants?.find(item=>item.id===bracket.thirdPlaceParticipantId)?.name||'MENUNGGU HASIL';
 return `<section class="score-layout"><article class="winner-panel"><h2>${escapeHtml(title)}</h2><div class="ranking-row"><small>JUARA 1</small><strong>${escapeHtml(champion)}</strong><b>01</b></div><div class="ranking-row"><small>JUARA 2</small><strong>${escapeHtml(runnerUp)}</strong><b>02</b></div><div class="ranking-row"><small>JUARA 3</small><strong>${escapeHtml(thirdPlace)}</strong><b>03</b></div></article></section>`;
}
