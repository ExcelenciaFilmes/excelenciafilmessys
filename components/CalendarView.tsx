import React, { useState } from 'react';
import { Project, Client } from '../types.ts';

interface CalendarViewProps {
  projects: Project[];
  clients: Client[];
  onProjectClick: (project: Project) => void;
}

const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const CalendarView: React.FC<CalendarViewProps> = ({ projects, clients, onProjectClick }) => {
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
  
  const projectsByDay: { [key: number]: Project[] } = {};
  projects.forEach(project => {
    if (!project.end_date) return;
    const deadline = new Date(project.end_date);
    if (deadline.getUTCMonth() === currentDate.getMonth() && deadline.getUTCFullYear() === currentDate.getFullYear()) {
      const day = deadline.getUTCDate();
      if (!projectsByDay[day]) {
        projectsByDay[day] = [];
      }
      projectsByDay[day].push(project);
    }
  });


  return (
    <>
    <div className="bg-brand-surface p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-brand-secondary">&lt;</button>
        <h2 className="text-xl font-bold">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-brand-secondary">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {daysOfWeek.map(day => (
          <div key={day} className="text-center font-bold text-brand-text-secondary text-sm py-2">{day}</div>
        ))}
        {Array.from({ length: startDay }).map((_, i) => (
          <div key={`empty-${i}`} className="border border-brand-secondary/50 rounded-md min-h-[100px]"></div>
        ))}
        {Array.from({ length: daysInMonth }).map((_, day) => {
          const currentDay = day + 1;
          const today = new Date();
          const isToday = today.getDate() === currentDay && today.getMonth() === currentDate.getMonth() && today.getFullYear() === currentDate.getFullYear();
          
          return (
            <div key={day} className={`border border-brand-secondary/50 rounded-md min-h-[120px] p-1.5 flex flex-col`}>
              <div className={`w-6 h-6 flex items-center justify-center rounded-full text-xs self-end ${isToday ? 'bg-brand-primary text-brand-background font-bold' : ''}`}>
                  {currentDay}
              </div>
              <div className="mt-1 space-y-1 flex-grow">
                 {projectsByDay[currentDay]?.map(project => (
                   <div key={project.id} onClick={() => onProjectClick(project)} className="bg-brand-secondary p-1.5 rounded text-xs cursor-pointer hover:bg-brand-primary/20">
                     <p className="font-bold truncate text-brand-text-primary">{project.title}</p>
                     <p className="truncate text-brand-text-secondary">{getClientName(project.client_id)}</p>
                   </div>
                 ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
};