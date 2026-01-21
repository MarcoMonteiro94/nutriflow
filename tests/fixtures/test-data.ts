/**
 * Test data for Playwright E2E tests
 */

export const testUsers = {
  nutritionist: {
    email: 'test-nutri@nutriflow.test',
    password: 'TestPassword123!',
    fullName: 'Test Nutricionista',
  },
  nutritionist2: {
    email: 'test-nutri2@nutriflow.test',
    password: 'TestPassword123!',
    fullName: 'Second Nutricionista',
  },
};

export const testPatients = {
  patient1: {
    fullName: 'João Silva Test',
    email: 'joao.silva@test.com',
    phone: '(11) 99999-0001',
    birthDate: '1990-05-15',
    gender: 'masculino',
    goal: 'Emagrecimento',
    notes: 'Paciente de teste - alergia a amendoim',
  },
  patient2: {
    fullName: 'Maria Santos Test',
    email: 'maria.santos@test.com',
    phone: '(11) 99999-0002',
    birthDate: '1985-10-20',
    gender: 'feminino',
    goal: 'Ganho de massa muscular',
    notes: 'Paciente de teste - vegetariana',
  },
  patientMinimal: {
    fullName: 'Paciente Minimal Test',
  },
};

export const testMealPlans = {
  plan1: {
    title: 'Plano de Emagrecimento Test',
    description: 'Plano alimentar para perda de peso gradual',
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  plan2: {
    title: 'Plano de Hipertrofia Test',
    description: 'Plano alimentar para ganho de massa muscular',
    startsAt: new Date().toISOString().split('T')[0],
    endsAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
};

export const testMeals = {
  breakfast: {
    type: 'cafe',
    title: 'Café da Manhã',
    time: '07:00',
  },
  lunch: {
    type: 'almoco',
    title: 'Almoço',
    time: '12:00',
  },
  dinner: {
    type: 'jantar',
    title: 'Jantar',
    time: '19:00',
  },
  custom: {
    type: 'custom',
    title: 'Pré-Treino Test',
    time: '16:00',
  },
};

export const testAppointments = {
  appointment1: {
    date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '09:00',
    duration: 60,
    notes: 'Primeira consulta de teste',
  },
  appointment2: {
    date: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0],
    time: '14:00',
    duration: 30,
    notes: 'Retorno de teste',
  },
};

export const invalidCredentials = {
  wrongEmail: 'wrong@email.com',
  wrongPassword: 'WrongPassword123!',
  invalidEmail: 'not-an-email',
  shortPassword: '123',
};

export const formValidation = {
  requiredFieldMessage: 'Preencha este campo',
  invalidEmailMessage: 'email',
};
