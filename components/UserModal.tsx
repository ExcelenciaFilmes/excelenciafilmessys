
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
        // Garante que muda o estado booleano
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
                    <input id="name" name="name" type="text" value={formData.name || ''} onChange={handleChange} required className="w-full p-2 bg-brand-secondary rounded-md text-brand-text-primary" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-text-secondary mb-1">E-mail</label>
                    <input id="email" name="email" type="email" value={formData.email || ''} onChange={handleChange} required disabled={mode === 'edit'} className="w-full p-2 bg-brand-secondary rounded-md disabled:opacity-50 text-brand-text-primary" />
                </div>
                 {mode === 'new' && (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-brand-text-secondary mb-1">Senha Provisória</label>
                        <input id="password" name="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" className="w-full p-2 bg-brand-secondary rounded-md text-brand-text-primary" />
                    </div>
                 )}
                 <div>
                    <label htmlFor="cpf" className="block text-sm font-medium text-brand-text-secondary mb-1">CPF</label>
                    <input id="cpf" name="cpf" type="text" value={formData.cpf || ''} onChange={handleChange} className="w-full p-2 bg-brand-secondary rounded-md text-brand-text-primary" />
                </div>
                 <div>
                    <label htmlFor="role" className="block text-sm font-medium text-brand-text-secondary mb-1">Nível de Acesso</label>
                    <select 
                        id="role" 
                        name="role" 
                        value={formData.role || 'Free'} 
                        onChange={handleChange} 
                        className="w-full p-2 bg-brand-secondary rounded-md text-brand-text-primary focus:ring-1 focus:ring-brand-primary outline-none"
                    >
                        <option value="Free">Free (Acesso Padrão)</option>
                        <option value="Master">Master (Acesso Total)</option>
                    </select>
                </div>
            </div>
            
            {/* Área de Aprovação de Acesso */}
            <div className={`mt-6 p-4 border rounded-lg transition-colors ${formData.approved ? 'border-green-500/50 bg-green-500/10' : 'border-yellow-500/50 bg-yellow-500/10'}`}>
                <h3 className="text-sm font-bold text-brand-text-primary mb-2">Validação de Cadastro</h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs text-brand-text-secondary">Status atual: <span className={formData.approved ? "text-green-400 font-bold uppercase" : "text-yellow-400 font-bold uppercase"}>{formData.approved ? 'ATIVO / APROVADO' : 'PENDENTE DE APROVAÇÃO'}</span></p>
                        <p className="text-xs text-brand-text-secondary mt-1 max-w-xs leading-relaxed">
                           {formData.approved 
                             ? 'Usuário com acesso liberado ao sistema.' 
                             : 'Usuário bloqueado. Clique em aprovar para liberar.'}
                        </p>
                    </div>
                    <button 
                        type="button"
                        onClick={toggleApproval}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all shadow-md ${formData.approved ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/50'}`}
                    >
                        {formData.approved ? 'Bloquear Acesso' : 'Aprovar Acesso'}
                    </button>
                </div>
            </div>

          </div>
          <div className="p-6 border-t border-brand-secondary flex justify-end space-x-2">
            <button type="button" onClick={onCancel} className="px-4 py-2 rounded-md bg-brand-secondary hover:bg-brand-secondary/80 text-brand-text-primary">Cancelar</button>
            <button type="submit" className="px-4 py-2 rounded-md bg-brand-primary text-brand-background font-semibold hover:bg-opacity-90 shadow-lg shadow-brand-primary/20">
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
                        <div className="mb-4 bg-brand-secondary/30 p-3 rounded-md border border-brand-secondary">
                             <p className="text-xs text-brand-text-secondary">
                                <span className="font-bold text-brand-primary">Legenda:</span>
                                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-green-500 mr-1"></span> Aprovado
                                <span className="ml-2 inline-block w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Pendente
                            </p>
                        </div>
                        
                        <ul className="space-y-3">
                            {users.map(user => (
                                <li 
                                    key={user.id} 
                                    className={`flex justify-between items-center p-4 rounded-md border-l-4 shadow-sm transition-all hover:brightness-110 ${user.approved ? 'border-green-500 bg-brand-secondary' : 'border-yellow-500 bg-yellow-500/10'}`}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-base shadow-inner ${user.role === 'Master' ? 'bg-gradient-to-br from-brand-primary to-yellow-600 text-brand-background' : 'bg-brand-surface text-brand-text-secondary'}`}>
                                            {(user.name || '?').charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-bold text-brand-text-primary text-lg">{user.name || user.email}</p>
                                                {user.role === 'Master' && <span className="text-[10px] bg-brand-primary text-brand-background px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wider">MASTER</span>}
                                            </div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-sm text-brand-text-secondary">{user.email}</p>
                                                {!user.approved && <span className="text-[10px] text-yellow-500 font-bold border border-yellow-500/30 px-1 rounded uppercase">Aguardando Aprovação</span>}
                                                {user.approved && <span className="text-[10px] text-green-500 font-bold flex items-center gap-1"><CheckIcon className="w-3 h-3"/> Ativo</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-3">
                                        <button 
                                            onClick={() => handleEdit(user)} 
                                            className="px-3 py-1.5 text-xs font-semibold bg-brand-surface hover:bg-brand-primary hover:text-brand-background text-brand-text-primary rounded border border-brand-secondary transition-colors"
                                        >
                                            {user.approved ? 'Editar / Bloquear' : 'Validar Acesso'}
                                        </button>
                                        
                                        <button 
                                            onClick={() => onDelete(user.id)} 
                                            className="p-2 text-brand-text-secondary hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all"
                                            title="Excluir Usuário"
                                        >
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                         {users.length === 0 && <p className="text-center text-brand-text-secondary py-8">Nenhum usuário cadastrado.</p>}
                    </div>
                     <div className="p-6 border-t border-brand-secondary flex justify-end">
                        <button onClick={handleAddNew} className="px-4 py-2 rounded-md bg-brand-primary text-brand-background font-semibold hover:shadow-lg hover:shadow-brand-primary/20 transition-all">Adicionar Usuário</button>
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
