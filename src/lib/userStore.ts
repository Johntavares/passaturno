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
  criadoPor?: string;
  criadoEm: string;
}

const DEFAULT_USERS: StoredUser[] = [
  {
    id: 'usr-lider-default',
    nome: 'John Tavares (Líder)',
    email: 'john.tavares@passaturno.com',
    matricula: '9001',
    senha: 'passaturno2026',
    equipe: 'Gestão Multiturmas (A, B, C, D)',
    cargo: 'LÍDER DE TURMA',
    turma: 'GERAL',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'usr-turma-a',
    nome: 'Operador Turma A',
    email: 'turma.a@passaturno.com',
    matricula: '1001',
    senha: 'passaturno2026',
    equipe: 'Automação & CCO (Turma A)',
    cargo: 'Técnico de Automação',
    turma: 'A',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'usr-turma-b',
    nome: 'Operador Turma B',
    email: 'turma.b@passaturno.com',
    matricula: '1002',
    senha: 'passaturno2026',
    equipe: 'Automação & CCO (Turma B)',
    cargo: 'Técnico de Automação',
    turma: 'B',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'usr-turma-c',
    nome: 'Operador Turma C',
    email: 'turma.c@passaturno.com',
    matricula: '1003',
    senha: 'passaturno2026',
    equipe: 'Automação & CCO (Turma C)',
    cargo: 'Técnico de Automação',
    turma: 'C',
    criadoEm: new Date().toISOString(),
  },
  {
    id: 'usr-turma-d',
    nome: 'Operador Turma D',
    email: 'turma.d@passaturno.com',
    matricula: '1004',
    senha: 'passaturno2026',
    equipe: 'Automação & CCO (Turma D)',
    cargo: 'Técnico de Automação',
    turma: 'D',
    criadoEm: new Date().toISOString(),
  },
];

export const userStore = {
  getUsers: (): StoredUser[] => {
    if (typeof window === 'undefined') return DEFAULT_USERS;
    try {
      const saved = localStorage.getItem('passaturno-users-db-v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      localStorage.setItem('passaturno-users-db-v2', JSON.stringify(DEFAULT_USERS));
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
        localStorage.setItem('passaturno-users-db-v2', JSON.stringify(updated));
      } catch (e) {
        console.error('Erro ao salvar usuário no localStorage:', e);
      }
    }
    return created;
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
