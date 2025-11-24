import React, { useState, useEffect } from 'react';
import { Client } from '../types.ts';
import { TrashIcon, UserIcon } from './icons';

interface ClientModalProps {
  clients: Client[];
  onClose: () => void;
  onSave: (client: Omit<Client, 'id' | 'owner_id'> | Client) => void;
  onDelete: (clientId: string) => void;
}

const ClientForm: React.FC<{ client?: Client | null, onSave: (client: Omit<Client, 'id' | 'owner_id'> | Client) => void, onCancel: () => void }> = ({ client, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', social_media: '', cpf: '', cnpj: '', address: '', essential_info: '', ...client
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData);
    }

    return (
        <form onSubmit={handleSubmit} className="bg-brand-surface rounded-b-lg">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary mb-1">Nome Completo</label>
                    <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">E-mail</label>
                    <input id="email" name="email" type="email" value={formData.email} onChange={handleChange} className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
                 <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-brand-text-secondary mb-1">Telefone</label>
                    <input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
                 <div>
                    <label htmlFor="social_media" className="block text-sm font-medium text-brand-text-secondary mb-1">Rede Social</label>
                    <input id="social_media" name="social_media" type="text" value={formData.social_media} onChange={handleChange} className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
                <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-brand-text-secondary mb-1">CPF</label>
                    <input id="cpf" name="cpf" type="text" value={formData.cpf} onChange={handleChange} className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
                <div>
                    <label htmlFor="cnpj" className="block text-sm font-medium text-brand-text-secondary mb-1">CNPJ</label>
                    <input id="cnpj" name="cnpj" type="text" value={formData.cnpj} onChange={handleChange} className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
            </div>
             <div>
                <label htmlFor="address" className="block text-sm font-medium text-brand-text-secondary mb-1">Endereço Completo</label>
                <textarea id="address" name="address" value={formData.address} onChange={handleChange} rows={2} className="w-full p-2 bg-brand-secondary rounded-md"/>
            </div>
             <div>
                <label htmlFor="essential_info" className="block text-sm font-medium text-brand-text-secondary mb-1">Informações Essenciais</label>
                <textarea id="essential_info" name="essential_info" value={formData.essential_info} onChange={handleChange} rows={2} className="w-full p-2 bg-brand-secondary rounded-md"/>
            </div>
          </div>
          <div className="p-6 border-t border-brand-secondary flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-brand-secondary hover:bg-brand-secondary/80 text-brand-text-primary">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-brand-primary text-brand-background font-semibold hover:bg-opacity-90">Salvar Cliente</button>
          </div>
        </form>
    )
}

export const ClientModal: React.FC<ClientModalProps> = ({ clients, onClose, onSave, onDelete }) => {
    const [view, setView] = useState<'list' | 'form'>('list');
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    const handleAddNew = () => {
        setSelectedClient(null);
        setView('form');
    }

    const handleEdit = (client: Client) => {
        setSelectedClient(client);
        setView('form');
    }

    const handleSave = (client: Omit<Client, 'id' | 'owner_id'> | Client) => {
        onSave(client);
        setView('list');
    }
    
    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-brand-surface w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl flex flex-col">
            <div className="p-6 border-b border-brand-secondary flex justify-between items-center">
                <h2 className="text-xl font-bold text-brand-text-primary">
                    {view === 'list' ? 'Gerenciar Clientes' : selectedClient ? 'Editar Cliente' : 'Adicionar Novo Cliente'}
                </h2>
                <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary text-3xl font-light leading-none">&times;</button>
            </div>

            {view === 'list' ? (
                <div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                        <ul className="space-y-2">
                            {clients.map(client => (
                                <li key={client.id} className="flex justify-between items-center p-3 bg-brand-secondary rounded-md">
                                    <div className="flex items-center space-x-3">
                                        <UserIcon className="w-5 h-5 text-brand-text-secondary"/>
                                        <div>
                                            <p className="font-semibold text-brand-text-primary">{client.name}</p>
                                            <p className="text-sm text-brand-text-secondary">{client.email}</p>
                                        </div>
                                    </div>
                                    <div className="space-x-2">
                                        <button onClick={() => handleEdit(client)} className="text-xs font-semibold text-brand-primary hover:underline">Editar</button>
                                        <button onClick={() => onDelete(client.id)} className="p-1 text-red-400 hover:text-red-300">
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                         {clients.length === 0 && <p className="text-center text-brand-text-secondary py-8">Nenhum cliente cadastrado.</p>}
                    </div>
                     <div className="p-6 border-t border-brand-secondary flex justify-end">
                        <button onClick={handleAddNew} className="px-4 py-2 rounded-md bg-brand-primary text-brand-background font-semibold">Adicionar Cliente</button>
                    </div>
                </div>
            ) : (
                <ClientForm client={selectedClient} onSave={handleSave} onCancel={() => setView('list')} />
            )}
        </div>
        </div>
    );
};