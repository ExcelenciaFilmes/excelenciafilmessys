import React from 'react';
import { DragDropContext, Droppable, DropResult } from '@hello-pangea/dnd';
import { Column as ColumnType, Project as ProjectType, User } from '../types.ts';
import Column from './Column.tsx';

interface BoardProps {
  columns: ColumnType[];
  projects: ProjectType[];
  users: User[];
  onDragEnd: (result: DropResult) => void;
  onProjectClick: (project: ProjectType) => void;
}

const Board: React.FC<BoardProps> = ({ columns, projects, users, onDragEnd, onProjectClick }) => {
  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="all-columns" direction="horizontal" type="COLUMN">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="flex space-x-4 h-full"
          >
            {columns.map((column, index) => {
                const columnProjects = column.projectIds.map(projectId => projects.find(p => p.id === projectId)).filter(Boolean) as ProjectType[];
                return (
                    <Column
                        key={column.id}
                        column={column}
                        projects={columnProjects}
                        index={index}
                        users={users}
                        onProjectClick={onProjectClick}
                    />
                )
            })}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default Board;