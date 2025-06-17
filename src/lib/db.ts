import Dexie, { Table } from 'dexie';

export interface User {
  id: string;
  email: string;
  name: string;
  image?: string;
  provider: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Workspace {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Card {
  id: string;
  workspaceId: string;
  title: string;
  content: string; // Rich text content as HTML
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Connection {
  id: string;
  workspaceId: string;
  fromCardId: string;
  toCardId: string;
  type: 'arrow' | 'line';
  createdAt: Date;
}

export class JotDatabase extends Dexie {
  users!: Table<User>;
  workspaces!: Table<Workspace>;
  cards!: Table<Card>;
  connections!: Table<Connection>;

  constructor() {
    super('JotDatabase');
    this.version(1).stores({
      users: 'id, email, provider',
      workspaces: 'id, userId, name',
      cards: 'id, workspaceId, x, y',
      connections: 'id, workspaceId, fromCardId, toCardId'
    });
  }
}

export const db = new JotDatabase();
