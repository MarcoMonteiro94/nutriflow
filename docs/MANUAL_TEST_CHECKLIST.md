# NutriFlow - Checklist de Testes Manuais

## Sistema de Roles e Permissões

### 1. Criação de Organização

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 1.1 | Criar nova organização | 1. Fazer login<br>2. Ir para /organization/create<br>3. Preencher nome e slug<br>4. Clicar em "Criar" | Organização criada, redirecionado para dashboard | ⬜ |
| 1.2 | Validação de campos obrigatórios | 1. Ir para /organization/create<br>2. Tentar criar sem preencher campos | Mensagens de validação exibidas | ⬜ |
| 1.3 | Slug auto-gerado | 1. Ir para /organization/create<br>2. Digitar nome da clínica | Slug deve ser gerado automaticamente | ⬜ |
| 1.4 | Slug único | 1. Tentar criar organização com slug existente | Erro indicando slug já existe | ⬜ |

### 2. Sistema de Cadastro (Sem Signup Público)

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 2.1 | Página de login sem signup | 1. Acessar /auth/login | Não deve ter botão "Criar conta" visível | ⬜ |
| 2.2 | Mensagem informativa | 1. Acessar /auth/login | Mensagem: "Solicite um convite ao administrador" | ⬜ |
| 2.3 | Signup via convite | 1. Acessar /auth/login?mode=signup&redirect=/invite/TOKEN | Formulário de criar conta aparece | ⬜ |
| 2.4 | Toggle login/signup no convite | 1. Acessar via link de convite<br>2. Clicar "Já tem conta? Entrar" | Alterna entre login e signup | ⬜ |

### 3. Permissões de Convite por Role

#### 3.1 Admin/Proprietário pode convidar

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 3.1.1 | Admin vê todos os roles | 1. Login como Admin<br>2. Ir para /organization/members<br>3. Clicar "Convidar" | Opções: Admin, Nutricionista, Recepcionista, Paciente | ⬜ |
| 3.1.2 | Admin convida Admin | 1. Selecionar role "Admin"<br>2. Enviar convite | Convite criado com sucesso | ⬜ |
| 3.1.3 | Admin convida Nutri | 1. Selecionar role "Nutricionista"<br>2. Enviar convite | Convite criado com sucesso | ⬜ |
| 3.1.4 | Admin convida Recepcionista | 1. Selecionar role "Recepcionista"<br>2. Enviar convite | Convite criado com sucesso | ⬜ |
| 3.1.5 | Admin convida Paciente | 1. Selecionar role "Paciente"<br>2. Enviar convite | Convite criado com sucesso | ⬜ |

#### 3.2 Nutricionista pode convidar (limitado)

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 3.2.1 | Nutri vê roles limitados | 1. Login como Nutricionista<br>2. Ir para /organization/members<br>3. Clicar "Convidar" | Opções: Recepcionista, Paciente (SEM Admin e Nutri) | ⬜ |
| 3.2.2 | Nutri convida Recepcionista | 1. Selecionar role "Recepcionista"<br>2. Enviar convite | Convite criado com sucesso | ⬜ |
| 3.2.3 | Nutri convida Paciente | 1. Selecionar role "Paciente"<br>2. Enviar convite | Convite criado com sucesso | ⬜ |

#### 3.3 Recepcionista pode convidar (muito limitado)

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 3.3.1 | Recepcionista vê só Paciente | 1. Login como Recepcionista<br>2. Ir para /organization/members<br>3. Clicar "Convidar" | Opção: Paciente APENAS | ⬜ |
| 3.3.2 | Recepcionista convida Paciente | 1. Selecionar role "Paciente"<br>2. Enviar convite | Convite criado com sucesso | ⬜ |

#### 3.4 Paciente não pode convidar

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 3.4.1 | Paciente sem botão convidar | 1. Login como Paciente<br>2. Verificar se há acesso a membros | Botão "Convidar" não aparece | ⬜ |

### 4. Convite de Membros

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 4.1 | Abrir modal de convite | 1. Ir para /organization/members<br>2. Clicar em "Convidar" | Modal de convite aparece | ⬜ |
| 4.2 | Validação de email | 1. Abrir modal de convite<br>2. Tentar enviar sem email | Validação de campo obrigatório | ⬜ |
| 4.3 | Descrição do role | 1. Abrir modal de convite<br>2. Selecionar um role | Descrição do role aparece abaixo do select | ⬜ |
| 4.4 | Enviar convite | 1. Preencher email e role<br>2. Clicar em enviar | Convite criado, aparece na lista de pendentes | ⬜ |
| 4.5 | Copiar link do convite | 1. Na lista de convites pendentes<br>2. Clicar no botão de copiar | Link copiado para clipboard | ⬜ |
| 4.6 | Compartilhar via WhatsApp | 1. Na lista de convites pendentes<br>2. Clicar no botão WhatsApp | Abre WhatsApp com link | ⬜ |

### 5. Página de Convite (Não Autenticado)

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 5.1 | Token inválido | 1. Acessar /invite/token-invalido | Mensagem "Convite inválido ou expirado" | ⬜ |
| 5.2 | Token válido - opções de login | 1. Acessar /invite/TOKEN_VALIDO | Mostra nome da organização e opções: Login ou Criar conta | ⬜ |
| 5.3 | Redirecionar para login | 1. Na página de convite válido<br>2. Clicar em "Entrar" | Redireciona para login com redirect param | ⬜ |
| 5.4 | Redirecionar para signup | 1. Na página de convite válido<br>2. Clicar em "Criar conta" | Redireciona para login?mode=signup com redirect param | ⬜ |
| 5.5 | Aceitar após login | 1. Fazer login via link de convite<br>2. Ser redirecionado de volta | Convite aceito automaticamente, membro adicionado | ⬜ |

### 6. Sidebar por Role

#### 6.1 Admin

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 6.1.1 | Menu completo | Login como admin | Ver: Dashboard, Pacientes, Planos, Agenda, Organização, Configurações | ⬜ |
| 6.1.2 | Badge de role | Login como admin | Badge mostra "Admin" ou "Proprietário" | ⬜ |
| 6.1.3 | Acesso a membros | Ir para /organization/members | Pode ver e convidar membros | ⬜ |

#### 6.2 Nutricionista

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 6.2.1 | Menu de nutri | Login como nutricionista | Ver: Dashboard, Pacientes, Planos, Agenda, Configurações | ⬜ |
| 6.2.2 | Badge de role | Login como nutricionista | Badge mostra "Nutricionista" | ⬜ |
| 6.2.3 | Acesso limitado a org | Ir para /organization/members | Pode ver membros e convidar Recepcionista/Paciente | ⬜ |

#### 6.3 Recepcionista

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 6.3.1 | Menu limitado | Login como recepcionista | Ver: Dashboard, Pacientes, Agenda | ⬜ |
| 6.3.2 | Badge de role | Login como recepcionista | Badge mostra "Recepcionista" | ⬜ |
| 6.3.3 | Sem acesso a planos | Tentar acessar /plans | Não ter link ou ser redirecionado | ⬜ |
| 6.3.4 | Pode convidar pacientes | Ir para /organization/members | Pode convidar apenas Pacientes | ⬜ |

#### 6.4 Paciente

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 6.4.1 | Redirecionamento | Login como paciente em organização | Redirecionado para /patient/dashboard | ⬜ |
| 6.4.2 | Dashboard de paciente | Acessar /patient/dashboard | Ver: próximas consultas, plano atual, ações rápidas | ⬜ |
| 6.4.3 | Não ver sidebar de nutri | Como paciente logado | Não deve ver o menu de nutricionista | ⬜ |

### 7. Dashboard do Paciente

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 7.1 | Estatísticas rápidas | Acessar como paciente | Ver cards com próxima consulta e dias no plano | ⬜ |
| 7.2 | Próximas consultas | Acessar como paciente | Lista de consultas agendadas | ⬜ |
| 7.3 | Plano atual | Acessar como paciente | Resumo do plano alimentar ativo | ⬜ |
| 7.4 | Ações rápidas | Acessar como paciente | Botões para ver plano e agendar consulta | ⬜ |
| 7.5 | Sem consultas | Paciente sem consultas | Mensagem "Nenhuma consulta agendada" | ⬜ |
| 7.6 | Sem plano | Paciente sem plano | Mensagem "Nenhum plano ativo" | ⬜ |

### 8. Fluxo Completo de Convite

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 8.1 | Convite → Signup → Aceitar | 1. Admin envia convite<br>2. Copiar link<br>3. Abrir link em aba anônima<br>4. Clicar "Criar conta"<br>5. Preencher dados<br>6. Confirmar email<br>7. Fazer login | Usuário é membro com role correto | ⬜ |
| 8.2 | Convite → Login → Aceitar | 1. Admin envia convite para user existente<br>2. User acessa link<br>3. Clica "Entrar"<br>4. Faz login | Usuário é adicionado com role correto | ⬜ |
| 8.3 | Convite expirado | 1. Criar convite<br>2. Esperar expirar (ou modificar no DB)<br>3. Acessar link | Mensagem "Convite expirado" | ⬜ |
| 8.4 | Convite já aceito | 1. Aceitar convite<br>2. Acessar link novamente | Mensagem apropriada ou redirect | ⬜ |
| 8.5 | WhatsApp flow | 1. Admin envia convite<br>2. Clicar botão WhatsApp<br>3. Enviar mensagem<br>4. Destinatário abre link | Fluxo completo funciona | ⬜ |

### 9. Permissões e Segurança

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 9.1 | RLS - Nutri vê só seus pacientes | 1. Login como nutri A<br>2. Verificar lista de pacientes | Só vê pacientes próprios ou da organização | ⬜ |
| 9.2 | RLS - Paciente vê só seus dados | 1. Login como paciente<br>2. Tentar acessar dados de outro paciente | Não ter acesso | ⬜ |
| 9.3 | API protegida | 1. Tentar chamar API sem auth<br>2. Verificar resposta | 401 Unauthorized | ⬜ |
| 9.4 | Middleware de role | 1. Como recepcionista<br>2. Acessar rota de admin via URL | 403 ou redirect | ⬜ |
| 9.5 | Tentativa de escalação | 1. Modificar request para convidar role não permitido | Deve falhar com erro de permissão | ⬜ |

### 10. UI/UX

| # | Teste | Passos | Resultado Esperado | Status |
|---|-------|--------|-------------------|--------|
| 10.1 | Responsividade mobile | Acessar em tela < 768px | Layout adapta, sidebar vira bottom nav ou hamburger | ⬜ |
| 10.2 | Highlight de menu ativo | Navegar entre páginas | Item do menu atual destacado | ⬜ |
| 10.3 | Loading states | Navegar entre páginas | Skeletons ou spinners durante carregamento | ⬜ |
| 10.4 | Mensagens de erro | Provocar erro (ex: rede off) | Mensagem amigável exibida | ⬜ |
| 10.5 | Toast notifications | Executar ações (criar, editar, deletar) | Toast de sucesso/erro aparece | ⬜ |

---

## Matriz de Permissões de Convite

| Quem convida | Pode convidar |
|--------------|---------------|
| **Admin/Proprietário** | Admin, Nutricionista, Recepcionista, Paciente |
| **Nutricionista** | Recepcionista, Paciente |
| **Recepcionista** | Paciente |
| **Paciente** | Ninguém |

---

## Como Usar Este Checklist

1. **Preparação**: Certifique-se de ter usuários de teste para cada role
2. **Execução**: Marque cada teste com:
   - ✅ Passou
   - ❌ Falhou (adicione nota)
   - ⏭️ Pulado (motivo)
3. **Documentação**: Anote bugs encontrados com:
   - Passos para reproduzir
   - Comportamento esperado vs atual
   - Screenshots se possível

## Usuários de Teste Sugeridos

```
Admin/Proprietário:
- Email: test-admin@nutriflow.test
- Senha: TestPassword123!

Nutricionista:
- Email: test-nutri@nutriflow.test
- Senha: TestPassword123!

Recepcionista:
- Email: test-receptionist@nutriflow.test
- Senha: TestPassword123!

Paciente:
- Email: test-patient@nutriflow.test
- Senha: TestPassword123!
```

## Bugs Encontrados

| # | Descrição | Severidade | Status |
|---|-----------|------------|--------|
| | | | |

---

*Última atualização: Janeiro 2025*
