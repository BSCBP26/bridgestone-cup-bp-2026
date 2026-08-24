import './public-i18n.js?v=20260809-public-i18n';
import { advancedMatches, badmintonSchedule, openingMatches } from './data/badminton-data.js';

const menuButton = document.querySelector('.sports-menu-toggle');
menuButton?.addEventListener('click', () => {
  const open = document.body.classList.toggle('sports-nav-open');
  menuButton.setAttribute('aria-expanded', String(open));
});

const schedule = document.querySelector('#badminton-schedule');
if (schedule) schedule.innerHTML = badmintonSchedule.map(match => `<article class="match-row"><time>${match.time}</time><strong>${match.home}</strong><b>VS</b><strong>${match.away}</strong><small>${match.round}</small></article>`).join('');

const bracket = document.querySelector('#bracket-matches');
if (bracket) {
  const opening = openingMatches.map((team,index) => {
    const side = index < 8 ? 'left' : 'right';
    return `<div class="team-card opening ${side}" style="--slot:${index % 8}"><span>${team[0]}</span><strong>${team[1]}</strong><b>${team[2]}</b></div>`;
  }).join('');
  const advanced = advancedMatches.map(team => `<div class="team-card advanced ${team.side} ${team.round}" style="--slot:${team.slot}"><strong>${team.name}</strong><b>${team.score}</b></div>`).join('');
  bracket.innerHTML = opening + advanced + '<div class="champion-card"><strong>GOLDEN ERA</strong><b>3</b></div>';

  const pairCards = (items, showSeed = false) => items.reduce((cards, item, index) => {
    if (index % 2) return cards;
    const next = items[index + 1];
    return cards + `<article class="mobile-match"><div>${showSeed ? `<small>${item[0]}</small>` : ''}<strong>${showSeed ? item[1] : item.name}</strong><b>${showSeed ? item[2] : item.score}</b></div><span>VS</span><div>${showSeed ? `<small>${next[0]}</small>` : ''}<strong>${showSeed ? next[1] : next.name}</strong><b>${showSeed ? next[2] : next.score}</b></div></article>`;
  }, '');
  const qf = advancedMatches.filter(item => item.round === 'qf');
  const sf = advancedMatches.filter(item => item.round === 'sf');
  const finals = advancedMatches.filter(item => item.round === 'final');
  document.querySelector('.bracket-scroll').insertAdjacentHTML('afterend', `<section class="mobile-bracket clean-bracket" aria-label="Bracket Badminton"><header><p>CLASSIC SERIES &bull; SINGLE ELIMINATION</p><h2>CHAMPIONSHIP BRACKET</h2></header><section class="bracket-stage"><h3>ROUND OF 16</h3>${pairCards(openingMatches,true)}</section><section class="bracket-stage"><h3>QUARTER FINAL</h3>${pairCards(qf)}</section><section class="bracket-stage"><h3>SEMI FINAL</h3>${pairCards(sf)}</section><section class="bracket-stage"><h3>GRAND FINAL</h3>${pairCards(finals)}</section><section class="bracket-stage champion-stage"><h3>CHAMPION</h3><div class="mobile-champion"><small>WINNER</small><strong>GOLDEN ERA</strong><b>3</b></div></section></section>`);
}
