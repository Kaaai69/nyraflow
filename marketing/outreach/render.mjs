#!/usr/bin/env node
// Рендер холодной рассылки под конкретную нишу.
// Вход: выгрузка парсера (CSV или JSON). Выход: письма .txt + mailing.csv.
//
//   node marketing/outreach/render.mjs --list
//   node marketing/outreach/render.mjs --niche detailing --preview
//   node marketing/outreach/render.mjs --niche dental --leads leads/dental.csv
//   node marketing/outreach/render.mjs --niche dental --leads leads/dental.csv --followup

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const EMAIL_KEYS = ['email', 'e-mail', 'mail', 'почта', 'емейл', 'емайл', 'адрес почты'];
const COMPANY_KEYS = ['company', 'компания', 'название', 'наименование', 'организация', 'name', 'имя', 'title'];
const CITY_KEYS = ['city', 'город'];
const SITE_KEYS = ['site', 'сайт', 'website', 'url', 'домен'];

const ORG_FORMS = /^(ооо|оао|зао|пао|ао|ип|нко|чоу|ано|тоо)\s+/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-zа-я]{2,}$/i;

function parseArgs(argv) {
  const args = { limit: Infinity };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--list') args.list = true;
    else if (a === '--preview') args.preview = true;
    else if (a === '--followup') args.followup = true;
    else if (a === '--niche') args.niche = argv[++i];
    else if (a === '--leads') args.leads = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--limit') args.limit = Number(argv[++i]);
    else if (a === '--help' || a === '-h') args.help = true;
    else throw new Error(`Неизвестный аргумент: ${a}`);
  }
  return args;
}

function detectDelimiter(line) {
  const counts = [[';', 0], [',', 0], ['\t', 0]];
  let inQuotes = false;
  for (const ch of line) {
    if (ch === '"') inQuotes = !inQuotes;
    if (inQuotes) continue;
    for (const pair of counts) if (ch === pair[0]) pair[1]++;
  }
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : ',';
}

function parseCsv(text) {
  const src = text.replace(/^﻿/, '');
  const firstLine = src.split(/\r?\n/, 1)[0] ?? '';
  const delim = detectDelimiter(firstLine);

  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else field += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === delim) { row.push(field); field = ''; continue; }
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    if (ch === '\r') continue;
    field += ch;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }

  const nonEmpty = rows.filter((r) => r.some((c) => c.trim() !== ''));
  if (!nonEmpty.length) return [];

  const headers = nonEmpty[0].map((h) => h.trim().toLowerCase());
  return nonEmpty.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, idx) => { obj[h] = (r[idx] ?? '').trim(); });
    return obj;
  });
}

function pick(row, keys) {
  for (const key of keys) {
    for (const [k, v] of Object.entries(row)) {
      if (String(k).trim().toLowerCase() === key && String(v ?? '').trim()) return String(v).trim();
    }
  }
  // запасной проход: заголовок содержит ключ («email компании», «e_mail»)
  for (const key of keys) {
    for (const [k, v] of Object.entries(row)) {
      if (String(k).toLowerCase().includes(key) && String(v ?? '').trim()) return String(v).trim();
    }
  }
  return '';
}

// «ООО "Дентал-Сити"» → «Дентал-Сити». Мусор отбраковываем — тогда тема письма
// уходит в вариант без названия, а не в «Сайт для ООО "" — ...».
function cleanCompany(raw) {
  if (!raw) return '';
  // «ИП Петров А.А.» в тему не годится: «Сайт для Петров А.А.» — сломанный падеж.
  // Такие строки уходят в тему без названия.
  if (/^\s*ип\s/i.test(raw)) return '';
  // Кавычки выносим все: обрезка только по краям оставляет непарную «
  // в названиях вида «Стоматология «Улыбка+»» — и она уезжает в тему письма.
  let name = raw.replace(/[«»"'`„“”]/g, ' ').replace(/\s+/g, ' ').trim();
  name = name.replace(ORG_FORMS, '').trim();
  if (name.length < 2 || name.length > 40) return '';
  if (!/[а-яёa-z]/i.test(name)) return '';
  if (EMAIL_RE.test(name) || /^https?:/i.test(name)) return '';
  return name;
}

function fill(template, vars) {
  return template.replace(/\{\{(\w+)\}\}/g, (m, key) => (key in vars ? vars[key] : m));
}

// Абзацы в шаблонах пишутся одной строкой, перенос делает скрипт — иначе любая
// подстановка в середину абзаца ломает вёрстку письма. Последний абзац (подпись)
// оставляем как есть: там переносы осмысленные.
function wrapParagraphs(text, width = 78) {
  const blocks = text.split(/\n{2,}/);
  return blocks
    .map((block, i) => {
      if (i === blocks.length - 1) return block.trim();
      const flat = block.replace(/\s*\n\s*/g, ' ').trim();
      // Тире не должно начинать строку — склеиваем его с предыдущим словом.
      const words = [];
      for (const word of flat.split(' ')) {
        if ((word === '—' || word === '–') && words.length) words[words.length - 1] += ' ' + word;
        else words.push(word);
      }
      const lines = [];
      let line = '';
      for (const word of words) {
        if (!line) line = word;
        else if (line.length + 1 + word.length <= width) line += ' ' + word;
        else { lines.push(line); line = word; }
      }
      if (line) lines.push(line);
      return lines.join('\n');
    })
    .join('\n\n');
}

function slugify(value, fallback) {
  const map = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya' };
  const s = String(value).toLowerCase().split('').map((c) => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  return s || fallback;
}

function csvCell(value) {
  const s = String(value ?? '');
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function loadLeads(path) {
  const text = readFileSync(path, 'utf8');
  if (path.toLowerCase().endsWith('.json')) {
    const data = JSON.parse(text);
    const list = Array.isArray(data) ? data : (data.items ?? data.results ?? data.leads ?? []);
    if (!Array.isArray(list)) throw new Error('В JSON не нашёл массива лидов (ожидаю массив или ключ items/results/leads).');
    return list;
  }
  return parseCsv(text);
}

const HELP = `
Рендер холодной рассылки под нишу.

  --list                 показать доступные ниши
  --niche <key>          ниша из niches.json (обязательно)
  --leads <path>         выгрузка парсера: .csv или .json
  --preview              напечатать одно письмо-образец и выйти
  --followup             рендерить второе письмо (напоминание) вместо первого
  --out <dir>            куда писать (по умолчанию out/<niche>[-followup])
  --limit <n>            взять первые n лидов

Примеры:
  node marketing/outreach/render.mjs --niche detailing --preview
  node marketing/outreach/render.mjs --niche dental --leads leads/dental.csv
`;

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) { console.log(HELP); return; }

  const config = JSON.parse(readFileSync(join(HERE, 'niches.json'), 'utf8'));
  const niches = config.niches;

  if (args.list) {
    console.log('\nДоступные ниши:\n');
    for (const [key, n] of Object.entries(niches)) console.log(`  ${key.padEnd(14)} ${n.title}`);
    console.log('');
    return;
  }

  if (!args.niche) { console.error('Не указана ниша. Список: --list' + HELP); process.exit(1); }
  const niche = niches[args.niche];
  if (!niche) { console.error(`Нет ниши «${args.niche}». Список: --list`); process.exit(1); }

  const templateFile = args.followup ? 'template-followup.txt' : 'template.txt';
  const template = readFileSync(join(HERE, templateFile), 'utf8').trimEnd();
  const link = niche.link ?? config.defaults.link;

  const renderBody = (company) => wrapParagraphs(fill(template, {
    focus: niche.focus,
    actionTo: niche.actionTo ?? config.defaults.actionTo,
    actionIn: niche.actionIn ?? config.defaults.actionIn,
    link,
    company: company || niche.title.toLowerCase(),
  }));

  // Напоминание уходит ответом в ту же цепочку — отсюда Re: в теме.
  const renderSubject = (company, index) => {
    const list = company ? niche.subjects : niche.subjectsNoCompany;
    const subject = fill(list[index % list.length], { company });
    return args.followup ? `Re: ${subject}` : subject;
  };

  if (args.preview) {
    console.log(`\n--- ниша: ${niche.title}${args.followup ? ' (напоминание)' : ''} ---\n`);
    console.log(`Тема: ${renderSubject('Пример-Компания', 0)}\n`);
    console.log(renderBody('Пример-Компания'));
    console.log(`\n--- без названия компании в базе ---\n`);
    console.log(`Тема: ${renderSubject('', 0)}\n`);
    return;
  }

  if (!args.leads) { console.error('Не указан файл лидов: --leads <path>. Образец письма: --preview'); process.exit(1); }
  const leadsPath = resolve(process.cwd(), args.leads);
  if (!existsSync(leadsPath)) { console.error(`Файл не найден: ${leadsPath}`); process.exit(1); }

  const rows = loadLeads(leadsPath);
  const outDir = resolve(process.cwd(), args.out ?? join(HERE, 'out', args.niche + (args.followup ? '-followup' : '')));
  if (existsSync(outDir)) rmSync(outDir, { recursive: true });
  mkdirSync(outDir, { recursive: true });

  const seen = new Set();
  const letters = [];
  const skipped = { noEmail: 0, badEmail: 0, duplicate: 0 };

  for (const row of rows) {
    if (letters.length >= args.limit) break;
    const email = pick(row, EMAIL_KEYS).split(/[;,\s]+/)[0]?.toLowerCase() ?? '';
    if (!email) { skipped.noEmail++; continue; }
    if (!EMAIL_RE.test(email)) { skipped.badEmail++; continue; }
    if (seen.has(email)) { skipped.duplicate++; continue; }
    seen.add(email);

    const company = cleanCompany(pick(row, COMPANY_KEYS));
    letters.push({
      email,
      company,
      city: pick(row, CITY_KEYS),
      site: pick(row, SITE_KEYS),
      subject: renderSubject(company, letters.length),
      body: renderBody(company),
    });
  }

  letters.forEach((letter, i) => {
    const name = `${String(i + 1).padStart(3, '0')}-${slugify(letter.company || letter.email.split('@')[0], 'lead')}.txt`;
    writeFileSync(join(outDir, name), `Кому: ${letter.email}\nТема: ${letter.subject}\n\n${letter.body}\n`, 'utf8');
  });

  const header = ['email', 'subject', 'body', 'company', 'city', 'site'];
  const csv = '﻿' + [
    header.join(','),
    ...letters.map((l) => [l.email, l.subject, l.body, l.company, l.city, l.site].map(csvCell).join(',')),
  ].join('\n') + '\n';
  writeFileSync(join(outDir, 'mailing.csv'), csv, 'utf8');

  console.log(`\nНиша: ${niche.title}${args.followup ? ' (напоминание)' : ''}`);
  console.log(`Строк в файле: ${rows.length}`);
  console.log(`Писем готово:  ${letters.length}`);
  console.log(`Отброшено:     без почты ${skipped.noEmail}, битая почта ${skipped.badEmail}, дубли ${skipped.duplicate}`);
  console.log(`Папка:         ${outDir}`);
  console.log(`Для сервиса:   ${join(outDir, 'mailing.csv')}\n`);
}

main();
