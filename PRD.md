Aqui está o arquivo PRD completo formatado em **Markdown**. Você pode copiar o conteúdo abaixo, salvar em um arquivo chamado `PRD_NutriFlow.md` e fornecê-lo diretamente para o Ralph ou qualquer outra ferramenta de desenvolvimento.

---

# Product Requirements Document (PRD): NutriFlow

## 1. Executive Summary

NutriFlow é uma plataforma SaaS de alta performance para nutricionistas que busca preencher o gap estético e funcional do mercado atual. O foco central é a produtividade do profissional por meio de uma interface elegante ("estilo Apple") e um sistema de montagem de planos alimentares baseado em uma **Timeline Inteligente**. O sistema utiliza **Next.js 16.1** e **Supabase** para garantir velocidade instantânea e uma experiência mobile-first impecável via PWA para o paciente.

## 2. Problem Statement

Softwares de nutrição atuais são visualmente datados, sobrecarregados de informações e possuem fluxos de trabalho lentos (excesso de cliques para montar um plano). Isso gera fadiga no profissional e baixa adesão do paciente ao plano alimentar por falta de clareza visual.

## 3. Goals & Success Metrics

- **UX Superior:** Reduzir o tempo de criação de um plano alimentar em 40% comparado aos concorrentes.
- **Adesão:** Facilitar o acesso do paciente via link direto (sem fricção de login tradicional).
- **Modernidade:** Interface baseada em componentes Shadcn/ui com temas compactos e tipografia refinada.

## 4. User Personas

- **Dra. Helena (Nutricionista):** Focada em eficiência e branding. Quer uma ferramenta que transpareça profissionalismo e modernidade para seus pacientes.
- **Thiago (Paciente):** Quer praticidade. Precisa consultar o plano no celular durante o dia de forma rápida, sem atritos.

## 5. User Stories

- **Como nutricionista**, quero montar um plano usando uma timeline vertical para visualizar o dia do meu paciente de forma cronológica.
- **Como nutricionista**, quero ver gráficos de evolução visual (peso/gordura) para demonstrar resultados de forma clara.
- **Como nutricionista**, quero gerenciar minha agenda de consultas de forma integrada ao prontuário.
- **Como paciente**, quero receber um link via WhatsApp que me dê acesso imediato ao meu plano alimentar sem precisar criar senhas complexas.

## 6. Functional Requirements

- **Gestão de Pacientes:** Cadastro completo, histórico e prontuário.
- **Timeline Inteligente:** Criador de plano alimentar vertical com busca rápida de alimentos (TACO/IBGE).
- **Alimentos Personalizados:** Criação de base própria de alimentos e receitas.
- **Antropometria:** Registro de medidas e upload de fotos para comparação "Antes e Depois".
- **Agenda:** Calendário interno para marcação de consultas.
- **Onboarding Fluido:** Geração de link único/Magic Link para acesso do paciente via WhatsApp.
- **PWA:** Instalação do portal do paciente como aplicativo no celular.

## 7. Technical Requirements

- **Framework:** Next.js 16.1 (App Router).
- **Linguagem:** TypeScript 5.x.
- **UI Kit:** Tailwind CSS v4 + Shadcn/ui (Estilo "Nova").
- **Backend:** Supabase (Auth, PostgreSQL, Storage, Edge Functions).
- **PWA:** Serwist (suporte offline e ícone na home screen).
- **Gráficos:** Recharts com integração Shadcn.

## 8. Data Model

### Profiles (Tabela central de usuários)

- `id`: uuid (primary key)
- `role`: 'nutri' | 'patient'
- `full_name`: text
- `email`: text

### Patients (Relacionado ao Nutri)

- `id`: uuid
- `nutri_id`: uuid (fkey -> profiles.id)
- `birth_date`: date
- `gender`: text
- `goal`: text

### Food Items

- `id`: uuid
- `name`: text
- `calories`, `protein`, `carbs`, `fat`: float
- `source`: 'official' | 'custom'
- `creator_id`: uuid (null se oficial)

### Meal Plans & Timeline

- `meal_plans`: (id, patient_id, nutri_id, status: 'active' | 'archived')
- `meals`: (id, meal_plan_id, time, title, notes)
- `meal_contents`: (id, meal_id, food_id, amount, is_substitution: boolean)

## 9. API Specification (Endpoints Principais)

- `GET /api/patients`: Lista pacientes do nutricionista logado.
- `POST /api/plans/generate-link`: Gera token JWT de acesso rápido para o paciente.
- `GET /api/foods/search?q=...`: Busca na base TACO/IBGE e itens customizados.
- `POST /api/measurements`: Salva dados de antropometria e dispara cálculo de IMC/Gordura.

## 10. UI/UX Requirements

- **Design Language:** Minimalista, uso generoso de espaços em branco, cores neutras (Slate/Zinc).
- **Interações:** Feedback tátil no mobile, esqueletos de carregamento (Skeletons) e transições suaves entre páginas.
- **Acessibilidade:** WCAG AA, suporte total a leitores de tela e contraste adequado.

## 11. Out of Scope (MVP)

- Módulo de pagamentos e faturamento.
- Rastreamento de ingestão de água e lembretes de suplementos.
- Chat interno (comunicação via link externo de WhatsApp).

## 12. Implementation Tasks

### Phase 1: Project Setup

- [x] Inicializar projeto Next.js 16.1 com TypeScript e Turbopack
- [x] Configurar Tailwind CSS v4 e Shadcn/ui (Tema: Neutral)
- [x] Configurar Supabase Client e Middleware de Autenticação
- [ ] Implementar Layout Base (Sidebar Nutri / Bottom Nav Patient)

### Phase 2: Core Infrastructure

- [ ] Criar esquema de banco de dados no Supabase (Migrations)
- [ ] Configurar Row Level Security (RLS) para isolamento de dados
- [ ] Importar base de dados de alimentos (CSV/Seed)
- [ ] Implementar sistema de busca global (Cmd+K)

### Phase 3: Nutritionist Workspace

- [ ] Desenvolver Dashboard com resumo de atendimentos
- [ ] Criar CRUD de pacientes e visualização de perfil
- [ ] Implementar Agenda (Calendário interativo)
- [ ] Criar módulo de Antropometria com gráficos de evolução

### Phase 4: The Smart Timeline

- [ ] Desenvolver o editor de Plano Alimentar (Timeline Vertical)
- [ ] Implementar busca e adição de alimentos com cálculo de macros dinâmico
- [ ] Adicionar sistema de "Opções de Substituição" (Cards expansíveis)
- [ ] Implementar persistência automática (Auto-save) dos planos

### Phase 5: Patient Portal & PWA

- [ ] Criar visualização mobile-first do plano alimentar para o paciente
- [ ] Implementar autenticação via Link Único (Magic Link)
- [ ] Configurar Manifesto PWA e Service Workers para suporte offline
- [ ] Criar botão de compartilhamento via WhatsApp no painel do Nutri

### Phase 6: Polishing

- [ ] Adicionar animações com Framer Motion
- [ ] Implementar Empty States e Skeletons refinados
- [ ] Testes de integração nos fluxos críticos (Criação de plano e login)
