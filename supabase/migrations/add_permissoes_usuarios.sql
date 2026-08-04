-- Permite níveis de permissão reais para consultores (hoje era um badge
-- fixo "Admin" na tela). E adiciona status ativo/inativo para os usuários
-- do portal do cliente (hoje só existia para consultores).

alter table "CONSULTORES"
  add column if not exists tp_permissao text not null default 'CONSULTOR'
  check (tp_permissao in ('ADMIN', 'CONSULTOR'));

alter table "USUARIOS_CLIENTE"
  add column if not exists sn_ativo boolean not null default true;
