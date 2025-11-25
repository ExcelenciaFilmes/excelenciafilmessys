
import React, { useState } from 'react';
import { User } from '../types.ts';
import { TrashIcon, CheckIcon } from './icons';

interface UserModalProps {
  users: User[];
  onClose: () => void;
  onSave: (user: Omit<User, 'id'> | User, password?: string) => void;
  onDelete: (userId: string) => void;
}

const UserForm: React.FC<{ 
    user: User | Partial<User>, 
    mode: 'edit' | 'new',
    onSave: (user: User | Omit<User, 'id'>, password?: string) => void, 
    onCancel: () => void 
}> = ({ user, mode, onSave, onCancel }) => {
    const [formData, setFormData] = useState<User | Partial<User>>(user);
    const [password, setPassword] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({...prev, [name]: value}));
    }

    const toggleApproval = () => {
        setFormData(prev => ({...prev, approved: !prev.approved}));
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(formData as User | Omit<User, 'id'>, mode === 'new' ? password : undefined);
    }

    return (
        <form onSubmit={handleSubmit} className="bg-brand-surface rounded-b-lg">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-text-secondary mb-1">Nome Completo</label>
                    <input id="name" name="name" type="text" value={formData.name || ''} onChange={handleChange} required className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">E-mail</label>
                    <input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required disabled={mode === 'edit'} className="w-full p-2 bg-brand-secondary rounded-md disabled:opacity-50" />
                </div>
                 {mode === 'new' && (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">Senha Provisória</label>
                        <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" className="w-full p-2 bg-brand-secondary rounded-md" />
                    </div>
                 )}
                 <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-brand-text-secondary mb-1">CPF</label>
                    <input id="cpf" name="cpf" type="text" value={formData.cpf || ''} onChange={handleChange} className="w-full p-2 bg-brand-secondary rounded-md" />
                </div>
                 <div>
                    <label htmlFor="role" className="block text-sm font-medium text-brand-text-secondary mb-1">Nível de Acesso</label>
                    <select 
                        id="role" 
                        name="role" 
                        value={formData.role || 'Free'} 
                        onChange={handleChange} 
                        className="w-full p-2 bg-brand-secondary rounded-md text-brand-text-primary"
                    >
                        <option value="Free">Free (Acesso Padrão)</option>
                        <option value="Master">Master (Acesso Total)</option>
                    </select>
                </div>
            </div>
            
            {/* Área de Aprovação de Acesso */}
            <div className="mt-6 p-4 border border-brand-secondary rounded-lg bg-brand-background/50">
                <h3 className="text-sm font-bold text-brand-text-primary mb-2">Validação de Cadastro</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-brand-text-secondary">Status atual: <span className={formData.approved ? "text-green-500 font-bold" : "text-yellow-500 font-bold"}>{formData.approved ? 'ATIVO' : 'PENDENTE'}</span></p>
                        <p className="text-xs text-brand-text-secondary mt-1 max-w-xs">
                           {formData.approved 
                             ? 'O usuário já possui acesso ao sistema.' 
                             : 'Ao aprovar, um e-mail com um link de acesso será enviado automaticamente para o usuário.'}
                        </p>
                    </div>
                    <button 
                        type="button"
                        onClick={toggleApproval}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${formData.approved ? 'bg-red-500/20 text-red-500 hover:bg-red-500/30' : 'bg-green-500/20 text-green-500 hover:bg-green-500/30'}`}
                    >
                        {formData.approved ? 'Bloquear Acesso' : 'Aprovar Acesso'}
                    </button>
                </div>
            </div>

          </div>
          <div className="p-6 border-t border-brand-secondary flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-brand-secondary hover:bg-brand-secondary/80 text-brand-text-primary">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-brand-primary text-brand-background font-semibold hover:bg-opacity-90">
                 {mode === 'new' ? 'Convidar Usuário' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
    )
}

export const UserModal: React.FC<UserModalProps> = ({ users, onClose, onSave, onDelete }) => {
    const [view, setView] = useState<'list' | 'edit' | 'new'>('list');
    const [selectedUser, setSelectedUser] = useState<User | null>(null);

    const handleEdit = (user: User) => {
        setSelectedUser(user);
        setView('edit');
    }

    const handleAddNew = () => {
        setSelectedUser(null);
        setView('new');
    }

    const handleSave = (user: Omit<User, 'id'> | User, password?: string) => {
        onSave(user, password);
        setView('list');
        setSelectedUser(null);
    }
    
    const handleCancel = () => {
        setView('list');
        setSelectedUser(null);
    }

    const initialFormState: Partial<User> = { name: '', email: '', cpf: '', role: 'Free', approved: false };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
        <div className="bg-brand-surface w-full max-w-2xl max-h-[90vh] rounded-lg shadow-xl flex flex-col">
            <div className="p-6 border-b border-brand-secondary flex justify-between items-center">
                <h2 className="text-xl font-bold text-brand-text-primary">
                    {view === 'edit' && `Editando ${selectedUser?.name}`}
                    {view === 'new' && 'Adicionar Novo Usuário'}
                    {view === 'list' && 'Gerenciar Usuários'}
                </h2>
                <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary text-3xl font-light leading-none">&times;</button>
            </div>

            {view === 'list' ? (
                <div>
                    <div className="p-4 max-h-[60vh] overflow-y-auto">
                        <p className="text-xs text-brand-text-secondary px-2 pb-3">
                            <span className="font-bold text-brand-primary">MASTER:</span> Acesso total. <span className="font-bold text-gray-400">FREE:</span> Acesso restrito.
                            <br/>Novos cadastros precisam ser aprovados manualmente.
                        </p>
                        <ul className="space-y-2">
                            {users.map(user => (
                                <li key={user.id} className={`flex justify-between items-center p-3 rounded-md border ${user.approved ? 'bg-brand-secondary border-transparent' : 'bg-yellow-900/10 border-yellow-600/30'}`}>
                                    <div className="flex items-center space-x-3">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${user.role === 'Master' ? 'bg-brand-primary text-brand-background' : 'bg-brand-surface text-brand-text-secondary'}`}>
                                            {(user.name || '?').charAt(0)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-semibold text-brand-text-primary">{user.name || user.email}</p>
                                                {user.role === 'Master' && <span className="text-[10px] bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded font-bold">MASTER</span>}
                                                {!user.approved && <span className="text-[10px] bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded font-bold animate-pulse">PENDENTE</span>}
                                            </div>
                                            <p className="text-sm text-brand-text-secondary">{user.email}</p>
                                        </div>
                                    </div>
                                    <div className="space-x-2 flex items-center">
                                        <button onClick={() => handleEdit(user)} className="text-xs font-semibold text-brand-primary hover:underline px-2">
                                            {user.approved ? 'Editar' : 'Validar'}
                                        </button>
                                        
                                        {/* Botão de Exclusão destacado para o Master */}
                                        <button 
                                            onClick={() => onDelete(user.id)} 
                                            className="group flex items-center gap-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white px-2 py-1.5 rounded transition-all"
                                            title="Excluir Usuário permanentemente"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                            <span className="text-xs font-bold hidden group-hover:inline">Excluir</span>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                         {users.length === 0 && <p className="text-center text-brand-text-secondary py-8">Nenhum usuário cadastrado.</p>}
                    </div>
                     <div className="p-6 border-t border-brand-secondary flex justify-end">
                        <button onClick={handleAddNew} className="px-4 py-2 rounded-md bg-brand-primary text-brand-background font-semibold">Adicionar Usuário</button>
                    </div>
                </div>
            ) : (
                <UserForm 
                    user={selectedUser || initialFormState}
                    mode={view === 'edit' ? 'edit' : 'new'} 
                    onSave={handleSave} 
                    onCancel={handleCancel} 
                />
            )}
        </div>
        </div>
    );
};
