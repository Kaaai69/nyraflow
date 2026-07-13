# Task 3 report: секции и responsive design

## Статус

Реализована статическая нижняя часть главной страницы после защищённого Spline hero. Секции рендерятся в порядке credibility, problem, work, services, team, process, FAQ, contact, footer.

`components/LockedSplineHero.tsx` не изменялся.

## Что сделано

- Добавлен серверный orchestrator `components/HomeSections.tsx`.
- Каждая смысловая секция вынесена в focused Server Component в `components/home/`.
- Подключён локальный variable font Onest через `@fontsource-variable/onest`. Build не загружает шрифт из сети.
- В `app/globals.css` добавлены Tailwind v4 tokens из `docs/DESIGN.md`: canvas, surface, surface-blue, text-primary, text-secondary, line, blue, blue-deep, cyan и Onest font stack.
- Реализована единая светлая тема, один синий accent range, документированная система радиусов и responsive поля контейнера.
- Credibility является единственным блоком из трёх равных карточек.
- Problem использует редакционный split 5/7 без карточной сетки.
- Portfolio использует реальный нейтрально подписанный published screenshot, подтверждённую ссылку `Открыть опубликованный проект` и два media с явно видимой подписью `Концепт`.
- Services собраны как три горизонтальные редакционные строки с тремя бизнес-вопросами в каждой.
- Team использует реальные локальные фото. Неподтверждённые роли и описания не публикуются, потому что `isRoleConfirmed` равен `false`.
- Process использует sticky-заголовок и четыре обычные строки без scroll hijack.
- FAQ использует шесть native `details` и `summary`, две независимые колонки на desktop и одну последовательную колонку на mobile.
- Contact содержит статическую форму foundation с видимыми labels. У формы нет `action`, `method`, endpoint или fake success. Кнопка имеет `type="button"`, поэтому данные не отправляются.
- Footer содержит anchors на работы, услуги, команду, FAQ и контакты, а также актуальный год. Неподтверждённые бренд, direct contact и legal links не выдуманы.
- Responsive layouts складываются в одну колонку ниже desktop breakpoints. CTA использует `white-space: nowrap`, mobile overflow ограничен на page root.
- Motion ограничен CSS transitions для `transform` и `opacity`. Нет animation libraries, scroll listeners, parallax или sticky scroll hijack. `prefers-reduced-motion` сокращает transitions.

## TDD evidence

Сначала добавлен `tests/home-page.test.ts`, который server-rendered HTML проверяет:

- финальные русские headings и credibility statements;
- порядок всех section landmarks и footer;
- шесть native FAQ disclosures;
- inert form foundation без передачи данных;
- два явных `Концепт`, published screenshot, team photos и footer anchors;
- подтверждённую ссылку на опубликованный проект;
- все утверждённые problem, service, team, process и FAQ headings;
- запрет двухколоночного team collage ниже 768 px.

Первый targeted run: 5 failed из 5, ожидаемая причина: `HomeSections` ещё не существовал.

После минимальной реализации targeted run: 5 passed из 5.

После code review добавлен отдельный responsive regression test. Он ожидаемо упал на `sm:grid-cols-2`, после переноса team collage на `md` targeted suite прошёл: 6 passed из 6. Отдельное ожидание published URL также прошло RED/GREEN до добавления ссылки.

## Проверки

- `npm test -- tests/home-page.test.ts`: 1 file passed, 6 tests passed.
- `npm run typecheck`: Next route types generated, TypeScript exit 0.
- `npm test`: 3 files passed, 22 tests passed.
- `npm run build`: Next.js production build exit 0, `/` prerendered as static content.
- `git diff --check`: clean.
- `git diff -- components/LockedSplineHero.tsx`: empty.
- SHA-256 защищённого hero до и после: `d9cac33cee550ebfa7382a0f7ba0ea69a020af16fee7704382624a33a6fa1208`.

## Осознанные ограничения

- Browser visual QA выполняется отдельной задачей по решению основного исполнителя.
- Для опубликованного проекта показан только нейтральный подтверждаемый контекст и live URL. Contribution и results не добавлены без подтверждения.
- Неподтверждённые team roles, direct contact, privacy notice, legal links и публичный wordmark не показаны. Это следует правилам фактов в `docs/CONTENT.md`.
- Форма намеренно не отправляет данные до появления подтверждённого endpoint и legal copy.

## Дополнение после внешнего review

Выполнен отдельный RED/GREEN цикл для binding findings:

- `app/page.tsx` теперь рендерит `HomeSections` внутри `main`, а `SiteFooter` после закрывающего тега `main`. `LockedSplineHero` остаётся первым meaningful child внутри `main`.
- AST regression test проверяет эту реальную структуру `app/page.tsx` и отсутствие footer в `HomeSections`.
- Rendering test проверяет утверждённые заголовки как точные `h2` и `h3`, а вопросы FAQ как native `summary`.
- Все keyboard focus indicators унифицированы одним solid `blue-deep` outline толщиной 3 px. Прозрачные rings и локальное отключение outline удалены.
- Hover сдвиг service title работает только внутри `@media (hover: hover) and (pointer: fine)`.
- Primary CTA на hover использует `blue-deep` без opacity fade.
- `WorkMedia` стал discriminated union со статусами `published` и `concept`.
- Published media хранит собственные `href` и `cta`; `WorkSection` читает их из данных и больше не содержит URL или CTA string literal.
- Concept media не содержат `href` или `cta`, поэтому не могут случайно получить published link.

Ожидаемый RED:

- 4 failures для footer placement, focus и hover policy, concept status и published destination;
- отдельный hardcode regression упал на URL внутри `WorkSection`.

GREEN после fixes:

- `npm test -- tests/home-page.test.ts tests/home-content.test.ts`: 2 files passed, 18 tests passed;
- `npm run typecheck`: exit 0;
- `npm test`: 3 files passed, 25 tests passed;
- `npm run build`: exit 0, `/` статически prerendered;
- protected hero diff пуст, SHA-256 сохранён.

Статический current year в footer оставлен как документированное minor limitation. Отдельный client component только ради года не добавлялся.
