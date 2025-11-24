import React, { useState, useEffect, useCallback } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { supabase } from './supabaseClient.ts';
import Board from './components/Board.tsx';
import { CardModal } from './components/CardModal.tsx';
import { ProjectModal } from './components/ProjectModal.tsx';
import { ClientModal } from './components/ClientModal.tsx';
import { UserModal } from './components/UserModal.tsx';
import Login from './components/Login.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { Project, Column, Client, User } from './types.ts';
import { LogoutIcon, UserIcon, UsersIcon, CalendarIcon, ViewColumnsIcon } from './components/icons.tsx';
import type { Session } from '@supabase/supabase-js';

const defaultColumns: Omit<Column, 'id' | 'projectIds'>[] = [
  { title: 'Ideias', order: 0 },
  { title: 'Briefing', order: 1 },
  { title: 'Filmagem', order: 2 },
  { title: 'Edição', order: 3 },
  { title: 'Tráfego Pago', order: 4 },
  { title: 'Inteligência Artificial', order: 5 },
  { title: 'Concluído', order: 6 },
];

const formatSupabaseError = (error: unknown): string => {
  if (error === null || error === undefined) {
    return "Um erro desconhecido ocorreu.";
  }

  if (typeof error === 'object' && 'message' in error) {
    const err = error as { message: string; details?: string; hint?: string; code?: string };
    let output = `Mensagem: ${err.message}`;
    if (err.details) output += `\nDetalhes: ${err.details}`;
    
    const lowerCaseMessage = err.message.toLowerCase();

    if (lowerCaseMessage.includes("failed to fetch")) {
        output += `\n\n--- ERRO DE CONEXÃO ---\nVerifique sua internet e a URL do Supabase.`;
    }

    return output;
  }

  return `Ocorreu um erro: ${String(error)}`;
};


const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<Column[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board');

  const fetchData = useCallback(async () => {
    try {
      let { data: columnsData, error: columnsError } = await supabase.from('columns').select('*').order('order');
      if (columnsError) throw columnsError;
      
      if (columnsData && columnsData.length === 0) {
        const { data: newColumnsData, error: insertError } = await supabase.from('columns').insert(defaultColumns.map(c => ({ title: c.title, order: c.order }))).select();
        if(insertError) throw insertError;
        columnsData = newColumnsData;
      }

      const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*');
      if (projectsError) throw projectsError;
      
      const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*');
      if (clientsError) throw clientsError;

      const { data: usersData, error: usersError } = await supabase.from('profiles').select('*');
      if (usersError) throw usersError;

      if (!columnsData || !projectsData || !clientsData || !usersData) {
        throw new Error("Dados incompletos retornados do banco.");
      }
      
      const columnsWithProjects = columnsData.map(col => ({
          ...col,
          projectIds: projectsData.filter(project => project.stage === col.title).map(project => project.id)
      }));

      setColumns(columnsWithProjects);
      setProjects(projectsData);
      setClients(clientsData);
      setUsers(usersData);

    } catch (error: any) {
      console.error("Error fetching data:", error);
      const errorMessage = formatSupabaseError(error);
      alert(`Erro ao buscar dados:\n\n${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const getSession = async () => {
        setLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            if (session) {
                await fetchData();
            }
        } catch (err) {
            console.error("Erro sessão:", err);
        } finally {
            setLoading(false);
        }
    };
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session);
        if (session) {
            fetchData();
        }
    });

    return () => subscription.unsubscribe();
  }, [fetchData]);

  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;

    if (type === 'COLUMN') {
        const newColumnOrder = [...columns];
        const [reorderedItem] = newColumnOrder.splice(source.index, 1);
        newColumnOrder.splice(destination.index, 0, reorderedItem);

        setColumns(newColumnOrder);
        const updates = newColumnOrder.map((col, index) => 
            supabase.from('columns').update({ order: index }).eq('id', col.id)
        );
        await Promise.all(updates);
        return;
    }
    
    if (source.droppableId !== destination.droppableId) {
        const newProjects = [...projects];
        const projectIndex = newProjects.findIndex(p => p.id === draggableId);
        const destinationColumn = columns.find(c => c.id === destination.droppableId);

        if (projectIndex > -1 && destinationColumn) {
            newProjects[projectIndex].stage = destinationColumn.title;
            setProjects(newProjects);
            await supabase.from('projects').update({ stage: destinationColumn.title }).eq('id', draggableId);
            
            setColumns(prev => {
                const newColumns = [...prev];
                const sourceCol = newColumns.find(c => c.id === source.droppableId);
                const destCol = newColumns.find(c => c.id === destination.droppableId);
                if(sourceCol && destCol) {
                    sourceCol.projectIds = sourceCol.projectIds.filter(id => id !== draggableId);
                    destCol.projectIds.splice(destination.index, 0, draggableId);
                }
                return newColumns;
            })
        }
    }
  };
  
  const handleSaveProject = async (projectData: Omit<Project, 'id' | 'owner_id' | 'stage'> & { column_id: string }, newClient?: Omit<Client, 'id' | 'owner_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        alert("Sessão inválida.");
        return;
    }

    let finalClientId = projectData.client_id;
    let createdClient: Client | null = null;

    if (newClient && newClient.name) {
      const { data, error } = await supabase.from('clients').insert([{ ...newClient, owner_id: user.id }]).select().single();
      if (error || !data) {
        alert("Erro ao cadastrar novo cliente.");
        return;
      }
      createdClient = data as Client;
      finalClientId = (data as Client).id;
    }

    const targetColumn = columns.find(c => c.id === projectData.column_id);
    if (!targetColumn) {
        alert("Erro: Etapa não encontrada.");
        return;
    }

    const { column_id, ...restOfProjectData } = projectData;

    const projectToInsert = {
      ...restOfProjectData,
      client_id: finalClientId, 
      owner_id: user.id,
      stage: targetColumn.title,
    };

    const { data: newProject, error } = await supabase.from('projects').insert([projectToInsert]).select().single();

    if (error || !newProject) {
      alert(`Erro ao salvar projeto: ${error?.message}`);
    } else {
      const savedProject = newProject as Project;
      if (createdClient) {
        setClients(prev => [...prev, createdClient!]);
      }
      
      setProjects(prev => [...prev, savedProject]);
      setColumns(prev => prev.map(col => 
        col.id === projectData.column_id ? { ...col, projectIds: [...col.projectIds, savedProject.id] } : col
      ));
    }
  }

  const handleUpdateProject = async (updatedProject: Project) => {
    const { error } = await supabase.from('projects').update(updatedProject).eq('id', updatedProject.id);
    if(error) {
      console.error("Error updating project", error);
    } else {
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    }
  }
  
  const handleSaveClient = async (client: Omit<Client, 'id' | 'owner_id'> | Client) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let error, data;
    const isUpdate = 'id' in client;

    if (isUpdate) {
      ({ data, error } = await supabase.from('clients').update(client).eq('id', client.id).select().single());
    } else {
      const clientToSave = { ...client, owner_id: user.id };
      ({ data, error } = await supabase.from('clients').insert([clientToSave]).select().single());
    }

    if (error || !data) {
      alert(`Falha ao salvar o cliente: ${error?.message}`);
    } else {
      const savedClient = data as Client;
      if (isUpdate) {
          setClients(prev => prev.map(c => c.id === savedClient.id ? savedClient : c));
      } else {
          setClients(prev => [...prev, savedClient]);
      }
    }
  }

  const handleDeleteClient = async (clientId: string) => {
    if (window.confirm("Excluir cliente?")) {
      const { error } = await supabase.from('clients').delete().eq('id', clientId);
      if (!error) {
        setClients(prev => prev.filter(c => c.id !== clientId));
      }
    }
  }

  const handleSaveUser = async (user: Omit<User, 'id'> | User, password?: string) => {
    if ('id' in user) {
        const { error } = await supabase.from('profiles').update(user).eq('id', user.id);
        if (error) alert(`Erro: ${error.message}`);
    } else {
        if (!user.email || !password) return;
        const { error } = await supabase.auth.signUp({
            email: user.email,
            password: password,
            options: { data: { name: user.name, cpf: user.cpf, role: user.role } }
        });
        if (error) alert(`Erro: ${error.message}`);
    }
    fetchData();
  }

  const handleDeleteUser = async (userId: string) => {
      if(window.confirm("Excluir usuário?")) {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if(!error) setUsers(prev => prev.filter(u => u.id !== userId));
      }
  }

  const handleLogin = async ({ email, password }: any) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const handleRegister = async ({ name, email, password }: any) => {
    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } }
    });
    if (error) throw error;
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white animate-pulse">Carregando sistema...</p>
        </div>
    );
  }

  if (!session) {
    return <Login onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div className="bg-brand-background text-brand-text-primary h-screen flex flex-col font-sans">
      <header className="p-4 bg-brand-surface/80 backdrop-blur-sm shadow-md flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
             {/* Logo SVG */}
             <div className="w-8 h-8 bg-brand-primary rounded flex items-center justify-center text-brand-background">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
                </svg>
             </div>
             <h1 className="text-xl font-bold tracking-tight">Excelencia Filmes</h1>
        </div>
        <div className="flex items-center space-x-4">
            <button onClick={() => setViewMode('board')} title="Quadro" className={`p-2 rounded-md hover:bg-brand-secondary transition-colors ${viewMode === 'board' ? 'bg-brand-primary/20 text-brand-primary' : ''}`}><ViewColumnsIcon className="w-5 h-5"/></button>
            <button onClick={() => setViewMode('calendar')} title="Agenda" className={`p-2 rounded-md hover:bg-brand-secondary transition-colors ${viewMode === 'calendar' ? 'bg-brand-primary/20 text-brand-primary' : ''}`}><CalendarIcon className="w-5 h-5"/></button>
            <div className="w-px h-6 bg-brand-secondary"></div>
            <button onClick={() => setIsProjectModalOpen(true)} className="px-4 py-2 text-sm rounded-md bg-brand-primary text-brand-background font-bold hover:brightness-110 transition-all shadow-lg shadow-brand-primary/20">Novo Projeto</button>
            <button onClick={() => setIsUserModalOpen(true)} title="Gerenciar Usuários" className="p-2 rounded-md hover:bg-brand-secondary transition-colors"><UsersIcon className="w-5 h-5"/></button>
            <button onClick={() => setIsClientModalOpen(true)} title="Gerenciar Clientes" className="p-2 rounded-md hover:bg-brand-secondary transition-colors"><UserIcon className="w-5 h-5"/></button>
            <button onClick={() => supabase.auth.signOut()} title="Sair" className="p-2 rounded-md hover:bg-brand-secondary transition-colors text-red-400 hover:text-red-300"><LogoutIcon className="w-5 h-5"/></button>
        </div>
      </header>
      <main className="flex-grow p-4 overflow-x-auto">
        {viewMode === 'board' ? (
            (columns.length > 0) ? (
                <Board 
                    columns={columns} 
                    projects={projects} 
                    users={users} 
                    onDragEnd={handleDragEnd} 
                    onProjectClick={setSelectedProject}
                />
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center">
                    <h2 className="text-2xl font-bold">Quadro Vazio</h2>
                    <p className="text-brand-text-secondary">Crie um novo projeto para começar.</p>
                </div>
            )
        ) : (
            <CalendarView 
                projects={projects} 
                clients={clients} 
                onProjectClick={setSelectedProject}
            />
        )}
      </main>
      
      <footer className="p-2 bg-brand-surface text-center text-xs text-brand-text-secondary border-t border-brand-secondary flex justify-between px-6">
        <span>Excelencia Filmes Manager &copy; 2024</span>
        <a 
            href="https://github.com/ExcelenciaFilmes/excelenciafilmessys" 
            target="_blank" 
            rel="noopener noreferrer"
            className="hover:text-brand-primary transition-colors flex items-center gap-1"
        >
            Repositório GitHub &rarr;
        </a>
      </footer>

      {selectedProject && <CardModal project={selectedProject} clients={clients} users={users} onClose={() => setSelectedProject(null)} onUpdateProject={handleUpdateProject} />}
      {isProjectModalOpen && <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSave={handleSaveProject} clients={clients} users={users} columns={columns} />}
      {isClientModalOpen && <ClientModal clients={clients} onClose={() => setIsClientModalOpen(false)} onSave={handleSaveClient} onDelete={handleDeleteClient}/>}
      {isUserModalOpen && <UserModal users={users} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} onDelete={handleDeleteUser}/>}
    </div>
  );
}

export default App;