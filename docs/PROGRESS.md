# NutriFlow - Progresso de Implementação

## Status Geral

| Fase | Descrição | Status | Progresso |
|------|-----------|--------|-----------|
| 1 | Agendamento Avançado | 🟢 Concluído | 21/21 |
| 2 | IA para Anamnese | 🔴 Não iniciado | 0/17 |
| 3 | Multi-tenant (Clínicas) | 🔴 Não iniciado | 0/20 |
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

### 2.1 Database & Types (0/3)
- [ ] 2.1.1 - Migration anamnesis_reports
- [ ] 2.1.2 - Tipos TypeScript
- [ ] 2.1.3 - Tipos para relatório de anamnese

### 2.2 Captura de Anamnese (0/5)
- [ ] 2.2.1 - Página de anamnese
- [ ] 2.2.2 - Gravador de áudio
- [ ] 2.2.3 - Input de texto
- [ ] 2.2.4 - Upload de áudio
- [ ] 2.2.5 - Seletor de modo de captura

### 2.3 Processamento por IA (0/4)
- [ ] 2.3.1 - API de transcrição
- [ ] 2.3.2 - API de processamento IA
- [ ] 2.3.3 - Módulo de processamento
- [ ] 2.3.4 - Prompts da IA

### 2.4 Revisão e Edição (0/5)
- [ ] 2.4.1 - Página de revisão
- [ ] 2.4.2 - Editor de relatório
- [ ] 2.4.3 - Indicador de confiança
- [ ] 2.4.4 - Lista de anamneses
- [ ] 2.4.5 - Queries de anamnese

---

## Fase 3: Suporte a Clínicas (Multi-tenant)

### 3.1 Database & Types (0/5)
- [ ] 3.1.1 - Migration organizations
- [ ] 3.1.2 - Migration organization_members
- [ ] 3.1.3 - Migration organization_invites
- [ ] 3.1.4 - RLS policies multi-tenant
- [ ] 3.1.5 - Tipos TypeScript

### 3.2 Criação de Clínica (0/4)
- [ ] 3.2.1 - Página de criação
- [ ] 3.2.2 - Formulário de clínica
- [ ] 3.2.3 - Página de configurações
- [ ] 3.2.4 - Queries de organização

### 3.3 Gestão de Membros (0/4)
- [ ] 3.3.1 - Página de membros
- [ ] 3.3.2 - Dialog de convite
- [ ] 3.3.3 - Lista de membros
- [ ] 3.3.4 - Card de membro

### 3.4 Dashboard Admin (0/4)
- [ ] 3.4.1 - Dashboard da organização
- [ ] 3.4.2 - Agenda consolidada
- [ ] 3.4.3 - Card de agenda do nutri
- [ ] 3.4.4 - Métricas da organização

### 3.5 Convites e Onboarding (0/3)
- [ ] 3.5.1 - Página de aceite de convite
- [ ] 3.5.2 - API de convite
- [ ] 3.5.3 - Template de email

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
_Notas serão adicionadas durante a implementação_

### Fase 3
_Notas serão adicionadas durante a implementação_

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
