-- Cria a tabela de apontamentos de horas por projeto e mantém
-- PROJETOS.nr_horas_consumidas sempre sincronizado via trigger.
-- Ajuste os tipos de cd_projeto/cd_consultor abaixo se não forem uuid no seu schema.

create table if not exists "APONTAMENTOS_HORAS" (
  cd_apontamento uuid primary key default gen_random_uuid(),
  cd_projeto uuid not null references "PROJETOS"(cd_projeto) on delete cascade,
  cd_consultor uuid references "CONSULTORES"(cd_consultor) on delete set null,
  nr_horas numeric(6,2) not null check (nr_horas > 0),
  ds_descricao text,
  dt_apontamento date not null default current_date,
  ts_criacao timestamptz not null default now()
);

create index if not exists idx_apontamentos_horas_projeto
  on "APONTAMENTOS_HORAS" (cd_projeto);

-- Recalcula nr_horas_consumidas do projeto sempre que um apontamento
-- é criado, editado ou removido.
create or replace function fn_atualizar_horas_consumidas()
returns trigger as $$
declare
  v_projeto uuid;
begin
  v_projeto := coalesce(new.cd_projeto, old.cd_projeto);

  update "PROJETOS"
  set nr_horas_consumidas = (
    select coalesce(sum(nr_horas), 0)
    from "APONTAMENTOS_HORAS"
    where cd_projeto = v_projeto
  )
  where cd_projeto = v_projeto;

  return null;
end;
$$ language plpgsql;

drop trigger if exists trg_atualizar_horas_consumidas on "APONTAMENTOS_HORAS";
create trigger trg_atualizar_horas_consumidas
after insert or update or delete on "APONTAMENTOS_HORAS"
for each row execute function fn_atualizar_horas_consumidas();

alter table "APONTAMENTOS_HORAS" enable row level security;

-- Mesmo nível de acesso usado hoje pelo cliente anon/autenticado nas
-- demais tabelas de projeto (ex: EMPRESAS, CONSULTORES). Aperte a
-- policy depois se o projeto adotar RLS mais restritivo.
create policy "Consultores autenticados podem gerenciar apontamentos"
on "APONTAMENTOS_HORAS"
for all
to authenticated
using (true)
with check (true);
