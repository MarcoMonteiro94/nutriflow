# NutriFlow - Plano de Implementação

## Visão Geral

Este documento detalha o plano de implementação das 4 fases de evolução do NutriFlow.

**Total Estimado**: ~65 arquivos

---

## Fase 1: Agendamento Avançado

### Objetivo
Transformar o sistema de agendamento básico em uma solução profissional com gestão de disponibilidade, bloqueio de horários, prevenção de conflitos e reagendamento.

### Critérios de Sucesso
- [ ] Nutricionista pode configurar sua disponibilidade semanal
- [ ] Bloqueio de horários específicos (férias, feriados, compromissos)
- [ ] Sistema previne conflitos automaticamente
- [ ] Pacientes podem ser reagendados facilmente
- [ ] Notificações de confirmação/reagendamento

### Tasks

#### 1.1 Database & Types
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 1.1.1 | Criar migration para nutri_availability | `supabase/migrations/20250121100001_availability_scheduling.sql` | ⬜ |
| 1.1.2 | Criar migration para nutri_time_blocks | `supabase/migrations/20250121100001_availability_scheduling.sql` | ⬜ |
| 1.1.3 | Criar migration para appointment_history | `supabase/migrations/20250121100001_availability_scheduling.sql` | ⬜ |
| 1.1.4 | Adicionar campos de reagendamento em appointments | `supabase/migrations/20250121100001_availability_scheduling.sql` | ⬜ |
| 1.1.5 | Atualizar tipos TypeScript | `src/types/database.ts` | ⬜ |

#### 1.2 Configuração de Disponibilidade
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 1.2.1 | Criar página de configuração de disponibilidade | `src/app/(nutri)/settings/availability/page.tsx` | ⬜ |
| 1.2.2 | Criar componente de formulário de disponibilidade | `src/app/(nutri)/settings/availability/_components/availability-form.tsx` | ⬜ |
| 1.2.3 | Criar componente de visualização semanal | `src/app/(nutri)/settings/availability/_components/week-schedule.tsx` | ⬜ |
| 1.2.4 | Criar componente de slot de horário | `src/app/(nutri)/settings/availability/_components/time-slot-row.tsx` | ⬜ |
| 1.2.5 | Criar queries de disponibilidade | `src/lib/queries/availability.ts` | ⬜ |

#### 1.3 Bloqueio de Horários
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 1.3.1 | Criar dialog de bloqueio de horário | `src/app/(nutri)/schedule/_components/time-block-dialog.tsx` | ⬜ |
| 1.3.2 | Criar lista de bloqueios | `src/app/(nutri)/schedule/_components/time-block-list.tsx` | ⬜ |
| 1.3.3 | Criar queries de bloqueios | `src/lib/queries/time-blocks.ts` | ⬜ |
| 1.3.4 | Integrar bloqueios no calendário | `src/app/(nutri)/schedule/_components/schedule-calendar.tsx` | ⬜ |

#### 1.4 Prevenção de Conflitos
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 1.4.1 | Criar módulo de verificação de conflitos | `src/lib/scheduling/conflict-checker.ts` | ⬜ |
| 1.4.2 | Criar gerador de slots disponíveis | `src/lib/scheduling/available-slots.ts` | ⬜ |
| 1.4.3 | Atualizar formulário de agendamento | `src/app/(nutri)/schedule/_components/appointment-form.tsx` | ⬜ |
| 1.4.4 | Criar seletor de horários disponíveis | `src/app/(nutri)/schedule/_components/time-slot-picker.tsx` | ⬜ |

#### 1.5 Reagendamento
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 1.5.1 | Criar dialog de reagendamento | `src/app/(nutri)/schedule/_components/reschedule-dialog.tsx` | ⬜ |
| 1.5.2 | Criar componente de histórico de alterações | `src/app/(nutri)/schedule/_components/appointment-history.tsx` | ⬜ |
| 1.5.3 | Atualizar queries de appointments | `src/lib/queries/appointments.ts` | ⬜ |

---

## Fase 2: IA para Anamnese

### Objetivo
Implementar processamento de anamnese por IA que converte áudio/texto não estruturado em relatório profissional estruturado.

### Critérios de Sucesso
- [ ] Upload de áudio da consulta
- [ ] Input de texto livre
- [ ] IA gera relatório estruturado
- [ ] Nutricionista pode revisar e editar
- [ ] Relatório salvo no perfil do paciente

### Tasks

#### 2.1 Database & Types
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 2.1.1 | Criar migration para anamnesis_reports | `supabase/migrations/20250121200001_anamnesis.sql` | ⬜ |
| 2.1.2 | Atualizar tipos TypeScript | `src/types/database.ts` | ⬜ |
| 2.1.3 | Criar tipos para relatório de anamnese | `src/types/anamnesis.ts` | ⬜ |

#### 2.2 Captura de Anamnese
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 2.2.1 | Criar página de anamnese | `src/app/(nutri)/patients/[id]/anamnesis/page.tsx` | ⬜ |
| 2.2.2 | Criar componente de gravação de áudio | `src/app/(nutri)/patients/[id]/anamnesis/_components/audio-recorder.tsx` | ⬜ |
| 2.2.3 | Criar componente de input de texto | `src/app/(nutri)/patients/[id]/anamnesis/_components/text-input.tsx` | ⬜ |
| 2.2.4 | Criar componente de upload de áudio | `src/app/(nutri)/patients/[id]/anamnesis/_components/upload-audio.tsx` | ⬜ |
| 2.2.5 | Criar seletor de modo de captura | `src/app/(nutri)/patients/[id]/anamnesis/_components/capture-mode-selector.tsx` | ⬜ |

#### 2.3 Processamento por IA
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 2.3.1 | Criar API de transcrição | `src/app/api/anamnesis/transcribe/route.ts` | ⬜ |
| 2.3.2 | Criar API de processamento IA | `src/app/api/anamnesis/process/route.ts` | ⬜ |
| 2.3.3 | Criar módulo de processamento | `src/lib/ai/anamnesis-processor.ts` | ⬜ |
| 2.3.4 | Criar prompts da IA | `src/lib/ai/prompts/anamnesis.ts` | ⬜ |

#### 2.4 Revisão e Edição
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 2.4.1 | Criar página de revisão | `src/app/(nutri)/patients/[id]/anamnesis/[reportId]/page.tsx` | ⬜ |
| 2.4.2 | Criar editor de relatório | `src/app/(nutri)/patients/[id]/anamnesis/_components/report-editor.tsx` | ⬜ |
| 2.4.3 | Criar indicador de confiança | `src/app/(nutri)/patients/[id]/anamnesis/_components/confidence-indicator.tsx` | ⬜ |
| 2.4.4 | Criar lista de anamneses | `src/app/(nutri)/patients/[id]/anamnesis/_components/anamnesis-list.tsx` | ⬜ |
| 2.4.5 | Criar queries de anamnese | `src/lib/queries/anamnesis.ts` | ⬜ |

---

## Fase 3: Suporte a Clínicas (Multi-tenant)

### Objetivo
Permitir que clínicas gerenciem múltiplos nutricionistas, com admin tendo visibilidade das agendas de todos os profissionais.

### Critérios de Sucesso
- [ ] Criação de organização (clínica)
- [ ] Convite de nutricionistas para clínica
- [ ] Admin vê agenda de todos os nutris
- [ ] Cada nutri mantém seus próprios pacientes
- [ ] Relatórios consolidados para admin

### Tasks

#### 3.1 Database & Types
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 3.1.1 | Criar migration para organizations | `supabase/migrations/20250121300001_organizations.sql` | ⬜ |
| 3.1.2 | Criar migration para organization_members | `supabase/migrations/20250121300001_organizations.sql` | ⬜ |
| 3.1.3 | Criar migration para organization_invites | `supabase/migrations/20250121300001_organizations.sql` | ⬜ |
| 3.1.4 | Criar RLS policies multi-tenant | `supabase/migrations/20250121300002_organization_rls.sql` | ⬜ |
| 3.1.5 | Atualizar tipos TypeScript | `src/types/database.ts` | ⬜ |

#### 3.2 Criação de Clínica
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 3.2.1 | Criar página de criação de clínica | `src/app/(nutri)/organization/create/page.tsx` | ⬜ |
| 3.2.2 | Criar formulário de clínica | `src/app/(nutri)/organization/_components/organization-form.tsx` | ⬜ |
| 3.2.3 | Criar página de configurações | `src/app/(nutri)/organization/settings/page.tsx` | ⬜ |
| 3.2.4 | Criar queries de organização | `src/lib/queries/organization.ts` | ⬜ |

#### 3.3 Gestão de Membros
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 3.3.1 | Criar página de membros | `src/app/(nutri)/organization/members/page.tsx` | ⬜ |
| 3.3.2 | Criar dialog de convite | `src/app/(nutri)/organization/_components/invite-member-dialog.tsx` | ⬜ |
| 3.3.3 | Criar lista de membros | `src/app/(nutri)/organization/_components/members-list.tsx` | ⬜ |
| 3.3.4 | Criar card de membro | `src/app/(nutri)/organization/_components/member-card.tsx` | ⬜ |

#### 3.4 Dashboard Admin
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 3.4.1 | Criar dashboard da organização | `src/app/(nutri)/organization/dashboard/page.tsx` | ⬜ |
| 3.4.2 | Criar agenda consolidada | `src/app/(nutri)/organization/schedule/page.tsx` | ⬜ |
| 3.4.3 | Criar card de agenda do nutri | `src/app/(nutri)/organization/_components/nutri-schedule-card.tsx` | ⬜ |
| 3.4.4 | Criar métricas da organização | `src/app/(nutri)/organization/_components/org-metrics.tsx` | ⬜ |

#### 3.5 Convites e Onboarding
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 3.5.1 | Criar página de aceite de convite | `src/app/invite/[token]/page.tsx` | ⬜ |
| 3.5.2 | Criar API de convite | `src/app/api/organization/invite/route.ts` | ⬜ |
| 3.5.3 | Criar template de email de convite | `src/lib/email/invite-template.tsx` | ⬜ |

---

## Fase 4: Auto-agendamento de Pacientes

### Objetivo
Permitir que pacientes descubram nutricionistas, visualizem disponibilidade e agendem consultas autonomamente.

### Critérios de Sucesso
- [ ] Página pública de perfil do nutricionista
- [ ] Visualização de horários disponíveis
- [ ] Paciente pode agendar sem conta
- [ ] Confirmação por email/SMS
- [ ] Integração com calendário do nutri

### Tasks

#### 4.1 Database & Types
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 4.1.1 | Criar migration para nutri_public_profiles | `supabase/migrations/20250121400001_public_booking.sql` | ⬜ |
| 4.1.2 | Criar migration para booking_notifications | `supabase/migrations/20250121400001_public_booking.sql` | ⬜ |
| 4.1.3 | Atualizar tipos TypeScript | `src/types/database.ts` | ⬜ |

#### 4.2 Perfil Público
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 4.2.1 | Criar página de perfil público | `src/app/n/[username]/page.tsx` | ⬜ |
| 4.2.2 | Criar header do perfil | `src/app/n/[username]/_components/profile-header.tsx` | ⬜ |
| 4.2.3 | Criar tags de especialidades | `src/app/n/[username]/_components/specialties-tags.tsx` | ⬜ |
| 4.2.4 | Criar página de config do perfil público | `src/app/(nutri)/settings/public-profile/page.tsx` | ⬜ |
| 4.2.5 | Criar formulário de perfil público | `src/app/(nutri)/settings/public-profile/_components/public-profile-form.tsx` | ⬜ |

#### 4.3 Calendário de Agendamento
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 4.3.1 | Criar página de agendamento | `src/app/n/[username]/book/page.tsx` | ⬜ |
| 4.3.2 | Criar calendário de disponibilidade | `src/app/n/[username]/book/_components/availability-calendar.tsx` | ⬜ |
| 4.3.3 | Criar seletor de horário | `src/app/n/[username]/book/_components/time-slot-picker.tsx` | ⬜ |
| 4.3.4 | Criar cálculo de disponibilidade pública | `src/lib/scheduling/public-availability.ts` | ⬜ |

#### 4.4 Formulário de Agendamento
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 4.4.1 | Criar formulário de booking | `src/app/n/[username]/book/_components/booking-form.tsx` | ⬜ |
| 4.4.2 | Criar página de confirmação | `src/app/n/[username]/book/confirm/page.tsx` | ⬜ |
| 4.4.3 | Criar API de agendamento público | `src/app/api/booking/public/route.ts` | ⬜ |

#### 4.5 Notificações
| ID | Task | Arquivo | Status |
|----|------|---------|--------|
| 4.5.1 | Criar cron de lembretes | `src/app/api/cron/send-reminders/route.ts` | ⬜ |
| 4.5.2 | Criar serviço de notificação | `src/lib/notifications/send-notification.ts` | ⬜ |
| 4.5.3 | Criar template de confirmação | `src/lib/email/booking-confirmation.tsx` | ⬜ |
| 4.5.4 | Criar template de lembrete | `src/lib/email/reminder-template.tsx` | ⬜ |

---

## Dependências entre Fases

```
Fase 1 (Agendamento) ─────┐
                          ├──→ Fase 4 (Auto-agendamento)
Fase 3 (Multi-tenant) ────┘

Fase 2 (IA Anamnese) → Independente
```

## Ordem Recomendada de Execução

1. **Fase 1** - Base para agendamento (pré-requisito para Fase 4)
2. **Fase 3** - Multi-tenant (pode ser paralelo à Fase 1)
3. **Fase 4** - Depende de Fase 1 e Fase 3
4. **Fase 2** - Pode ser feita a qualquer momento (independente)
