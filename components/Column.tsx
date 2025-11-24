import React from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Column as ColumnType, Project as ProjectType, User } from '../types.ts';
import { Card } from './Card.tsx';

interface ColumnProps {
  column: ColumnType;
  projects: ProjectType[];
  index: number;
  users: User[];
  onProjectClick: (project: ProjectType) => void;
}

const Column: React.FC<ColumnProps> = ({ column, projects, index, users, onProjectClick }) => {
  return (
    <Draggable draggableId={column.id} index={index}>
        {(provided) => (
            <div
                {...provided.draggableProps}
                ref={provided.innerRef}
                className="w-80 flex-shrink-0 flex flex-col"
            >
                <div {...provided.dragHandleProps} className="p-3 bg-brand-surface rounded-t-lg">
                    <h3 className="font-semibold text-brand-text-primary">{column.title}</h3>
                </div>
                <Droppable droppableId={column.id} type="CARD">
                    {(provided, snapshot) => (
                        <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`p-3 bg-brand-surface rounded-b-lg flex-grow transition-colors ${
                                snapshot.isDraggingOver ? 'bg-brand-secondary' : ''
                            }`}
                        >
                        {projects.map((project, index) => (
                            <Card 
                                key={project.id} 
                                project={project} 
                                index={index} 
                                users={users}
                                onClick={() => onProjectClick(project)}
                                onEdit={() => onProjectClick(project)}
                            />
                        ))}
                        {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </div>
        )}
    </Draggable>
  );
};

export default Column;