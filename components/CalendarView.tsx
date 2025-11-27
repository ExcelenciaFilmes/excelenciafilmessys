
import React, { useState } from 'react';
import { Project, Client, Appointment } from '../types.ts';
import { PlusIcon, GoogleIcon } from './icons';

interface CalendarViewProps {
  projects: Project[];
  appointments: Appointment[];
  clients: Client[];
  onProjectClick: (project: Project) => void;
  onAddAppointment: (date?: Date) => void;
  onEditAppointment: (appointment: Appointment) => void;
}

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Link específico para alexandrematos@excelenciafilmes.com.br (CID Base64 Encoded)
const GOOGLE_CALENDAR_LINK = "https://calendar.google.com/calendar/u/0?cid=YWxleGFuZHJlbWF0b3NAZXhjZWxlbmNpYWZpbG1lcy5jb20uYnI";

export const CalendarView: React.FC<CalendarViewProps> = ({ projects, appointments, clients, onProjectClick, onAddAppointment, onEditAppointment }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  const startDay = startOfMonth.getDay();
  const daysInMonth = endOfMonth.getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };
  
  const getClientName = (clientId: string) => clients.find(c => c.id === clientId)?.name || 'N/A';
  
  // Agrupa Projetos por dia
  const projectsByDay: { [key: number]: Project[] } = {};
  projects.forEach(project => {
    if (!project.end_date) return;
    const deadline = new Date(project.end_date);
    // Ajuste de fuso horário simples para visualização correta do dia
    const adjustedDeadline = new Date(deadline.valueOf() + deadline.getTimezoneOffset() * 60000);
    
    if (adjustedDeadline.getMonth() === currentDate.getMonth() && adjustedDeadline.getFullYear() === currentDate.getFullYear()) {
      const day = adjustedDeadline.getDate();
      if (!projectsByDay[day]) {
        projectsByDay[day] = [];
      }
      projectsByDay[day].push(project);
    }
  });

  // Agrupa Compromissos por dia
  const appointmentsByDay: { [key: number]: Appointment[] } = {};
  appointments.forEach(app => {
      const appDate = new Date(app.date);
       if (appDate.getMonth() === currentDate.getMonth() && appDate.getFullYear() === currentDate.getFullYear()) {
          const day = appDate.getDate();
          if (!appointmentsByDay[day]) {
              appointmentsByDay[day] = [];
          }
          appointmentsByDay[day].push(app);
       }
  });

  return (
    <>
    <div className="bg-brand-surface p-4 rounded-lg h-full flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
            <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-brand-secondary text-brand-text-primary">&lt;</button>
            <h2 className="text-xl font-bold text-brand-text-primary capitalize">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
            <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-brand-secondary text-brand-text-primary">&gt;</button>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => window.open(GOOGLE_CALENDAR_LINK, '_blank')}
                className="flex items-center gap-2 px-3 py-2 bg-white text-gray-700 border border-gray-300 rounded-md font-bold text-sm hover:bg-gray-50 transition-colors"
                title="Abrir a agenda alexandrematos@excelenciafilmes.com.br"
            >
                <GoogleIcon className="w-4 h-4" />
                <span className="hidden md:inline">Abrir Google Agenda</span>
            </button>

            <button 
                onClick={() => onAddAppointment()}
                className="flex items-center gap-2 px-4 py-2 bg-brand-primary text-brand-background rounded-md font-bold text-sm hover:opacity-90 shadow-md"
            >
                <PlusIcon className="w-4 h-4" /> Novo Compromisso
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1 flex-grow overflow-y-auto">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-bold text-brand-text-secondary text-xs uppercase py-2">{day}</div>
        ))}
        
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="border border-brand-secondary/30 rounded-md min-h-[100px] bg-brand-background/20"></div>
        ))}
        
        {Array.from({ length: daysInMonth }).map((_, day) => {
          const currentDay = day + 1;
          const today = new Date();
          const isToday = today.getDate() === currentDay && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
          const dayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDay);

          return (
            <div 
                key={day} 
                className={`border border-brand-secondary/50 rounded-md min-h-[120px] p-1.5 flex flex-col relative group transition-colors hover:border-brand-text-secondary/50 ${isToday ? 'bg-brand-secondary/20' : ''}`}
                onClick={(e) => {
                    // Se clicar no espaço vazio, adiciona compromisso naquele dia
                    if (e.target === e.currentTarget) {
                        onAddAppointment(dayDate);
                    }
                }}
            >
              <div className="flex justify-between items-start">
                  <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${isToday ? 'bg-brand-primary text-brand-background' : 'text-brand-text-secondary'}`}>
                      {currentDay}
                  </div>
                  {/* Botão sutil para adicionar no dia específico */}
                  <button 
                    onClick={(e) => { e.stopPropagation(); onAddAppointment(dayDate); }}
                    className="opacity-0 group-hover:opacity-100 text-brand-text-secondary hover:text-brand-primary transition-opacity"
                    title="Adicionar neste dia"
                  >
                      <PlusIcon className="w-3 h-3" />
                  </button>
              </div>

              <div className="mt-1 space-y-1 flex-grow overflow-y-auto max-h-[150px] custom-scrollbar">
                 {/* Projetos (Prazos) */}
                 {projectsByDay[currentDay]?.map(project => (
                   <div key={project.id} onClick={(e) => { e.stopPropagation(); onProjectClick(project); }} className="bg-brand-primary/10 border-l-2 border-brand-primary p-1 rounded text-[10px] cursor-pointer hover:bg-brand-primary/20 transition-colors mb-1">
                     <p className="font-bold truncate text-brand-text-primary">{project.title}</p>
                     <p className="truncate text-brand-text-secondary text-[9px]">Prazo: {getClientName(project.client_id)}</p>
                   </div>
                 ))}

                 {/* Compromissos (Agendas) */}
                 {appointmentsByDay[currentDay]?.map(app => {
                     const timeString = new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
                     return (
                        <div key={app.id} onClick={(e) => { e.stopPropagation(); onEditAppointment(app); }} className="bg-blue-500/10 border-l-2 border-blue-400 p-1 rounded text-[10px] cursor-pointer hover:bg-blue-500/20 transition-colors">
                            <div className="flex justify-between">
                                <span className="text-blue-300 font-mono">{timeString}</span>
                            </div>
                            <p className="font-semibold truncate text-brand-text-primary">{app.title}</p>
                        </div>
                     )
                 })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
};
