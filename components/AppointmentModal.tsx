import React, { useState, useEffect } from 'react';
import { Appointment } from '../types.ts';
import { TrashIcon } from './icons';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appointment: Omit<Appointment, 'id' | 'user_id'> | Appointment) => void;
  onDelete: (id: string) => void;
  initialDate?: Date;
  appointmentToEdit?: Appointment | null;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ isOpen, onClose, onSave, onDelete, initialDate, appointmentToEdit }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (isOpen) {
        if (appointmentToEdit) {
            setTitle(appointmentToEdit.title);
            setDescription(appointmentToEdit.description || '');
            const objDate = new Date(appointmentToEdit.date);
            setDate(objDate.toISOString().split('T')[0]);
            setTime(objDate.toTimeString().slice(0, 5));
        } else {
            setTitle('');
            setDescription('');
            // Se veio uma data clicada no calendário, usa ela
            const defaultDate = initialDate || new Date();
            setDate(defaultDate.toISOString().split('T')[0]);
            
            // Hora atual arredondada
            const now = new Date();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(Math.floor(now.getMinutes() / 15) * 15).padStart(2, '0'); // Arredonda para 15min
            setTime(`${hours}:${minutes}`);
        }
    }
  }, [isOpen, appointmentToEdit, initialDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !time) {
        alert("Preencha título, data e hora.");
        return;
    }

    // Combina data e hora em ISO string
    const combinedDate = new Date(`${date}T${time}:00`);

    const appointmentData = {
        title,
        description,
        date: combinedDate.toISOString(),
    };

    if (appointmentToEdit) {
        onSave({ ...appointmentData, id: appointmentToEdit.id, user_id: appointmentToEdit.user_id });
    } else {
        onSave(appointmentData);
    }
    onClose();
  };

  const handleDelete = () => {
      if (appointmentToEdit && window.confirm("Tem certeza que deseja excluir este compromisso?")) {
          onDelete(appointmentToEdit.id);
          onClose();
      }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-brand-surface w-full max-w-md rounded-lg shadow-xl flex flex-col">
        <form onSubmit={handleSubmit}>
          <div className="p-6 border-b border-brand-secondary flex justify-between items-center">
            <h2 className="text-xl font-bold text-brand-text-primary">
                {appointmentToEdit ? 'Editar Compromisso' : 'Novo Compromisso'}
            </h2>
            <button type="button" onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary text-3xl font-light leading-none">&times;</button>
          </div>
          
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Título</label>
              <input 
                type="text" 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                required 
                className="w-full p-2 bg-brand-secondary text-brand-text-primary rounded-md focus:ring-1 focus:ring-brand-primary outline-none"
                placeholder="Ex: Reunião com Cliente"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Data</label>
                    <input 
                        type="date" 
                        value={date} 
                        onChange={e => setDate(e.target.value)} 
                        required 
                        className="w-full p-2 bg-brand-secondary text-brand-text-primary rounded-md focus:ring-1 focus:ring-brand-primary outline-none" 
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-brand-text-secondary mb-1">Hora</label>
                    <input 
                        type="time" 
                        value={time} 
                        onChange={e => setTime(e.target.value)} 
                        required 
                        className="w-full p-2 bg-brand-secondary text-brand-text-primary rounded-md focus:ring-1 focus:ring-brand-primary outline-none" 
                    />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-text-secondary mb-1">Descrição (Opcional)</label>
              <textarea 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                rows={3} 
                className="w-full p-2 bg-brand-secondary text-brand-text-primary rounded-md focus:ring-1 focus:ring-brand-primary outline-none resize-none"
              />
            </div>
          </div>

          <div className="p-6 border-t border-brand-secondary flex justify-between items-center">
             <div>
                {appointmentToEdit && (
                    <button 
                        type="button" 
                        onClick={handleDelete} 
                        className="text-red-500 hover:text-red-400 p-2 rounded hover:bg-red-500/10 transition-colors"
                        title="Excluir"
                    >
                        <TrashIcon className="w-5 h-5" />
                    </button>
                )}
             </div>
             <div className="flex space-x-2">
                <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-brand-secondary hover:bg-brand-secondary/80 text-brand-text-primary">Cancelar</button>
                <button type="submit" className="px-4 py-2 rounded-md bg-brand-primary text-brand-background font-semibold hover:bg-opacity-90">Salvar</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};