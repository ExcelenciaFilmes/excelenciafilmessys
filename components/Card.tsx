import React from 'react';
import { Project as ProjectType, User } from '../types.ts';
import { Draggable } from '@hello-pangea/dnd';
import { PencilIcon } from './icons';

interface CardProps {
  project: ProjectType;
  index: number;
  users: User[];
  onClick: () => void;
  onEdit: () => void;
}

const Avatar: React.FC<{ name: string }> = ({ name }) => (
    <div className="w-6 h-6 bg-gray-200 border-2 border-white rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
        {name.charAt(0)}
    </div>
);

export const Card: React.FC<CardProps> = ({ project, index, users, onClick, onEdit }) => {
    const responsibleUsers = project.responsible_user_ids?.map(userId => users.find(u => u.id === userId)).filter(Boolean) as User[];
  
    const handleEditClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        onEdit();
    }

    return (
    <Draggable draggableId={project.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onClick}
          className={`group relative p-3 mb-3 bg-white rounded-lg shadow-md hover:shadow-lg border border-transparent transition-all cursor-pointer ${
            snapshot.isDragging ? 'ring-2 ring-brand-primary' : ''
          }`}
        >
          <button onClick={handleEditClick} className="absolute top-2 right-2 p-1 rounded-full bg-gray-200/50 text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-brand-primary/20 hover:text-brand-primary">
            <PencilIcon className="w-4 h-4" />
          </button>
          
          <h4 className="font-semibold text-gray-800 pr-6">{project.title}</h4>
          
          <div className="flex justify-between items-end mt-3">
             {project.end_date && (
                <p className="text-xs text-gray-500">
                    Prazo: {new Date(project.end_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}
                </p>
            )}
            <div className="flex -space-x-2">
                {responsibleUsers.map(user => <Avatar key={user.id} name={user.name || '?'} />)}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
};