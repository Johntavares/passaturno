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
    id: 'usr-lider-official',
    nome: 'Líder da Turma',
    email: 'lider@passaturno.com',
    matricula: '9001',
    senha: '123456',
    equipe: 'Gestão Multiturmas (A, B, C, D)',
    cargo: 'LÍDER DE TURMA',
    turma: 'GERAL',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'usr-turma-a-official',
    nome: 'Operador Turma A',
    email: 'turma.a@passaturno.com',
    matricula: '1001',
    senha: '123456',
    equipe: 'Automação & CCO (Turma A)',
    cargo: 'Técnico de Automação (Turma A)',
    turma: 'A',
    horarioTurno: '07:00 às 19:00',
    periodoTurno: 'Dia',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'usr-turma-b-official',
    nome: 'Operador Turma B',
    email: 'turma.b@passaturno.com',
    matricula: '1002',
    senha: '123456',
    equipe: 'Automação & CCO (Turma B)',
    cargo: 'Técnico de Automação (Turma B)',
    turma: 'B',
    horarioTurno: '07:00 às 19:00',
    periodoTurno: 'Dia',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'usr-turma-c-official',
    nome: 'Operador Turma C',
    email: 'turma.c@passaturno.com',
    matricula: '1003',
    senha: '123456',
    equipe: 'Automação & CCO (Turma C)',
    cargo: 'Técnico de Automação (Turma C)',
    turma: 'C',
    horarioTurno: '07:00 às 19:00',
    periodoTurno: 'Dia',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'usr-turma-d-official',
    nome: 'Operador Turma D',
    email: 'turma.d@passaturno.com',
    matricula: '1004',
    senha: '123456',
    equipe: 'Automação & CCO (Turma D)',
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
