'use client';

export interface StoredUser {
  id: string;
  nome: string;
  email: string;
  matricula: string;
  senha: string;
  equipe: string;
  cargo: string;
  turma: string; // 'A' | 'B' | 'C' | 'D' | 'GERAL'
  horarioTurno?: string; // Ex: '07:00 às 19:00'
  periodoTurno?: 'Dia' | 'Noite'; // Ex: 'Dia' ou 'Noite'
  criadoPor?: string;
  criadoEm: string;
}

const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'eac0ffcd-e6b5-42fd-88e0-c272577fa0b2',
    nome: 'Líder da Turma',
    email: 'lider@passaturno.com',
    matricula: '9999',
    senha: '123456',
    equipe: 'Liderança CCO',
    cargo: 'LÍDER DE TURMA',
    turma: 'GERAL',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'c3087835-a63f-48c1-9fe8-d8046725ef5a',
    nome: 'Pedro Almeida',
    email: 'turma.a@passaturno.com',
    matricula: '1001',
    senha: '123456',
    equipe: 'Automação A',
    cargo: 'Técnico de Automação (Turma A)',
    turma: 'A',
    horarioTurno: '07:00 às 19:00',
    periodoTurno: 'Dia',
    criadoEm: new Date().toISOString(),
  },
  {
    id: '52d82c5e-121b-48df-8e45-ee0504e08755',
    nome: 'Gabriel',
    email: 'turma.b@passaturno.com',
    matricula: '1002',
    senha: '123456',
    equipe: 'Automação B',
    cargo: 'Técnico de Automação (Turma B)',
    turma: 'B',
    horarioTurno: '07:00 às 19:00',
    periodoTurno: 'Dia',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'e0992388-870f-4663-9f32-15335b9a63df',
    nome: 'JOHN TAVARES',
    email: 'turma.c@passaturno.com',
    matricula: '1003',
    senha: '123456',
    equipe: 'Automação C',
    cargo: 'Técnico de Automação (Turma C)',
    turma: 'C',
    horarioTurno: '07:00 às 19:00',
    periodoTurno: 'Dia',
    criadoEm: new Date().toISOString(),
  },
  {
    id: '6ae38523-f639-48c3-a267-bed8873ff84b',
    nome: 'GUSTAVO BARCELAR',
    email: 'turma.d@passaturno.com',
    matricula: '1004',
    senha: '123456',
    equipe: 'Automação D',
    cargo: 'Técnico de Automação (Turma D)',
    turma: 'D',
    horarioTurno: '19:00 às 07:00',
    periodoTurno: 'Noite',
    criadoEm: new Date().toISOString(),
  },
];

export const userStore = {
  getUsers: (): StoredUser[] => {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    try {
      const saved = localStorage.getItem('passaturno-users-db-production-v1');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('passaturno-users-db-production-v1', JSON.stringify(DEFAULT_USERS));
      return DEFAULT_USERS;
    } catch (e) {
      console.error('Erro ao ler usuários do localStorage:', e);
      return DEFAULT_USERS;
    }
  },

  addUser: (newUser: Omit<StoredUser, 'id' | 'criadoEm'>): StoredUser => {
    const users = userStore.getUsers();
    const created: StoredUser = {
      ...newUser,
      id: `usr-${Date.now()}`,
      criadoEm: new Date().toISOString(),
    };
    const updated = [created, ...users];
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('passaturno-users-db-production-v1', JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao salvar usuário no localStorage:', e);
      }
    }
    return created;
  },

  updateUser: (id: string, updates: Partial<StoredUser>): StoredUser | null => {
    const users = userStore.getUsers();
    let updatedUser: StoredUser | null = null;

    const updatedList = users.map((u) => {
      if (u.id === id) {
        updatedUser = { ...u, ...updates };
        return updatedUser;
      }
      return u;
    });

    if (updatedUser && typeof window !== 'undefined') {
      try {
        localStorage.setItem('passaturno-users-db-production-v1', JSON.stringify(updatedList));
      } catch (e) {
        console.error('Erro ao atualizar usuário no localStorage:', e);
      }
    }

    return updatedUser;
  },

  deleteUser: (id: string): void => {
    const users = userStore.getUsers();
    const filtered = users.filter((u) => u.id !== id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('passaturno-users-db-v3', JSON.stringify(filtered));
      } catch (e) {
        console.error('Erro ao remover usuário:', e);
      }
    }
  },

  findUserByLogin: (login: string): StoredUser | undefined => {
    const clean = login.trim().toLowerCase();
    const users = userStore.getUsers();
    return users.find(
      (u) =>
        u.matricula.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        u.nome.toLowerCase() === clean
    );
  },
};
