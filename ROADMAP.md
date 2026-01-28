# NutriFlow - Roadmap

> Última atualização: Janeiro 2026

## Visão Geral

Este documento organiza todas as issues do projeto por prioridade e fase de desenvolvimento.

```
Fase 1: Beta v1 (Crítico)     ████████░░░░░░░░░░░░  40%
Fase 2: Beta v1 (Features)    ░░░░░░░░░░░░░░░░░░░░   0%
Fase 3: Tech Debt             ░░░░░░░░░░░░░░░░░░░░   0%
Fase 4: Portal do Paciente    ░░░░░░░░░░░░░░░░░░░░   0%
Fase 5: Features Adicionais   ░░░░░░░░░░░░░░░░░░░░   0%
Fase 6: Qualidade             ░░░░░░░░░░░░░░░░░░░░   0%
```

---

## Fase 1: Beta v1 - Crítico

> **Objetivo:** Corrigir bugs críticos e issues de segurança antes do lançamento beta
> **Status:** Em andamento

### Bugs de Segurança

| Issue | Título | Labels | Status |
|-------|--------|--------|--------|
| [#14](https://github.com/MarcoMonteiro94/nutriflow/issues/14) | fix: storage RLS muito permissivo | `bug` `beta` `security` | ⏳ Pendente |

### Bugs Críticos

| Issue | Título | Labels | Status |
|-------|--------|--------|--------|
| [#13](https://github.com/MarcoMonteiro94/nutriflow/issues/13) | fix: corrigir 5 erros críticos de ESLint | `bug` `beta` | ⏳ Pendente |
| [#15](https://github.com/MarcoMonteiro94/nutriflow/issues/15) | fix: paciente não consegue ver anamnese | `bug` | ⏳ Pendente |
| [#16](https://github.com/MarcoMonteiro94/nutriflow/issues/16) | fix: recepcionista sem acesso a tabelas de medições | `bug` | ⏳ Pendente |

### Features Críticas para Beta

| Issue | Título | Labels | Status |
|-------|--------|--------|--------|
| [#25](https://github.com/MarcoMonteiro94/nutriflow/issues/25) | feat: importação de dados de outras plataformas (Numax, WebDiet) | `enhancement` `beta` `critical` | ⏳ Pendente |

---

## Fase 2: Beta v1 - Features Essenciais

> **Objetivo:** Completar features marcadas para o lançamento beta
> **Dependência:** Fase 1 concluída

| Issue | Título | Labels | Status |
|-------|--------|--------|--------|
| [#10](https://github.com/MarcoMonteiro94/nutriflow/issues/10) | feat: adicionar análise de Anamnese com IA | `enhancement` `beta` | ⏳ Pendente |
| [#12](https://github.com/MarcoMonteiro94/nutriflow/issues/12) | feat: notificações por email | `enhancement` `beta` | ⏳ Pendente |

---

## Fase 3: Tech Debt

> **Objetivo:** Limpar débito técnico e melhorar qualidade do código
> **Dependência:** Beta v1 lançado

| Issue | Título | Labels | Status |
|-------|--------|--------|--------|
| [#18](https://github.com/MarcoMonteiro94/nutriflow/issues/18) | chore: limpar 92 warnings de ESLint | `tech-debt` | ⏳ Pendente |
| [#23](https://github.com/MarcoMonteiro94/nutriflow/issues/23) | fix: adicionar constraint organização-paciente | `tech-debt` | ⏳ Pendente |

---

## Fase 4: Portal do Paciente

> **Objetivo:** Novo fluxo de aquisição de pacientes com busca e agendamento
> **Dependência:** Fase 2 concluída (especialmente #12 para notificações)

### Epic: Autenticação Aberta

| Issue | Título | Dependências | Status |
|-------|--------|--------------|--------|
| [#11](https://github.com/MarcoMonteiro94/nutriflow/issues/11) | feat: adicionar login com Google | - | ⏳ Pendente |
| [#26](https://github.com/MarcoMonteiro94/nutriflow/issues/26) | feat: signup público para pacientes | #11 (opcional) | ⏳ Pendente |

### Epic: Localização e Busca

| Issue | Título | Dependências | Status |
|-------|--------|--------------|--------|
| [#27](https://github.com/MarcoMonteiro94/nutriflow/issues/27) | feat: adicionar campos de endereço às organizações | - | ⏳ Pendente |
| [#28](https://github.com/MarcoMonteiro94/nutriflow/issues/28) | feat: busca de nutricionistas por proximidade | #27 | ⏳ Pendente |

### Epic: Agendamento pelo Paciente

| Issue | Título | Dependências | Status |
|-------|--------|--------------|--------|
| [#29](https://github.com/MarcoMonteiro94/nutriflow/issues/29) | feat: agendamento pelo paciente | #28, #12 | ⏳ Pendente |

### Diagrama de Dependências

```
                    ┌─────────────────┐
                    │  #11 Google     │
                    │     OAuth       │
                    └────────┬────────┘
                             │ (opcional)
                             ▼
┌─────────────────┐  ┌─────────────────┐
│  #27 Endereço   │  │  #26 Signup     │
│  Organizações   │  │    Público      │
└────────┬────────┘  └─────────────────┘
         │
         ▼
┌─────────────────┐
│  #28 Busca      │
│  Proximidade    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐  ┌─────────────────┐
│  #29 Agendamento│◄─│  #12 Email      │
│    Paciente     │  │  Notificações   │
└─────────────────┘  └─────────────────┘
```

### Ordem de Implementação Recomendada

1. **#27** - Endereço nas organizações (base para busca)
2. **#11** - Google OAuth (melhora UX de signup)
3. **#26** - Signup público (depende parcialmente de #11)
4. **#28** - Busca por proximidade (depende de #27)
5. **#29** - Agendamento pelo paciente (depende de #28 e #12)

---

## Fase 5: Features Adicionais

> **Objetivo:** Funcionalidades que agregam valor mas não são críticas
> **Dependência:** Fases anteriores concluídas

### Comunicação

| Issue | Título | Labels | Status |
|-------|--------|--------|--------|
| [#17](https://github.com/MarcoMonteiro94/nutriflow/issues/17) | feat: PWA com notificações push | `enhancement` | ⏳ Pendente |
| [#22](https://github.com/MarcoMonteiro94/nutriflow/issues/22) | feat: integração com WhatsApp | `enhancement` | ⏳ Pendente |

### Analytics e Relatórios

| Issue | Título | Labels | Status |
|-------|--------|--------|--------|
| [#20](https://github.com/MarcoMonteiro94/nutriflow/issues/20) | feat: dashboard com métricas do negócio | `enhancement` | ⏳ Pendente |
| [#21](https://github.com/MarcoMonteiro94/nutriflow/issues/21) | feat: relatórios PDF personalizados | `enhancement` | ⏳ Pendente |

---

## Fase 6: Qualidade e Testes

> **Objetivo:** Melhorar cobertura de testes e acessibilidade
> **Nota:** Pode ser executada em paralelo com outras fases

| Issue | Título | Labels | Status |
|-------|--------|--------|--------|
| [#19](https://github.com/MarcoMonteiro94/nutriflow/issues/19) | test: adicionar testes unitários (cobertura 30%) | `testing` | ⏳ Pendente |
| [#24](https://github.com/MarcoMonteiro94/nutriflow/issues/24) | test: testes de acessibilidade (WCAG) | `testing` | ⏳ Pendente |

---

## Resumo por Labels

| Label | Issues | Prioridade |
|-------|--------|------------|
| `beta` + `security` | #14 | Crítica |
| `beta` + `critical` | #25 | Crítica |
| `beta` | #10, #12, #13 | Alta |
| `bug` | #14, #13, #15, #16 | Alta |
| `tech-debt` | #18, #23 | Média |
| `enhancement` | #11, #17, #20, #21, #22, #26, #27, #28, #29 | Média/Baixa |
| `testing` | #19, #24 | Contínua |

---

## Legenda

| Status | Significado |
|--------|-------------|
| ⏳ Pendente | Aguardando início |
| 🔄 Em andamento | Trabalho iniciado |
| 🔍 Em revisão | PR aberto, aguardando review |
| ✅ Concluído | Merged e deployed |
| ❌ Cancelado | Issue descartada |

---

## Notas

- Issues com label `beta` são prioritárias para o lançamento
- Issues de `security` devem ser tratadas imediatamente
- A Fase 6 (Testes) pode ser executada em paralelo com outras fases
- Ordem das fases pode ser ajustada conforme necessidades do negócio
