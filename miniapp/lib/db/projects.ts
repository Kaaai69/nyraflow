import { query, queryOne, transaction } from "@/lib/db/client";
import { enqueueEvent, enqueueEventStandalone } from "@/lib/db/outbox";

// Проекты: то, что видит клиент после начала работы.
//
// Этапы повторяют процесс студии с лендинга, поэтому клиент видит ровно ту
// последовательность, которую ему обещали при продаже.

export const PROJECT_STAGES = [
  "diagnostics",
  "structure",
  "design_concept",
  "development",
  "launch_growth",
] as const;

export type ProjectStage = (typeof PROJECT_STAGES)[number];
export type ProjectStatus = "active" | "paused" | "done" | "cancelled";

export const STAGE_TITLES: Record<ProjectStage, string> = {
  diagnostics: "Диагностика задачи",
  structure: "Структура и смыслы",
  design_concept: "Дизайн-концепт",
  development: "Разработка и интеграции",
  launch_growth: "Запуск и рост",
};

export type ProjectRow = {
  id: string;
  client_id: string;
  lead_id: string | null;
  title: string;
  stage: ProjectStage;
  status: ProjectStatus;
  amount: number | null;
  currency: string;
  staging_url: string | null;
  started_at: Date;
  deadline_at: Date | null;
  updated_at: Date;
};

export type TaskRow = {
  id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: "open" | "done" | "cancelled";
  due_at: Date | null;
  completed_at: Date | null;
};

export type ApprovalRow = {
  id: string;
  project_id: string;
  title: string;
  preview_url: string | null;
  status: "pending" | "approved" | "changes_requested";
  comment: string | null;
  decided_at: Date | null;
};

export type InvoiceRow = {
  id: string;
  project_id: string;
  title: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "cancelled";
  pay_url: string | null;
  due_at: Date | null;
  paid_at: Date | null;
};

export type UpdateRow = {
  id: string;
  project_id: string;
  stage: string | null;
  text: string;
  created_at: Date;
};

/** Активный проект клиента. Клиент видит только свой — проверка по client_id. */
export async function getProjectForClient(userId: string): Promise<ProjectRow | null> {
  return queryOne<ProjectRow>(
    `select * from projects
      where client_id = $1 and status in ('active', 'paused')
      order by started_at desc
      limit 1`,
    [userId],
  );
}

export async function getProjectById(id: string): Promise<ProjectRow | null> {
  return queryOne<ProjectRow>("select * from projects where id = $1", [id]);
}

export async function getProjectContents(projectId: string): Promise<{
  tasks: TaskRow[];
  approvals: ApprovalRow[];
  invoices: InvoiceRow[];
  updates: UpdateRow[];
}> {
  const [tasks, approvals, invoices, updates] = await Promise.all([
    query<TaskRow>(
      `select * from project_tasks where project_id = $1
        order by (status = 'open') desc, due_at nulls last, id`,
      [projectId],
    ),
    query<ApprovalRow>(
      `select * from approvals where project_id = $1
        order by (status = 'pending') desc, id desc`,
      [projectId],
    ),
    query<InvoiceRow>(
      `select * from invoices where project_id = $1 and status <> 'draft' order by id desc`,
      [projectId],
    ),
    query<UpdateRow>(
      "select * from project_updates where project_id = $1 order by created_at desc limit 20",
      [projectId],
    ),
  ]);

  return { tasks, approvals, invoices, updates };
}

/** Проект заводится из заявки: клиент и контекст уже известны. */
export async function createProjectFromLead(
  leadId: string,
  title: string,
  amount: number | null,
): Promise<ProjectRow> {
  return transaction(async (client) => {
    const lead = await client.query<{ user_id: string; telegram_id: string }>(
      `select l.user_id, u.telegram_id
         from leads l join users u on u.id = l.user_id
        where l.id = $1`,
      [leadId],
    );

    const found = lead.rows[0];
    if (!found) throw new Error("заявка не найдена");

    const created = await client.query<ProjectRow>(
      `insert into projects (client_id, lead_id, title, amount)
       values ($1, $2, $3, $4)
       returning *`,
      [found.user_id, leadId, title, amount],
    );

    // Клиент, за которого взялись, перестаёт быть гостем.
    await client.query("update users set role = 'client' where id = $1 and role = 'guest'", [
      found.user_id,
    ]);
    await client.query("update leads set status = 'in_work' where id = $1", [leadId]);

    const project = created.rows[0]!;

    await enqueueEvent(client, "stage.changed", {
      projectId: project.id,
      leadId,
      telegramId: found.telegram_id,
      stage: project.stage,
      previousStage: null,
      title: project.title,
    });

    return project;
  });
}

export async function setProjectStage(
  projectId: string,
  stage: ProjectStage,
  note: string | null,
): Promise<ProjectRow | null> {
  return transaction(async (client) => {
    const before = await client.query<{ stage: ProjectStage; client_id: string }>(
      "select stage, client_id from projects where id = $1",
      [projectId],
    );
    const previous = before.rows[0];
    if (!previous) return null;

    const updated = await client.query<ProjectRow>(
      "update projects set stage = $2 where id = $1 returning *",
      [projectId, stage],
    );

    if (note) {
      await client.query(
        "insert into project_updates (project_id, stage, text) values ($1, $2, $3)",
        [projectId, stage, note],
      );
    }

    const telegram = await client.query<{ telegram_id: string }>(
      "select telegram_id from users where id = $1",
      [previous.client_id],
    );

    await enqueueEvent(client, "stage.changed", {
      projectId,
      telegramId: telegram.rows[0]?.telegram_id ?? null,
      stage,
      previousStage: previous.stage,
      note,
    });

    return updated.rows[0] ?? null;
  });
}

export async function completeTask(
  taskId: string,
  projectId: string,
): Promise<TaskRow | null> {
  return queryOne<TaskRow>(
    `update project_tasks
        set status = 'done', completed_at = now()
      where id = $1 and project_id = $2 and status = 'open'
      returning *`,
    [taskId, projectId],
  );
}

export async function decideApproval(
  approvalId: string,
  projectId: string,
  decision: "approved" | "changes_requested",
  comment: string | null,
  decidedBy: string,
): Promise<ApprovalRow | null> {
  const updated = await queryOne<ApprovalRow>(
    `update approvals
        set status = $3, comment = $4, decided_by = $5, decided_at = now()
      where id = $1 and project_id = $2 and status = 'pending'
      returning *`,
    [approvalId, projectId, decision, comment, decidedBy],
  );

  if (updated) {
    await enqueueEventStandalone("approval.granted", {
      projectId,
      approvalId: updated.id,
      decision,
      comment,
      title: updated.title,
    });
  }

  return updated;
}
