# NutriFlow - Progresso de Implementação

## Status Geral

| Fase | Descrição | Status | Progresso |
|------|-----------|--------|-----------|
| 1 | Agendamento Avançado | 🟢 Concluído | 21/21 |
| 2 | IA para Anamnese | 🟡 Em progresso | 14/17 |
| 3 | Multi-tenant (Clínicas) | 🟢 Concluído | 20/20 |
| 4 | Auto-agendamento | 🔴 Não iniciado | 0/19 |

**Legenda**: 🔴 Não iniciado | 🟡 Em progresso | 🟢 Concluído

---

## Fase 1: Agendamento Avançado

### 1.1 Database & Types (5/5) ✅
- [x] 1.1.1 - Migration nutri_availability
- [x] 1.1.2 - Migration nutri_time_blocks
- [x] 1.1.3 - Migration appointment_history
- [x] 1.1.4 - Campos reagendamento em appointments
- [x] 1.1.5 - Tipos TypeScript

### 1.2 Configuração de Disponibilidade (5/5) ✅
- [x] 1.2.1 - Página de configuração (`/settings/availability`)
- [x] 1.2.2 - Formulário de disponibilidade
- [x] 1.2.3 - Visualização semanal (`week-schedule.tsx`)
- [x] 1.2.4 - Componente de slot de horário (`time-slot-row.tsx`)
- [x] 1.2.5 - Queries de disponibilidade (`availability.ts`)

### 1.3 Bloqueio de Horários (4/4) ✅
- [x] 1.3.1 - Dialog de bloqueio (`time-block-dialog.tsx`)
- [x] 1.3.2 - Lista de bloqueios (`time-block-list.tsx`)
- [x] 1.3.3 - Queries de bloqueios (`time-blocks.ts`)
- [x] 1.3.4 - Integração no calendário (`schedule-calendar.tsx`, `schedule/page.tsx`)

### 1.4 Prevenção de Conflitos (4/4) ✅
- [x] 1.4.1 - Módulo de verificação de conflitos (`conflict-checker.ts`)
- [x] 1.4.2 - Gerador de slots disponíveis (`available-slots.ts`)
- [x] 1.4.3 - Atualizar formulário de agendamento (`appointment-form.tsx`)
- [x] 1.4.4 - Seletor de horários disponíveis (`time-slot-picker.tsx`)

### 1.5 Reagendamento (3/3) ✅
- [x] 1.5.1 - Dialog de reagendamento (`reschedule-dialog.tsx`)
- [x] 1.5.2 - Histórico de alterações (`appointment-history.tsx`, `appointment-actions-dialog.tsx`)
- [x] 1.5.3 - Atualizar queries appointments (`appointments.ts`)

---

## Fase 2: IA para Anamnese

### 2.1 Database & Types (3/3) ✅
- [x] 2.1.1 - Migration anamnesis_reports
- [x] 2.1.2 - Tipos TypeScript (`src/types/database.ts`)
- [x] 2.1.3 - Tipos para relatório de anamnese (`src/types/anamnesis.ts`)

### 2.2 Captura de Anamnese (4/5) 🟡
- [x] 2.2.1 - Página de anamnese (`/patients/[id]/anamnesis/new`)
- [x] 2.2.2 - Gravador de áudio (`audio-recorder.tsx`, `use-audio-recorder.ts`)
- [x] 2.2.3 - Input de texto (integrado na página new)
- [x] 2.2.4 - Upload de áudio (integrado na página new)
- [ ] 2.2.5 - ⚠️ Pendente: Migrar transcrição para Web Speech API (gratuito)

### 2.3 Processamento por IA (4/4) ✅
- [x] 2.3.1 - API de transcrição (`/api/anamnesis/transcribe`)
- [x] 2.3.2 - API de processamento IA (`/api/anamnesis/process`)
- [x] 2.3.3 - Módulo de processamento (`src/lib/ai/process-anamnesis.ts`)
- [x] 2.3.4 - Prompts da IA (integrado no módulo de processamento)

### 2.4 Revisão e Edição (3/5) 🟡
- [x] 2.4.1 - Página de revisão (`/patients/[id]/anamnesis/[reportId]`)
- [x] 2.4.2 - Editor de relatório (integrado na página de revisão)
- [x] 2.4.3 - Indicador de confiança (`processing-indicator.tsx`)
- [ ] 2.4.4 - ⚠️ Lista de anamneses precisa de melhorias visuais
- [ ] 2.4.5 - ⚠️ Queries de anamnese (usando Supabase direto por enquanto)

---

## Fase 3: Suporte a Clínicas (Multi-tenant)

### 3.1 Database & Types (5/5) ✅
- [x] 3.1.1 - Migration organizations
- [x] 3.1.2 - Migration organization_members
- [x] 3.1.3 - Migration organization_invites
- [x] 3.1.4 - RLS policies multi-tenant
- [x] 3.1.5 - Tipos TypeScript

### 3.2 Criação de Clínica (4/4) ✅
- [x] 3.2.1 - Página de criação (`/organization/create`)
- [x] 3.2.2 - Formulário de clínica (`organization-form.tsx`)
- [x] 3.2.3 - Página de configurações (`/organization/settings`)
- [x] 3.2.4 - Queries de organização (`organization.ts`)

### 3.3 Gestão de Membros (4/4) ✅
- [x] 3.3.1 - Página de membros (`/organization/members`)
- [x] 3.3.2 - Dialog de convite (`invite-dialog.tsx`)
- [x] 3.3.3 - Lista de convites pendentes (`pending-invites.tsx`)
- [x] 3.3.4 - Card de membro (`member-card.tsx`)

### 3.4 Dashboard Admin (4/4) ✅
- [x] 3.4.1 - Dashboard da organização (`/organization/dashboard`)
- [x] 3.4.2 - Agenda consolidada (`/organization/schedule`)
- [x] 3.4.3 - Card de agenda do nutri (`nutri-schedule-card.tsx`)
- [x] 3.4.4 - Métricas da organização (`org-metrics.tsx`)

### 3.5 Convites e Onboarding (3/3) ✅
- [x] 3.5.1 - Página de aceite de convite (`/invite/[token]`)
- [x] 3.5.2 - API de convite (`/api/organization/invite`)
- [x] 3.5.3 - Componente de aceite de convite (`accept-invite-button.tsx`)

---

## Fase 4: Auto-agendamento de Pacientes

### 4.1 Database & Types (0/3)
- [ ] 4.1.1 - Migration nutri_public_profiles
- [ ] 4.1.2 - Migration booking_notifications
- [ ] 4.1.3 - Tipos TypeScript

### 4.2 Perfil Público (0/5)
- [ ] 4.2.1 - Página de perfil público
- [ ] 4.2.2 - Header do perfil
- [ ] 4.2.3 - Tags de especialidades
- [ ] 4.2.4 - Config do perfil público
- [ ] 4.2.5 - Formulário de perfil público

### 4.3 Calendário de Agendamento (0/4)
- [ ] 4.3.1 - Página de agendamento
- [ ] 4.3.2 - Calendário de disponibilidade
- [ ] 4.3.3 - Seletor de horário
- [ ] 4.3.4 - Cálculo de disponibilidade pública

### 4.4 Formulário de Agendamento (0/3)
- [ ] 4.4.1 - Formulário de booking
- [ ] 4.4.2 - Página de confirmação
- [ ] 4.4.3 - API de agendamento público

### 4.5 Notificações (0/4)
- [ ] 4.5.1 - Cron de lembretes
- [ ] 4.5.2 - Serviço de notificação
- [ ] 4.5.3 - Template de confirmação
- [ ] 4.5.4 - Template de lembrete

---

## Changelog

### 2025-01-22 (Continuação - Fase 3)
- ✅ Criada migration para organizations, members, invites (`20250122000002_organizations.sql`)
- ✅ Criadas RLS policies para multi-tenant
- ✅ Adicionados tipos TypeScript para organizations (`database.ts`)
- ✅ Migration aplicada no Supabase
- ✅ Criada biblioteca de queries de organização (`organization.ts`)
- ✅ Criada página de criação de clínica (`/organization/create`)
- ✅ Criado formulário de organização (`organization-form.tsx`)
- ✅ Criada página de configurações (`/organization/settings`)
- ✅ Criado componente de danger zone (`danger-zone.tsx`)
- ✅ Criada página de membros (`/organization/members`)
- ✅ Criado card de membro (`member-card.tsx`)
- ✅ Criado dialog de convite (`invite-dialog.tsx`)
- ✅ Criada lista de convites pendentes (`pending-invites.tsx`)
- ✅ Criado dashboard da organização (`/organization/dashboard`)
- ✅ Criado componente de métricas (`org-metrics.tsx`)
- ✅ Criado card de agenda do nutri (`nutri-schedule-card.tsx`)
- ✅ Criada agenda consolidada (`/organization/schedule`)
- ✅ Criado calendário consolidado (`consolidated-calendar.tsx`)
- ✅ Criada lista de agendamentos por nutri (`nutri-schedule-list.tsx`)
- ✅ Criada página de aceite de convite (`/invite/[token]`)
- ✅ Criado botão de aceitar convite (`accept-invite-button.tsx`)
- ✅ Criada API de convite (`/api/organization/invite`)
- ✅ Adicionado "Minha Clínica" no sidebar
- ✅ Instalado pacote nanoid para tokens
- ✅ Build passando com sucesso
- ✅ **Fase 3 concluída!**

### 2025-01-22 (Início - Fase 2)
- ✅ Criada migration para anamnesis_reports (`20250122000001_anamnesis_reports.sql`)
- ✅ Criados tipos TypeScript para anamnese (`src/types/anamnesis.ts`)
- ✅ Atualizados tipos do banco (`src/types/database.ts`)
- ✅ Instalados pacotes OpenAI e Anthropic SDK
- ✅ Criados clientes AI (`src/lib/ai/openai.ts`, `src/lib/ai/anthropic.ts`)
- ✅ Criada lógica de transcrição Whisper (`src/lib/ai/transcribe.ts`)
- ✅ Criada lógica de processamento Claude (`src/lib/ai/process-anamnesis.ts`)
- ✅ Criadas API routes (`/api/anamnesis/upload`, `/transcribe`, `/process`)
- ✅ Criado hook de gravação de áudio (`src/hooks/use-audio-recorder.ts`)
- ✅ Criados componentes UI (`audio-recorder.tsx`, `audio-player.tsx`, `processing-indicator.tsx`)
- ✅ Criado componente Tabs (`src/components/ui/tabs.tsx`)
- ✅ Criadas páginas de anamnese (lista, nova, revisão)
- ✅ Integrado link de anamnese na página do paciente
- ✅ Migration aplicada no Supabase
- 🟡 Pendente: Criar bucket de storage `anamnesis-audio`
- 🟡 Pendente: Migrar transcrição para Web Speech API (opção gratuita)

### 2025-01-21
- ✅ Criada migration para Phase 1 (nutri_availability, nutri_time_blocks, appointment_history)
- ✅ Atualizados tipos TypeScript com novas tabelas e enums
- ✅ Criada página de configurações (`/settings`)
- ✅ Criada página de disponibilidade (`/settings/availability`)
- ✅ Criados componentes: `week-schedule.tsx`, `time-slot-row.tsx`
- ✅ Criada página de bloqueios (`/settings/time-blocks`)
- ✅ Criados componentes: `time-block-dialog.tsx`, `time-block-list.tsx`
- ✅ Criadas queries: `availability.ts`, `time-blocks.ts`, `appointments.ts`
- ✅ Criado módulo de conflitos: `conflict-checker.ts`, `available-slots.ts`
- ✅ Criados componentes de reagendamento: `reschedule-dialog.tsx`, `appointment-actions-dialog.tsx`, `appointment-history.tsx`
- ✅ Criados componentes UI: `alert-dialog.tsx`, `badge.tsx`, `switch.tsx`
- ✅ Corrigida navegação sidebar (`/agenda` → `/schedule`)
- ✅ Corrigidos erros de tipo TypeScript em todas as queries (casting explícito para Supabase)
- ✅ Build passando com sucesso
- ✅ Atualizado formulário de agendamento com validação de conflitos
- ✅ Criado seletor de horários disponíveis (`time-slot-picker.tsx`)
- ✅ Integrado bloqueios no calendário da agenda
- ✅ **Fase 1 concluída!**

---

## Notas de Implementação

### Fase 1
- A migration inclui triggers automáticos para logging de histórico de appointments
- O sistema de disponibilidade suporta múltiplos slots por dia
- Bloqueios podem ser de dia inteiro ou parciais
- O conflict-checker valida: disponibilidade semanal, bloqueios, appointments existentes
- O histórico de alterações é registrado automaticamente via triggers do PostgreSQL

### Fase 2
- O sistema suporta 3 modos de entrada: gravação em tempo real, texto digitado, e upload de arquivo
- Transcrição usa OpenAI Whisper (pago) - planejado migrar para Web Speech API (gratuito)
- Processamento de texto usa Anthropic Claude para estruturação
- O relatório estruturado inclui: queixa principal, histórico médico, histórico social, histórico alimentar, medicamentos, suplementos e objetivos
- Auto-save habilitado na página de revisão
- Indicador de confiança mostra a qualidade da extração da IA
- Storage bucket `anamnesis-audio` precisa ser criado manualmente no Supabase Dashboard

### Fase 3
- O sistema suporta uma organização por usuário (clínica)
- Membros podem ter papéis: admin, nutri, ou receptionist
- Convites são gerados com token único via nanoid (32 caracteres)
- Convites expiram em 7 dias
- O proprietário (owner) é automaticamente adicionado como admin ao criar a organização
- RLS policies garantem isolamento de dados entre organizações
- Dashboard admin mostra métricas gerais e agenda de todos os nutris
- Agenda consolidada permite filtrar por nutricionista
- Componentes client-side usam Supabase client, não server queries

### Fase 4
_Notas serão adicionadas durante a implementação_

---

## Arquivos Criados/Modificados na Fase 1

### Migrations
- `supabase/migrations/20250121100001_availability_scheduling.sql`

### Types
- `src/types/database.ts` (modificado)

### Queries
- `src/lib/queries/availability.ts` (novo)
- `src/lib/queries/time-blocks.ts` (novo)
- `src/lib/queries/appointments.ts` (novo)

### Scheduling Logic
- `src/lib/scheduling/conflict-checker.ts` (novo)
- `src/lib/scheduling/available-slots.ts` (novo)

### Pages
- `src/app/(nutri)/settings/page.tsx` (novo)
- `src/app/(nutri)/settings/availability/page.tsx` (novo)
- `src/app/(nutri)/settings/time-blocks/page.tsx` (novo)

### Components - Settings
- `src/app/(nutri)/settings/availability/_components/week-schedule.tsx` (novo)
- `src/app/(nutri)/settings/availability/_components/time-slot-row.tsx` (novo)
- `src/app/(nutri)/settings/time-blocks/_components/time-block-list.tsx` (novo)
- `src/app/(nutri)/settings/time-blocks/_components/time-block-dialog.tsx` (novo)

### Components - Schedule
- `src/app/(nutri)/schedule/_components/reschedule-dialog.tsx` (novo)
- `src/app/(nutri)/schedule/_components/appointment-history.tsx` (novo)
- `src/app/(nutri)/schedule/_components/appointment-actions-dialog.tsx` (novo)
- `src/app/(nutri)/schedule/_components/appointments-list.tsx` (modificado)
- `src/app/(nutri)/schedule/_components/appointment-form.tsx` (modificado - validação de conflitos)
- `src/app/(nutri)/schedule/_components/time-slot-picker.tsx` (novo)
- `src/app/(nutri)/schedule/_components/schedule-calendar.tsx` (modificado - bloqueios)
- `src/app/(nutri)/schedule/page.tsx` (modificado - exibição de bloqueios)

### UI Components
- `src/components/ui/alert-dialog.tsx` (novo)
- `src/components/ui/badge.tsx` (novo)
- `src/components/ui/switch.tsx` (novo)

### Layout
- `src/components/layout/nutri-sidebar.tsx` (modificado - fix nav)

---

## Arquivos Criados/Modificados na Fase 2

### Migrations
- `supabase/migrations/20250122000001_anamnesis_reports.sql`

### Types
- `src/types/database.ts` (modificado - adicionado anamnesis_reports)
- `src/types/anamnesis.ts` (novo)

### AI Integration
- `src/lib/ai/openai.ts` (novo)
- `src/lib/ai/anthropic.ts` (novo)
- `src/lib/ai/transcribe.ts` (novo)
- `src/lib/ai/process-anamnesis.ts` (novo)

### API Routes
- `src/app/api/anamnesis/upload/route.ts` (novo)
- `src/app/api/anamnesis/transcribe/route.ts` (novo)
- `src/app/api/anamnesis/process/route.ts` (novo)

### Hooks
- `src/hooks/use-audio-recorder.ts` (novo)

### Pages
- `src/app/(nutri)/patients/[id]/anamnesis/page.tsx` (novo - lista)
- `src/app/(nutri)/patients/[id]/anamnesis/new/page.tsx` (novo - captura)
- `src/app/(nutri)/patients/[id]/anamnesis/[reportId]/page.tsx` (novo - revisão)
- `src/app/(nutri)/patients/[id]/page.tsx` (modificado - link anamnese)

### Components - Anamnesis
- `src/components/anamnesis/audio-recorder.tsx` (novo)
- `src/components/anamnesis/audio-player.tsx` (novo)
- `src/components/anamnesis/processing-indicator.tsx` (novo)

### UI Components
- `src/components/ui/tabs.tsx` (novo)

---

## Arquivos Criados/Modificados na Fase 3

### Migrations
- `supabase/migrations/20250122000002_organizations.sql`

### Types
- `src/types/database.ts` (modificado - adicionado organizations, members, invites)

### Queries
- `src/lib/queries/organization.ts` (novo)

### API Routes
- `src/app/api/organization/invite/route.ts` (novo)

### Pages - Organization
- `src/app/(nutri)/organization/page.tsx` (novo - redirecionamento)
- `src/app/(nutri)/organization/create/page.tsx` (novo)
- `src/app/(nutri)/organization/settings/page.tsx` (novo)
- `src/app/(nutri)/organization/members/page.tsx` (novo)
- `src/app/(nutri)/organization/dashboard/page.tsx` (novo)
- `src/app/(nutri)/organization/schedule/page.tsx` (novo)

### Pages - Invite
- `src/app/invite/[token]/page.tsx` (novo)

### Components - Organization
- `src/app/(nutri)/organization/_components/organization-form.tsx` (novo)
- `src/app/(nutri)/organization/settings/_components/danger-zone.tsx` (novo)
- `src/app/(nutri)/organization/members/_components/member-card.tsx` (novo)
- `src/app/(nutri)/organization/members/_components/invite-dialog.tsx` (novo)
- `src/app/(nutri)/organization/members/_components/pending-invites.tsx` (novo)
- `src/app/(nutri)/organization/dashboard/_components/org-metrics.tsx` (novo)
- `src/app/(nutri)/organization/dashboard/_components/nutri-schedule-card.tsx` (novo)
- `src/app/(nutri)/organization/schedule/_components/consolidated-calendar.tsx` (novo)
- `src/app/(nutri)/organization/schedule/_components/nutri-schedule-list.tsx` (novo)

### Components - Invite
- `src/app/invite/[token]/_components/accept-invite-button.tsx` (novo)

### Layout
- `src/components/layout/nutri-sidebar.tsx` (modificado - adicionado "Minha Clínica")
