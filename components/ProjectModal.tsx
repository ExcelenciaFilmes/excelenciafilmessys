import React, { useState } from 'react';
import { Project, Client, Column, User } from '../types.ts';

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (projectData: Omit<Project, 'id' | 'owner_id' | 'stage'> & { column_id: string }, newClient?: Omit<Client, 'id' | 'owner_id'>) => void;
  clients: Client[];
  users: User[];
  columns: Column[];
}

export const ProjectModal: React.FC<ProjectModalProps> = ({ isOpen, onClose, onSave, clients, users, columns }) => {
  const [title, setTitle] = useState('');
  const [brief, setBrief] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [uploadLink, setUploadLink] = useState('');
  const [clientId, setClientId] = useState('');
  const [columnId, setColumnId] = useState(columns[0]?.id || '');
  const [responsibleUserIds, setResponsibleUserIds] = useState<string[]>([]);
  
  const [viewMode, setViewMode] = useState<'existing' | 'new'>('existing');
  const [newClientData, setNewClientData] = useState({
      name: '', email: '', phone: '', social_media: '', cpf: '', cnpj: '', address: '', essential_info: ''
  });

  const resetForm = () => {
    setTitle('');
    setBrief('');
    setStartDate('');
    setEndDate('');
    setUploadLink('');
    setClientId('');
    setColumnId(columns[0]?.id || '');
    setResponsibleUserIds([]);
    setViewMode('existing');
    setNewClientData({ name: '', email: '', phone: '', social_media: '', cpf: '', cnpj: '', address: '', essential_info: ''});
  }
  
  const handleClose = () => {
      resetForm();
      onClose();
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const isNewClientMode = viewMode === 'new';
    if (!title || (!clientId && !isNewClientMode) || (isNewClientMode && !newClientData.name) || !columnId) {
        alert('Por favor, preencha os campos obrigatórios (Título, Cliente e Etapa).');
        return;
    }
    
    onSave({
      title,
      brief,
      start_date: startDate || undefined,
      end_date: endDate || undefined,
      upload_link: uploadLink || undefined,
      client_id: isNewClientMode ? '' : clientId,
      column_id: columnId,
      responsible_user_ids: responsibleUserIds,
    }, isNewClientMode ? {
      name: newClientData.name,
      email: newClientData.email,
      phone: newClientData.phone,
      social_media: newClientData.social_media,
      cpf: newClientData.cpf,
      cnpj: newClientData.cnpj,
      address: newClientData.address,
      essential_info: newClientData.essential_info,
    } : undefined);
    
    handleClose();
  };

  const handleResponsibleChange = (userId: string) => {
    setResponsibleUserIds(prev => 
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-brand-surface w-full max-w-2xl rounded-lg shadow-xl max-h-[90vh] flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="p-6 border-b border-brand-secondary flex justify-between items-center">
            <h2 className="text-xl font-bold">Novo Projeto</h2>
            <button type="button" onClick={handleClose} className="text-brand-text-secondary hover:text-brand-text-primary text-3xl font-light leading-none">&times;</button>
          </div>
          <div className="p-6 space-y-4 overflow-y-auto">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-brand-text-secondary mb-1">Título do Projeto</label>
              <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className="w-full p-2 bg-brand-secondary rounded-md" />
            </div>
            <div>
              <label htmlFor="brief" className="block text-sm font-medium text-brand-text-secondary mb-1">Briefing</label>
              <textarea id="brief" value={brief} onChange={e => setBrief(e.target.value)} rows={3} className="w-full p-2 bg-brand-secondary rounded-md" />
            </div>

            <div>
                <label className="block text-sm font-medium text-brand-text-secondary mb-2">Cliente</label>
                <div className="flex rounded-md bg-brand-secondary p-1 space-x-1 mb-3">
                    <button type="button" onClick={() => setViewMode('existing')} className={`w-full rounded p-1.5 text-sm font-semibold ${viewMode === 'existing' ? 'bg-brand-primary text-brand-background' : 'hover:bg-brand-surface'}`}>Cliente Existente</button>
                    <button type="button" onClick={() => setViewMode('new')} className={`w-full rounded p-1.5 text-sm font-semibold ${viewMode === 'new' ? 'bg-brand-primary text-brand-background' : 'hover:bg-brand-surface'}`}>Novo Cliente</button>
                </div>
                {viewMode === 'existing' ? (
                     <select id="clientId" value={clientId} onChange={e => setClientId(e.target.value)} required={viewMode === 'existing'} className="w-full p-2 bg-brand-secondary rounded-md">
                        <option value="">Selecione um cliente</option>
                        {clients.map(client => (
                            <option key={client.id} value={client.id}>{client.name}</option>
                        ))}
                    </select>
                ) : (
                    <div className="space-y-3 p-3 border border-brand-secondary rounded-md">
                        <input type="text" placeholder="Nome do Cliente *" value={newClientData.name} onChange={e => setNewClientData({...newClientData, name: e.target.value})} required={viewMode === 'new'} className="w-full p-2 bg-brand-background rounded-md text-sm" />
                        <div className="grid grid-cols-2 gap-3">
                            <input type="email" placeholder="E-mail" value={newClientData.email} onChange={e => setNewClientData({...newClientData, email: e.target.value})} className="p-2 bg-brand-background rounded-md text-sm" />
                            <input type="tel" placeholder="Telefone" value={newClientData.phone} onChange={e => setNewClientData({...newClientData, phone: e.target.value})} className="p-2 bg-brand-background rounded-md text-sm" />
                            <input type="text" placeholder="Rede Social" value={newClientData.social_media} onChange={e => setNewClientData({...newClientData, social_media: e.target.value})} className="p-2 bg-brand-background rounded-md text-sm" />
                            <input type="text" placeholder="CPF" value={newClientData.cpf} onChange={e => setNewClientData({...newClientData, cpf: e.target.value})} className="p-2 bg-brand-background rounded-md text-sm" />
                            <input type="text" placeholder="CNPJ" value={newClientData.cnpj} onChange={e => setNewClientData({...newClientData, cnpj: e.target.value})} className="p-2 bg-brand-background rounded-md text-sm" />
                         </div>
                         <textarea placeholder="Endereço Completo" value={newClientData.address} onChange={e => setNewClientData({...newClientData, address: e.target.value})} rows={2} className="w-full p-2 bg-brand-background rounded-md text-sm" />
                         <textarea placeholder="Informações Essenciais" value={newClientData.essential_info} onChange={e => setNewClientData({...newClientData, essential_info: e.target.value})} rows={2} className="w-full p-2 bg-brand-background rounded-md text-sm" />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label htmlFor="columnId" className="block text-sm font-medium text-brand-text-secondary mb-1">Etapa Inicial</label>
                    <select id="columnId" value={columnId} onChange={e => setColumnId(e.target.value)} required className="w-full p-2 bg-brand-secondary rounded-md">
                        {columns.map(col => <option key={col.id} value={col.id}>{col.title}</option>)}
                    </select>
                </div>
                <div>
                    <label htmlFor="uploadLink" className="block text-sm font-medium text-brand-text-secondary mb-1">Link de Upload</label>
                    <input id="uploadLink" type="url" value={uploadLink} onChange={e => setUploadLink(e.target.value)} className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
                <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-brand-text-secondary mb-1">Data de Início</label>
                    <input id="startDate" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
                <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-brand-text-secondary mb-1">Prazo Final</label>
                    <input id="endDate" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
            </div>

             <div>
                <h3 className="text-sm font-medium text-brand-text-secondary mb-2">Responsáveis</h3>
                <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-brand-secondary rounded-md">
                    {users.map(user => (
                        <label key={user.id} className="flex items-center space-x-3 p-1.5 rounded-md hover:bg-brand-background cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={responsibleUserIds.includes(user.id)}
                                onChange={() => handleResponsibleChange(user.id)}
                                className="w-4 h-4 rounded bg-brand-background text-brand-primary focus:ring-brand-primary border-brand-text-secondary/50"
                            />
                            <span className="text-brand-text-primary text-sm">{user.name || user.email}</span>
                        </label>
                    ))}
                </div>
            </div>

          </div>
          <div className="p-6 border-t border-brand-secondary flex justify-end space-x-2 mt-auto">
            <button type="button" onClick={handleClose} className="px-4 py-2 rounded-md bg-brand-secondary hover:bg-brand-secondary/80">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-brand-primary text-brand-background font-semibold">Salvar Projeto</button>
          </div>
        </form>
      </div>
    </div>
  );
};