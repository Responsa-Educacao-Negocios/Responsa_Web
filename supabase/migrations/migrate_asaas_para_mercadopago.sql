-- Substitui a integração de assinaturas de Asaas por Mercado Pago.
-- A tabela ASSINATURAS já existia (criada fora de migration); aqui só
-- trocamos as colunas específicas do provedor antigo pelas do novo.

alter table "ASSINATURAS"
  rename column cd_asaas_subscription to cd_mp_preapproval_id;

alter table "ASSINATURAS"
  drop column if exists cd_asaas_customer;

alter table "ASSINATURAS"
  add column if not exists ds_payer_email text;
