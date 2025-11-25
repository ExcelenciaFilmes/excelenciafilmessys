
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Project {
  id: string;
  title: string;
  brief?: string;
  start_date?: string;
  end_date?: string;
  client_id: string;
  stage: string;
  responsible_user_ids?: string[];
  checklist?: ChecklistItem[];
  script?: string;
  thumbnail?: string; // base64 string
  upload_link?: string;
  owner_id: string;
}

export interface Appointment {
  id: string;
  title: string;
  date: string; // ISO String com data e hora
  description?: string;
  user_id: string;
}

export interface Column {
  id: string;
  title: string;
  projectIds: string[]; 
  order: number;
}

export interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  social_media?: string;
  cpf?: string;
  cnpj?: string;
  address?: string;
  essential_info?: string;
  owner_id: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string | null;
  phone?: string | null; // Novo campo de telefone
  cpf: string | null;
  role: 'Master' | 'Free' | string | null;
  approved?: boolean;
}
