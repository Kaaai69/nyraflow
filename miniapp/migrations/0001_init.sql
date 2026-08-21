-- nyraflow desk — первичная схема.
--
-- Покрывает все три «жизни» приложения сразу, чтобы дальше не переписывать
-- фундамент: пресейл (leads/estimates/briefs/bookings), кабинет клиента
-- (projects/tasks/approvals/invoices) и слой интеграций (outbox_events).
--
-- Перечисления сделаны текстом с CHECK, а не PG-энумами: добавить значение
-- потом — обычный ALTER TABLE, без переписывания типа.

create or replace function set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- ---------------------------------------------------------------- users ----

create table users (
  id            bigserial primary key,
  telegram_id   bigint      not null unique,
  username      text,
  first_name    text,
  last_name     text,
  photo_url     text,
  language_code text,
  role          text        not null default 'guest'
                            check (role in ('guest', 'client', 'admin')),
  is_blocked    boolean     not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_seen_at  timestamptz not null default now()
);

create trigger users_set_updated_at before update on users
  for each row execute function set_updated_at();

-- --------------------------------------------------------------- leads -----

create table leads (
  id         bigserial primary key,
  user_id    bigint      references users (id) on delete set null,
  source     text        not null default 'miniapp',
  status     text        not null default 'new'
                         check (status in ('new', 'qualified', 'in_work', 'won', 'lost')),
  contact    text,
  note       text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_status_created_idx on leads (status, created_at desc);
create index leads_user_idx on leads (user_id);

create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();

-- ------------------------------------------------------------ estimates ----
-- Результат конфигуратора: вилка сметы, собранная из прайса студии.

create table estimates (
  id         bigserial primary key,
  lead_id    bigint      not null references leads (id) on delete cascade,
  product    text        not null
                         check (product in ('landing', 'web_service', 'ai_automation')),
  answers    jsonb       not null default '{}'::jsonb,
  price_min  integer     not null,
  price_max  integer     not null,
  currency   text        not null default 'RUB',
  created_at timestamptz not null default now()
);

create index estimates_lead_idx on estimates (lead_id, created_at desc);

-- --------------------------------------------------------------- briefs ----

create table briefs (
  id           bigserial primary key,
  lead_id      bigint      not null references leads (id) on delete cascade,
  answers      jsonb       not null default '{}'::jsonb,
  status       text        not null default 'draft'
                           check (status in ('draft', 'submitted', 'analyzed', 'failed')),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  submitted_at timestamptz
);

create index briefs_lead_idx on briefs (lead_id, created_at desc);

create trigger briefs_set_updated_at before update on briefs
  for each row execute function set_updated_at();

-- ------------------------------------------------------- brief_analyses ----
-- Разбор считается один раз и хранится здесь: повторный показ не тратит
-- лимиты бесплатного тарифа. is_fallback = разбор собран шаблоном, без модели.

create table brief_analyses (
  id          bigserial primary key,
  brief_id    bigint      not null references briefs (id) on delete cascade,
  provider    text        not null,
  model       text        not null,
  is_fallback boolean     not null default false,
  payload     jsonb       not null,
  tokens_in   integer,
  tokens_out  integer,
  latency_ms  integer,
  created_at  timestamptz not null default now()
);

create index brief_analyses_brief_idx on brief_analyses (brief_id, created_at desc);

-- ------------------------------------------------------------- bookings ----

create table bookings (
  id         bigserial primary key,
  lead_id    bigint      not null references leads (id) on delete cascade,
  slot_at    timestamptz not null,
  status     text        not null default 'requested'
                         check (status in ('requested', 'confirmed', 'cancelled', 'done')),
  comment    text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookings_slot_idx on bookings (slot_at);

create trigger bookings_set_updated_at before update on bookings
  for each row execute function set_updated_at();

-- ------------------------------------------------------------- projects ----
-- stage повторяет пять этапов процесса студии с лендинга.

create table projects (
  id          bigserial primary key,
  client_id   bigint      not null references users (id) on delete restrict,
  lead_id     bigint      references leads (id) on delete set null,
  title       text        not null,
  stage       text        not null default 'diagnostics'
                          check (stage in ('diagnostics', 'structure', 'design_concept',
                                           'development', 'launch_growth')),
  status      text        not null default 'active'
                          check (status in ('active', 'paused', 'done', 'cancelled')),
  amount      integer,
  currency    text        not null default 'RUB',
  staging_url text,
  started_at  timestamptz not null default now(),
  deadline_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index projects_client_idx on projects (client_id, status);

create trigger projects_set_updated_at before update on projects
  for each row execute function set_updated_at();

-- ------------------------------------------------------ project_updates ----

create table project_updates (
  id         bigserial primary key,
  project_id bigint      not null references projects (id) on delete cascade,
  author_id  bigint      references users (id) on delete set null,
  stage      text,
  text       text        not null,
  created_at timestamptz not null default now()
);

create index project_updates_project_idx on project_updates (project_id, created_at desc);

-- -------------------------------------------------------- project_tasks ----
-- Блок «нужно от вас»: тексты, доступы, фото — с дедлайном.

create table project_tasks (
  id           bigserial primary key,
  project_id   bigint      not null references projects (id) on delete cascade,
  title        text        not null,
  description  text,
  status       text        not null default 'open'
                           check (status in ('open', 'done', 'cancelled')),
  due_at       timestamptz,
  completed_at timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index project_tasks_project_idx on project_tasks (project_id, status);
create index project_tasks_due_idx on project_tasks (due_at) where status = 'open';

create trigger project_tasks_set_updated_at before update on project_tasks
  for each row execute function set_updated_at();

-- ------------------------------------------------------------ approvals ----
-- Согласование дизайн-концепта: решение фиксируется с таймстампом.

create table approvals (
  id          bigserial primary key,
  project_id  bigint      not null references projects (id) on delete cascade,
  title       text        not null,
  preview_url text,
  status      text        not null default 'pending'
                          check (status in ('pending', 'approved', 'changes_requested')),
  comment     text,
  decided_by  bigint      references users (id) on delete set null,
  decided_at  timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index approvals_project_idx on approvals (project_id, status);

create trigger approvals_set_updated_at before update on approvals
  for each row execute function set_updated_at();

-- ------------------------------------------------------------- invoices ----

create table invoices (
  id         bigserial primary key,
  project_id bigint      not null references projects (id) on delete cascade,
  title      text        not null,
  amount     integer     not null,
  currency   text        not null default 'RUB',
  status     text        not null default 'draft'
                         check (status in ('draft', 'sent', 'paid', 'cancelled')),
  pay_url    text,
  due_at     timestamptz,
  paid_at    timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index invoices_project_idx on invoices (project_id, status);

create trigger invoices_set_updated_at before update on invoices
  for each row execute function set_updated_at();

-- -------------------------------------------------------- outbox_events ----
-- Транзакционный outbox: событие пишется в той же транзакции, что и данные,
-- а доставкой в n8n занимается отдельный воркер с ретраями. Ни одно событие
-- не теряется, если n8n лежит или ещё не поднят.

create table outbox_events (
  id            bigserial primary key,
  type          text        not null,
  payload       jsonb       not null,
  status        text        not null default 'pending'
                            check (status in ('pending', 'sent', 'failed', 'dead')),
  attempts      integer     not null default 0,
  last_error    text,
  next_retry_at timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  sent_at       timestamptz
);

create index outbox_pending_idx on outbox_events (next_retry_at)
  where status = 'pending';
