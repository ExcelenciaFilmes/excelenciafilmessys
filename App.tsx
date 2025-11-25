
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { LogoutIcon, UserIcon, UsersIcon, CalendarIcon, ViewColumnsIcon, ExcelenciaLogo, FilterIcon } from './components/icons.tsx';
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

const MASTER_EMAIL = 'danielmachado@excelenciafilmes.com.br';

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [columns, setColumns] = useState<Column[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'board' | 'calendar'>('board');
  
  // Estado para filtro de tarefas
  const [filterMyTasks, setFilterMyTasks] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      let { data: columnsData, error: columnsError } = await supabase.from('columns').select('*').order('order');
      if (columnsError) throw columnsError;
      
      if (columnsData && columnsData.length === 0) {
        const { data: newColumnsData, error: insertError } = await supabase.from('columns').insert(defaultColumns.map(c => ({ title: c.title, order: c.order }))).select();
        if(insertError) throw insertError;
        columnsData = newColumnsData;
      }

      // Busca TODOS os projetos (visibilidade global)
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

      // Definir perfil do usuário atual
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
          let current = usersData.find(u => u.id === session.user.id);
          // Hardcode de segurança para o Daniel
          if (session.user.email === MASTER_EMAIL) {
              const adminUser = { ...current, id: session.user.id, email: session.user.email, role: 'Master', approved: true };
              // Se não existir no banco, cria visualmente
              setCurrentUserProfile(adminUser as User);
          } else {
              setCurrentUserProfile(current || null);
          }
      }

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

  // Lógica de Filtro: Projetos que serão exibidos no Board/Calendar
  const displayProjects = useMemo(() => {
    if (!filterMyTasks || !session?.user) {
        return projects; // Retorna todos (Visibilidade Global)
    }
    // Filtro Pessoal
    return projects.filter(p => 
        p.owner_id === session.user.id || 
        p.responsible_user_ids?.includes(session.user.id)
    );
  }, [projects, filterMyTasks, session]);

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
    // Se o email for do Daniel, força Master e Aprovado
    if (user.email === MASTER_EMAIL) {
        user.role = 'Master';
        user.approved = true;
    }

    if ('id' in user) {
        // Verifica o estado anterior do usuário para detectar se foi aprovado agora
        const previousUserState = users.find(u => u.id === user.id);
        const wasApproved = previousUserState?.approved || false;
        const isNowApproved = user.approved || false;

        // Atualização de usuário existente
        const { error } = await supabase.from('profiles').update({
            name: user.name,
            cpf: user.cpf,
            role: user.role,
            approved: user.approved
        }).eq('id', user.id);
        
        if (error) {
            alert(`Erro: ${error.message}`);
        } else {
            // Se o usuário não estava aprovado e agora está, envia o email e exibe mensagem
            if (!wasApproved && isNowApproved && user.email) {
                // Envia email de validação (Magic Link / Reset de Senha)
                // Isso garante que o usuário receba um link para entrar/definir senha e acessar
                const { error: mailError } = await supabase.auth.resetPasswordForEmail(user.email, {
                    redirectTo: window.location.origin,
                });

                if (mailError) {
                    alert(`✅ Usuário Aprovado no Sistema!\n\n⚠️ Porém, houve um erro ao enviar o e-mail automático: ${mailError.message}\n\nPor favor, avise o usuário manualmente.`);
                } else {
                    alert("✅ Usuário Validado e E-mail Enviado!\n\nO sistema enviou automaticamente um e-mail para o usuário contendo um link para validar o acesso e entrar no sistema.");
                }
            } else {
                alert("Usuário atualizado com sucesso.");
            }
        }
    } else {
        // Criação de novo usuário
        if (!user.email || !password) return;
        
        // Primeiro cria no Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: password,
            options: { 
                data: { 
                    name: user.name, 
                    cpf: user.cpf,
                    role: user.role || 'Free',
                    approved: user.approved || false 
                } 
            }
        });

        if (authError) {
            alert(`Erro no Auth: ${authError.message}`);
            return;
        }

        // Se o trigger do Supabase falhar ou não existir, inserimos manualmente no profiles
        if (authData.user) {
             const { error: profileError } = await supabase.from('profiles').upsert({
                id: authData.user.id,
                email: user.email,
                name: user.name,
                cpf: user.cpf,
                role: user.role || 'Free',
                approved: user.approved || false
             });
             
             if (profileError) {
                console.error("Erro ao criar perfil manual:", profileError);
             } else {
                // Se criou já aprovado (Master criando usuário), mostra a mensagem também
                if (user.approved) {
                    alert("✅ Usuário Criado e Validado!\n\nAs informações de acesso foram processadas.");
                } else {
                    alert("Usuário convidado com sucesso.");
                }
             }
        }
    }
    fetchData();
  }

  const handleDeleteUser = async (userId: string) => {
      const userToDelete = users.find(u => u.id === userId);
      if (userToDelete?.email === MASTER_EMAIL) {
          alert("O usuário Master principal não pode ser excluído.");
          return;
      }

      if(window.confirm(`Tem certeza que deseja EXCLUIR o usuário ${userToDelete?.name}? Essa ação não pode ser desfeita.`)) {
        // Nota: Deletar do 'profiles' não deleta do Auth automaticamente sem uma Edge Function no Supabase,
        // mas remove da lista visual do sistema e bloqueia o acesso.
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if(!error) {
            setUsers(prev => prev.filter(u => u.id !== userId));
            alert("Usuário excluído com sucesso.");
        } else {
            alert(`Erro ao excluir: ${error.message}`);
        }
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
        options: { 
            data: { 
                name,
                role: 'Free', // Padrão Free
                approved: false // Padrão Bloqueado
            } 
        }
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

  // Lógica de Bloqueio para usuários não aprovados
  const isMaster = currentUserProfile?.role === 'Master' || session.user.email === MASTER_EMAIL;
  const isApproved = currentUserProfile?.approved === true || session.user.email === MASTER_EMAIL;

  if (!isApproved) {
      return (
        <div className="min-h-screen bg-brand-background flex flex-col items-center justify-center p-6 text-center">
            <ExcelenciaLogo className="h-24 w-24 mb-6" />
            <div className="bg-brand-surface p-8 rounded-lg shadow-xl max-w-md border-l-4 border-yellow-500">
                <h2 className="text-2xl font-bold text-brand-text-primary mb-4">Acesso em Análise</h2>
                <p className="text-brand-text-secondary mb-6">
                    Olá, <span className="text-brand-primary font-bold">{currentUserProfile?.name || session.user.email}</span>.
                </p>
                <p className="text-gray-300 mb-6">
                    Seu cadastro foi recebido, mas ainda está <strong>pendente de validação</strong> pela administração.
                </p>
                <p className="text-sm text-gray-400">
                    Você receberá uma confirmação assim que seu acesso for liberado. Se precisar de urgência, entre em contato com o administrador.
                </p>
                <button 
                    onClick={() => supabase.auth.signOut()} 
                    className="mt-8 px-6 py-2 bg-brand-secondary hover:bg-brand-secondary/80 text-white rounded transition-colors"
                >
                    Sair e tentar novamente mais tarde
                </button>
            </div>
            <footer className="mt-8 text-xs text-brand-text-secondary">Excelência Filmes &copy; 2024</footer>
        </div>
      );
  }

  return (
    <div className="bg-brand-background text-brand-text-primary h-screen flex flex-col font-sans">
      <header className="p-4 bg-brand-surface/80 backdrop-blur-sm shadow-md flex justify-between items-center flex-shrink-0">
        <div className="flex items-center gap-3">
             <ExcelenciaLogo className="h-10 w-10" />
             <div className="flex flex-col">
                <h1 className="text-xl font-bold tracking-tight leading-none">Excelencia Filmes</h1>
                <span className="text-[10px] text-brand-text-secondary uppercase tracking-wider font-bold mt-1">
                    {isMaster ? 'Acesso Master' : 'Acesso Padrão'}
                </span>
             </div>
        </div>
        <div className="flex items-center space-x-4">
            {/* Toggle de Filtro: Todos vs Meus */}
            <div className="flex items-center bg-brand-background/50 rounded-md p-1 mr-2 border border-brand-secondary">
                 <button 
                    onClick={() => setFilterMyTasks(false)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all ${!filterMyTasks ? 'bg-brand-secondary text-brand-text-primary shadow-sm' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                 >
                    Todos
                 </button>
                 <button 
                    onClick={() => setFilterMyTasks(true)}
                    className={`px-3 py-1.5 rounded text-xs font-semibold transition-all flex items-center gap-1 ${filterMyTasks ? 'bg-brand-primary text-brand-background shadow-sm' : 'text-brand-text-secondary hover:text-brand-text-primary'}`}
                 >
                    <FilterIcon className="w-3 h-3" /> Minhas
                 </button>
            </div>

            <button onClick={() => setViewMode('board')} title="Quadro" className={`p-2 rounded-md hover:bg-brand-secondary transition-colors ${viewMode === 'board' ? 'bg-brand-primary/20 text-brand-primary' : ''}`}><ViewColumnsIcon className="w-5 h-5"/></button>
            <button onClick={() => setViewMode('calendar')} title="Agenda" className={`p-2 rounded-md hover:bg-brand-secondary transition-colors ${viewMode === 'calendar' ? 'bg-brand-primary/20 text-brand-primary' : ''}`}><CalendarIcon className="w-5 h-5"/></button>
            <div className="w-px h-6 bg-brand-secondary"></div>
            
            <button onClick={() => setIsProjectModalOpen(true)} className="px-4 py-2 text-sm rounded-md bg-brand-primary text-brand-background font-bold hover:brightness-110 transition-all shadow-lg shadow-brand-primary/20">Novo Projeto</button>
            
            {/* Somente Master pode gerenciar usuários */}
            {isMaster && (
                <button onClick={() => setIsUserModalOpen(true)} title="Gerenciar Usuários (Admin)" className="p-2 rounded-md hover:bg-brand-secondary transition-colors text-brand-primary relative">
                    <UsersIcon className="w-5 h-5"/>
                    {/* Indicador se houver usuários pendentes */}
                    {users.some(u => !u.approved) && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                </button>
            )}
            
            <button onClick={() => setIsClientModalOpen(true)} title="Gerenciar Clientes" className="p-2 rounded-md hover:bg-brand-secondary transition-colors"><UserIcon className="w-5 h-5"/></button>
            <button onClick={() => supabase.auth.signOut()} title="Sair" className="p-2 rounded-md hover:bg-brand-secondary transition-colors text-red-400 hover:text-red-300"><LogoutIcon className="w-5 h-5"/></button>
        </div>
      </header>
      <main className="flex-grow p-4 overflow-x-auto">
        {/* Banner informativo se o filtro estiver ativo */}
        {filterMyTasks && (
            <div className="mb-4 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary px-4 py-2 rounded-md text-sm flex items-center gap-2">
                <FilterIcon className="w-4 h-4" />
                <span>Visualizando apenas projetos onde você é <strong>Dono</strong> ou <strong>Responsável</strong>.</span>
                <button onClick={() => setFilterMyTasks(false)} className="ml-auto underline hover:text-white">Ver Todos</button>
            </div>
        )}

        {viewMode === 'board' ? (
            (columns.length > 0) ? (
                <Board 
                    columns={columns} 
                    projects={displayProjects} 
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
                projects={displayProjects} 
                clients={clients} 
                onProjectClick={setSelectedProject}
            />
        )}
      </main>
      
      <footer className="p-2 bg-brand-surface text-center text-xs text-brand-text-secondary border-t border-brand-secondary flex justify-between px-6">
        <span>v1.0 - Sistema Online &copy; 2024</span>
        <a 
            href="https://github.com/ExcelenciaFilmes/excelenciafilmessys.git" 
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
      {/* Modal de Usuário só abre se for Master, mas a proteção de renderização já está no botão */}
      {isUserModalOpen && <UserModal users={users} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} onDelete={handleDeleteUser}/>}
    </div>
  );
}

export default App;
