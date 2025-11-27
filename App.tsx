
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { supabase } from './supabaseClient.ts';
import Board from './components/Board.tsx';
import { CardModal } from './components/CardModal.tsx';
import { ProjectModal } from './components/ProjectModal.tsx';
import { ClientModal } from './components/ClientModal.tsx';
import { UserModal } from './components/UserModal.tsx';
import { AppointmentModal } from './components/AppointmentModal.tsx';
import Login from './components/Login.tsx';
import { CalendarView } from './components/CalendarView.tsx';
import { Project, Column, Client, User, Appointment } from './types.ts';
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
    
    if (lowerCaseMessage.includes("could not find the 'approved' column") || lowerCaseMessage.includes("could not find the 'role' column")) {
        output += `\n\n--- ⚠️ COLUNA FALTANDO NO BANCO DE DADOS ---\nAcesse o SQL Editor do Supabase e rode:\n\nALTER TABLE profiles ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;\nALTER TABLE profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Free';\nNOTIFY pgrst, 'reload schema';`;
    }

    if (lowerCaseMessage.includes("violates row-level security policy") || lowerCaseMessage.includes("permission denied")) {
        output += `\n\n--- ⚠️ ERRO DE PERMISSÃO (RLS) ---\nO banco de dados bloqueou a edição. Rode este comando no SQL Editor do Supabase para corrigir:\n\nDROP POLICY IF EXISTS "Enable all for authenticated" ON "public"."profiles";\nCREATE POLICY "Enable all for authenticated" ON "public"."profiles" AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);`;
    }

    if (lowerCaseMessage.includes('relation "appointments" does not exist') || lowerCaseMessage.includes('appointments')) {
        output += `\n\n--- ⚠️ TABELA FALTANDO NO BANCO DE DADOS ---\nAcesse o SQL Editor do Supabase e rode:\n\ncreate table if not exists appointments (\n  id uuid default gen_random_uuid() primary key,\n  title text not null,\n  date timestamp with time zone not null,\n  description text,\n  user_id uuid references auth.users(id)\n);`;
    }

    if (lowerCaseMessage.includes('foreign key constraint')) {
        output += `\n\n--- ⚠️ ERRO DE RELACIONAMENTO (FOREIGN KEY) ---\nO banco de dados está com uma regra de chave estrangeira incorreta. Rode este comando no SQL Editor do Supabase para corrigir:\n\nALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;\nALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_user_id_fkey;\nALTER TABLE profiles ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;`;
    }
    
    if (lowerCaseMessage.includes('policy') && lowerCaseMessage.includes('already exists')) {
        output += `\n\n--- ⚠️ ERRO DE DUPLICIDADE DE REGRA (RLS) ---\nA regra de segurança já existe. Use DROP POLICY antes de criar. Exemplo:\n\nDROP POLICY IF EXISTS "Enable all for authenticated" ON "public"."projects";\nCREATE POLICY "Enable all for authenticated" ON "public"."projects" AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);`;
    }

    if (lowerCaseMessage.includes('permission denied for table projects') || lowerCaseMessage.includes('permission denied for table clients')) {
         output += `\n\n--- ⚠️ DADOS BLOQUEADOS PELO BANCO ---\nPara que os usuários vejam os projetos uns dos outros, rode este comando no SQL Editor:\n\nDROP POLICY IF EXISTS "Enable all for authenticated" ON "public"."projects";\nCREATE POLICY "Enable all for authenticated" ON "public"."projects" AS PERMISSIVE FOR ALL TO authenticated USING (true) WITH CHECK (true);\n-- Repita para clients, columns e appointments se necessário.`;
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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [currentUserProfile, setCurrentUserProfile] = useState<User | null>(null);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  
  // States para Compromissos
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedDateForAppointment, setSelectedDateForAppointment] = useState<Date | undefined>(undefined);

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

      const { data: projectsData, error: projectsError } = await supabase.from('projects').select('*');
      if (projectsError) throw projectsError;
      
      const { data: clientsData, error: clientsError } = await supabase.from('clients').select('*');
      if (clientsError) throw clientsError;

      const { data: usersData, error: usersError } = await supabase.from('profiles').select('*');
      if (usersError) throw usersError;

      // Busca compromissos (pode falhar se tabela não existir, tratamos no catch)
      const { data: appointmentsData, error: appointmentsError } = await supabase.from('appointments').select('*');
      if (appointmentsError && appointmentsError.code !== '42P01') { // 42P01 é tabela não existe, ignoramos aqui pra não travar tudo
         throw appointmentsError;
      }

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
      setAppointments(appointmentsData || []);

      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
          let current = usersData.find(u => u.id === session.user.id);
          
          if (session.user.email === MASTER_EMAIL) {
              const adminUser = { ...current, id: session.user.id, email: session.user.email, role: 'Master', approved: true };
              setCurrentUserProfile(adminUser as User);
          } else {
              setCurrentUserProfile(current || null);
          }
      }

    } catch (error: any) {
      console.error("Error fetching data:", error);
      const errorMessage = formatSupabaseError(error);
      // Se for erro de tabela appointments inexistente, mostramos alerta mas deixamos o resto carregar
      if (errorMessage.includes("appointments")) {
         alert(`Atenção: A funcionalidade de Agenda precisa de configuração.\n\n${errorMessage}`);
      } else {
         alert(`Erro ao buscar dados:\n\n${errorMessage}`);
      }
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

  // Lógica de Visibilidade dos Projetos
  const displayProjects = useMemo(() => {
    if (!session?.user) return [];

    const isMaster = currentUserProfile?.role === 'Master' || session.user.email === MASTER_EMAIL;

    // Se for Master e NÃO ativou o filtro "Minhas", mostra tudo
    if (isMaster && !filterMyTasks) {
        return projects;
    }

    // Se for Free, ele força o filtro. Se for Master e ativou "Minhas", também filtra.
    return projects.filter(p => 
        p.owner_id === session.user.id || 
        p.responsible_user_ids?.includes(session.user.id)
    );
  }, [projects, filterMyTasks, session, currentUserProfile]);

  // Lógica de Visibilidade dos Compromissos
  const displayAppointments = useMemo(() => {
      if (!session?.user) return [];

      const isMaster = currentUserProfile?.role === 'Master' || session.user.email === MASTER_EMAIL;

      // Master vê tudo se filtro estiver desligado
      if (isMaster && !filterMyTasks) {
          return appointments;
      }

      // Free vê apenas os seus
      return appointments.filter(a => a.user_id === session.user.id);
  }, [appointments, filterMyTasks, session, currentUserProfile]);

  const handleLogout = async () => {
    try {
        await supabase.auth.signOut();
        setSession(null);
        setCurrentUserProfile(null);
    } catch (error) {
        console.error("Erro ao sair:", error);
    }
  };

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
    if (user.email === MASTER_EMAIL) {
        user.role = 'Master';
        user.approved = true;
    }

    if ('id' in user) {
        // --- ATUALIZAÇÃO DE USUÁRIO EXISTENTE ---
        const previousUserState = users.find(u => u.id === user.id);
        const wasApproved = previousUserState?.approved || false;
        
        // Garante que é booleano estrito
        const isNowApproved = user.approved === true;

        console.log(`Tentando atualizar usuário ${user.id}. Status: ${isNowApproved}`);

        // Usamos .select().single() para ter certeza que o banco persistiu a alteração
        const { data: updatedUserData, error } = await supabase.from('profiles').update({
            name: user.name,
            cpf: user.cpf,
            role: user.role,
            approved: isNowApproved
        })
        .eq('id', user.id)
        .select()
        .single();
        
        if (error) {
            console.error("Erro Supabase update:", error);
            const errorMsg = formatSupabaseError(error);
            alert(`Erro ao atualizar perfil no banco de dados:\n\n${errorMsg}`);
            
            // Reverte para o estado anterior buscando do banco
            fetchData();
        } else if (!updatedUserData) {
             // Caso não retorne erro mas também não retorne dados (comum quando RLS bloqueia)
             alert("Atenção: A atualização não foi salva. \n\nMotivo provável: Seu usuário não tem permissão de banco de dados (RLS) para editar outros usuários.\n\nContate o desenvolvedor para aplicar a política de segurança no Supabase.");
             fetchData();
        } else {
            // SUCESSO!
            const confirmedUser = updatedUserData as User;
            
            // Atualiza o estado local IMEDIATAMENTE com os dados que retornaram DO BANCO
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, ...confirmedUser } : u));

            // Logica de notificação
            if (!wasApproved && confirmedUser.approved && user.email) {
                // Confirmação explícita para evitar bloqueio de pop-ups
                if(window.confirm("✅ Usuário Aprovado e Salvo!\n\nClique em OK para abrir seu e-mail e enviar a notificação ao usuário.")) {
                    const subject = "Acesso Aprovado - Excelencia Filmes";
                    const body = `Olá ${confirmedUser.name},\n\nSeu acesso ao sistema Excelencia Filmes foi aprovado!\n\nAcesse: ${window.location.origin}\n\nAtenciosamente,\nAdministração.`;
                    window.location.href = `mailto:${confirmedUser.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }
            }
        }
    } else {
        // --- CRIAÇÃO DE NOVO USUÁRIO ---
        if (!user.email || !password) return;
        
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: user.email,
            password: password,
            options: { 
                data: { 
                    name: user.name, 
                    cpf: user.cpf,
                    role: user.role || 'Free',
                    approved: true // Auto aprova conforme solicitação recente
                } 
            }
        });

        if (authError) {
            alert(`Erro no Auth: ${authError.message}`);
            return;
        }

        if (authData.user) {
             const { error: profileError } = await supabase.from('profiles').upsert({
                id: authData.user.id,
                email: user.email,
                name: user.name,
                cpf: user.cpf,
                role: user.role || 'Free',
                approved: true
             });
             
             if (profileError) {
                 const errorMsg = formatSupabaseError(profileError);
                 alert(`Usuário criado, mas erro no perfil:\n${errorMsg}`);
             } else {
                // Notificação sem senha (usuário entra direto agora)
                if(window.confirm("✅ Usuário criado com sucesso!\n\nClique em OK para enviar os dados de acesso por e-mail.")) {
                    const subject = "Seu Acesso - Excelencia Filmes";
                    const body = `Olá ${user.name},\n\nSeu cadastro foi criado.\n\nLink: ${window.location.origin}\nLogin: ${user.email}\nSenha Provisória: ${password}\n\nAtenciosamente,\nAdministração.`;
                    window.location.href = `mailto:${user.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }
                // Recarrega tudo para garantir que o novo usuário apareça na lista com ID correto
                fetchData();
             }
        }
    }
  }

  const handleDeleteUser = async (userId: string) => {
      const userToDelete = users.find(u => u.id === userId);
      if (userToDelete?.email === MASTER_EMAIL) {
          alert("O usuário Master principal não pode ser excluído.");
          return;
      }

      if(window.confirm(`Tem certeza que deseja EXCLUIR o usuário ${userToDelete?.name}? Essa ação não pode ser desfeita.`)) {
        const { error } = await supabase.from('profiles').delete().eq('id', userId);
        if(!error) {
            // Se não deu erro, recarrega para confirmar que o banco aceitou (RLS)
            fetchData();
            alert("Usuário excluído com sucesso.");
        } else {
            const errorMsg = formatSupabaseError(error);
            alert(`Erro ao excluir: ${errorMsg}`);
        }
      }
  }

  // --- Lógica de Compromissos (Appointments) ---

  const handleOpenAppointmentModal = (date?: Date) => {
      setSelectedDateForAppointment(date);
      setSelectedAppointment(null);
      setIsAppointmentModalOpen(true);
  }

  const handleEditAppointment = (appointment: Appointment) => {
      setSelectedAppointment(appointment);
      setIsAppointmentModalOpen(true);
  }

  const handleSaveAppointment = async (appointment: Omit<Appointment, 'id' | 'user_id'> | Appointment) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let error, data;
      
      if ('id' in appointment) {
          // Update
          ({ data, error } = await supabase.from('appointments').update(appointment).eq('id', appointment.id).select().single());
      } else {
          // Insert
          const newAppt = { ...appointment, user_id: user.id };
          ({ data, error } = await supabase.from('appointments').insert([newAppt]).select().single());
      }

      if (error) {
          const errMsg = formatSupabaseError(error);
          alert(`Erro ao salvar compromisso: ${errMsg}`);
      } else {
          const savedAppointment = data as Appointment;
          if ('id' in appointment) {
              setAppointments(prev => prev.map(a => a.id === savedAppointment.id ? savedAppointment : a));
          } else {
              setAppointments(prev => [...prev, savedAppointment]);
          }
      }
  }

  const handleDeleteAppointment = async (id: string) => {
      const { error } = await supabase.from('appointments').delete().eq('id', id);
      if (error) {
          alert(`Erro ao excluir: ${error.message}`);
      } else {
          setAppointments(prev => prev.filter(a => a.id !== id));
      }
  }

  const handleLogin = async ({ email, password }: any) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const handleRegister = async ({ name, email, phone, password }: any) => {
    try {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { 
                data: { 
                    name,
                    phone: phone ? phone.replace(/\D/g, '') : null, // Limpa o telefone
                    role: 'Free',
                    approved: true // Auto aprovado conforme solicitação recente
                } 
            }
        });
        
        // Tentamos salvar o telefone na tabela profiles também se o trigger não pegar
        if (!error) {
             // Opcional: atualização redundante se o trigger do Supabase falhar em pegar o metadado
        }

        if (error) throw error;
    } catch (error) {
        throw error;
    }
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

  const isMaster = currentUserProfile?.role === 'Master' || session.user.email === MASTER_EMAIL;
  // Aprovado se estiver true no banco OU se for o email mestre hardcoded
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
                    Você será notificado assim que seu acesso for liberado.
                </p>
                <button 
                    onClick={handleLogout} 
                    className="mt-8 px-6 py-2 bg-brand-secondary hover:bg-brand-secondary/80 text-white rounded transition-colors"
                >
                    Sair e tentar novamente mais tarde
                </button>
            </div>
            <footer className="mt-8 text-xs text-brand-text-secondary">v1.0 - Sistema Online &copy; 2024</footer>
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
            
            {/* Filtro apenas para Master - Free vê apenas as suas obrigatoriamente */}
            {isMaster && (
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
            )}

            <button onClick={() => setViewMode('board')} title="Quadro" className={`p-2 rounded-md hover:bg-brand-secondary transition-colors ${viewMode === 'board' ? 'bg-brand-primary/20 text-brand-primary' : ''}`}><ViewColumnsIcon className="w-5 h-5"/></button>
            <button onClick={() => setViewMode('calendar')} title="Agenda" className={`p-2 rounded-md hover:bg-brand-secondary transition-colors ${viewMode === 'calendar' ? 'bg-brand-primary/20 text-brand-primary' : ''}`}><CalendarIcon className="w-5 h-5"/></button>
            <div className="w-px h-6 bg-brand-secondary"></div>
            
            <button onClick={() => setIsProjectModalOpen(true)} className="px-4 py-2 text-sm rounded-md bg-brand-primary text-brand-background font-bold hover:brightness-110 transition-all shadow-lg shadow-brand-primary/20">Novo Projeto</button>
            
            {isMaster && (
                <button onClick={() => setIsUserModalOpen(true)} title="Gerenciar Usuários (Admin)" className="p-2 rounded-md hover:bg-brand-secondary transition-colors text-brand-primary relative">
                    <UsersIcon className="w-5 h-5"/>
                    {users.some(u => !u.approved) && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                </button>
            )}
            
            <button onClick={() => setIsClientModalOpen(true)} title="Gerenciar Clientes" className="p-2 rounded-md hover:bg-brand-secondary transition-colors"><UserIcon className="w-5 h-5"/></button>
            <button onClick={handleLogout} title="Sair" className="p-2 rounded-md hover:bg-brand-secondary transition-colors text-red-400 hover:text-red-300"><LogoutIcon className="w-5 h-5"/></button>
        </div>
      </header>
      <main className="flex-grow p-4 overflow-x-auto">
        {(filterMyTasks || !isMaster) && (
            <div className="mb-4 bg-brand-primary/10 border border-brand-primary/30 text-brand-primary px-4 py-2 rounded-md text-sm flex items-center gap-2">
                <FilterIcon className="w-4 h-4" />
                <span>Visualizando apenas projetos e compromissos vinculados a você.</span>
                {isMaster && <button onClick={() => setFilterMyTasks(false)} className="ml-auto underline hover:text-white">Ver Todos</button>}
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
                appointments={displayAppointments}
                clients={clients} 
                onProjectClick={setSelectedProject}
                onAddAppointment={handleOpenAppointmentModal}
                onEditAppointment={handleEditAppointment}
            />
        )}
      </main>
      
      <footer className="p-2 bg-brand-surface text-center text-xs text-brand-text-secondary border-t border-brand-secondary flex justify-center px-6">
        <span>v1.0 - Sistema Online &copy; 2024</span>
      </footer>

      {selectedProject && <CardModal project={selectedProject} clients={clients} users={users} onClose={() => setSelectedProject(null)} onUpdateProject={handleUpdateProject} />}
      {isProjectModalOpen && <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} onSave={handleSaveProject} clients={clients} users={users} columns={columns} />}
      {isClientModalOpen && <ClientModal clients={clients} onClose={() => setIsClientModalOpen(false)} onSave={handleSaveClient} onDelete={handleDeleteClient}/>}
      {isUserModalOpen && <UserModal users={users} onClose={() => setIsUserModalOpen(false)} onSave={handleSaveUser} onDelete={handleDeleteUser}/>}
      
      {/* Modal de Compromissos */}
      {isAppointmentModalOpen && (
          <AppointmentModal 
            isOpen={isAppointmentModalOpen}
            onClose={() => setIsAppointmentModalOpen(false)}
            onSave={handleSaveAppointment}
            onDelete={handleDeleteAppointment}
            initialDate={selectedDateForAppointment}
            appointmentToEdit={selectedAppointment}
          />
      )}
    </div>
  );
}

export default App;
