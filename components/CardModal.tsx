import React from 'react';
import { Project, Client, ChecklistItem, User } from '../types.ts';
import { generateChecklist, generateScript, generateImage } from '../services/geminiService.ts';
import { CheckIcon, TrashIcon, PlusIcon } from './icons';

interface CardModalProps {
  project: Project;
  clients: Client[];
  users: User[];
  onClose: () => void;
  onUpdateProject: (updatedProject: Project) => void;
}

export const CardModal: React.FC<CardModalProps> = ({ project, clients, users, onClose, onUpdateProject }) => {
  const [activeTab, setActiveTab] = React.useState('details');
  const [isLoading, setIsLoading] = React.useState(false);
  const [editableProject, setEditableProject] = React.useState<Project>(project);
  
  // Atualiza o projeto localmente
  const handleChange = (field: keyof Project, value: any) => {
    setEditableProject(prev => ({ ...prev, [field]: value }));
  };

  // Salva no banco de dados quando o campo perde o foco (onBlur) para evitar muitas requisições
  const handleBlur = () => {
    if (JSON.stringify(editableProject) !== JSON.stringify(project)) {
        onUpdateProject(editableProject);
    }
  };

  // Salva imediatamente (usado para checkboxes e botões)
  const handleImmediateSave = (updatedProject: Project) => {
    setEditableProject(updatedProject);
    onUpdateProject(updatedProject);
  };

  const handleGenerateChecklist = async () => {
    setIsLoading(true);
    try {
      const newChecklist = await generateChecklist(editableProject.title, editableProject.brief || '');
      handleImmediateSave({ ...editableProject, checklist: newChecklist });
    } catch (error) {
      console.error("Error generating checklist:", error);
      alert("Falha ao gerar o checklist.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateScript = async () => {
    setIsLoading(true);
    try {
      const newScript = await generateScript(editableProject.title, editableProject.brief || '');
      handleImmediateSave({ ...editableProject, script: newScript });
    } catch (error) {
      console.error("Error generating script:", error);
      alert("Falha ao gerar o roteiro.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsLoading(true);
    try {
      const newImage = await generateImage(editableProject.title);
      handleImmediateSave({ ...editableProject, thumbnail: newImage });
    } catch (error) {
      console.error("Error generating image:", error);
      alert("Falha ao gerar a imagem.");
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para manipulação do Checklist
  const toggleChecklistItem = (itemId: string) => {
    const updatedChecklist = editableProject.checklist?.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );
    handleImmediateSave({ ...editableProject, checklist: updatedChecklist });
  };

  const updateChecklistItemText = (itemId: string, newText: string) => {
    const updatedChecklist = editableProject.checklist?.map(item =>
        item.id === itemId ? { ...item, text: newText } : item
    );
    // Atualiza estado local para digitação fluida
    setEditableProject(prev => ({ ...prev, checklist: updatedChecklist }));
  };

  const deleteChecklistItem = (itemId: string) => {
    const updatedChecklist = editableProject.checklist?.filter(item => item.id !== itemId);
    handleImmediateSave({ ...editableProject, checklist: updatedChecklist });
  };

  const addChecklistItem = () => {
    const newItem: ChecklistItem = {
        id: `manual-${Date.now()}`,
        text: 'Nova tarefa',
        completed: false
    };
    const currentChecklist = editableProject.checklist || [];
    handleImmediateSave({ ...editableProject, checklist: [...currentChecklist, newItem] });
  };

  const handleResponsibleChange = (userId: string) => {
    const currentIds = editableProject.responsible_user_ids || [];
    const newIds = currentIds.includes(userId)
        ? currentIds.filter(id => id !== userId)
        : [...currentIds, userId];
    handleImmediateSave({ ...editableProject, responsible_user_ids: newIds });
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-brand-surface w-full max-w-3xl max-h-[90vh] rounded-lg shadow-xl flex flex-col">
        {/* Header com Edição de Título e Cliente */}
        <div className="p-6 border-b border-brand-secondary">
          <div className="flex justify-between items-start gap-4">
            <div className="flex-grow space-y-2">
                <input 
                    type="text" 
                    value={editableProject.title} 
                    onChange={(e) => handleChange('title', e.target.value)}
                    onBlur={handleBlur}
                    className="text-2xl font-bold text-brand-text-primary bg-transparent border border-transparent hover:border-brand-secondary focus:border-brand-primary focus:bg-brand-secondary rounded px-2 -ml-2 w-full outline-none"
                    placeholder="Título do Projeto"
                />
                <div className="flex items-center space-x-2 text-brand-text-secondary">
                    <span>Cliente:</span>
                    <select 
                        value={editableProject.client_id} 
                        onChange={(e) => {
                            handleChange('client_id', e.target.value);
                            // Salva imediatamente ao mudar o select
                            onUpdateProject({ ...editableProject, client_id: e.target.value });
                        }}
                        className="bg-brand-secondary text-brand-text-primary rounded px-2 py-1 text-sm border-none outline-none focus:ring-1 focus:ring-brand-primary"
                    >
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>
            <button onClick={onClose} className="text-brand-text-secondary hover:text-brand-text-primary text-3xl font-light leading-none">&times;</button>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto">
            <div className="border-b border-brand-secondary sticky top-0 bg-brand-surface z-10">
                <nav className="flex space-x-4 px-6">
                    {['details', 'checklist', 'script', 'thumbnail'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)} 
                            className={`py-3 px-1 border-b-2 font-medium capitalize ${activeTab === tab ? 'border-brand-primary text-brand-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'}`}
                        >
                            {tab === 'details' ? 'Detalhes' : tab === 'checklist' ? 'Checklist' : tab === 'script' ? 'Roteiro' : 'Thumbnail'}
                        </button>
                    ))}
                </nav>
            </div>

            <div className="p-6">
                {isLoading && <div className="text-center p-8 text-brand-text-secondary">Gerando com IA, por favor aguarde...</div>}

                {!isLoading && activeTab === 'details' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Data de Início</label>
                                <input 
                                    type="date" 
                                    value={editableProject.start_date || ''} 
                                    onChange={(e) => handleChange('start_date', e.target.value)}
                                    onBlur={handleBlur}
                                    className="w-full p-2 bg-brand-secondary text-brand-text-primary rounded border border-transparent focus:border-brand-primary outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-brand-text-secondary mb-1">Prazo Final</label>
                                <input 
                                    type="date" 
                                    value={editableProject.end_date || ''} 
                                    onChange={(e) => handleChange('end_date', e.target.value)}
                                    onBlur={handleBlur}
                                    className="w-full p-2 bg-brand-secondary text-brand-text-primary rounded border border-transparent focus:border-brand-primary outline-none"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Link de Upload (Drive/Dropbox)</label>
                            <input 
                                type="url" 
                                value={editableProject.upload_link || ''} 
                                onChange={(e) => handleChange('upload_link', e.target.value)}
                                onBlur={handleBlur}
                                placeholder="https://..."
                                className="w-full p-2 bg-brand-secondary text-brand-text-primary rounded border border-transparent focus:border-brand-primary outline-none"
                            />
                            {editableProject.upload_link && (
                                <a href={editableProject.upload_link} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-primary hover:underline mt-1 inline-block">
                                    Abrir link &rarr;
                                </a>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-brand-text-secondary mb-1">Briefing do Projeto</label>
                            <textarea 
                                value={editableProject.brief || ''} 
                                onChange={(e) => handleChange('brief', e.target.value)}
                                onBlur={handleBlur}
                                rows={6}
                                className="w-full p-3 bg-brand-secondary text-brand-text-primary rounded border border-transparent focus:border-brand-primary outline-none resize-none"
                                placeholder="Descreva os detalhes do projeto aqui..."
                            />
                        </div>

                         <div>
                            <h3 className="text-lg font-semibold mb-2 text-brand-text-primary">Responsáveis</h3>
                            <div className="space-y-2 bg-brand-secondary/30 p-3 rounded-md">
                                {users.map(user => (
                                    <label key={user.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-brand-secondary cursor-pointer transition-colors">
                                        <input 
                                            type="checkbox" 
                                            checked={editableProject.responsible_user_ids?.includes(user.id) || false}
                                            onChange={() => handleResponsibleChange(user.id)}
                                            className="w-4 h-4 rounded bg-brand-secondary text-brand-primary focus:ring-brand-primary"
                                        />
                                        <span className="text-brand-text-primary">{user.name || user.email} <span className="text-brand-text-secondary text-sm">({user.role || 'Sem cargo'})</span></span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
                
                {!isLoading && activeTab === 'checklist' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-brand-text-primary">Checklist de Produção</h3>
                            <div className="flex gap-2">
                                <button onClick={addChecklistItem} className="px-3 py-1.5 text-sm rounded-md bg-brand-secondary text-brand-text-primary hover:bg-brand-secondary/80 flex items-center gap-1">
                                    <PlusIcon className="w-4 h-4" /> Adicionar
                                </button>
                                <button onClick={handleGenerateChecklist} className="px-3 py-1.5 text-sm rounded-md bg-brand-primary text-brand-background font-semibold hover:bg-opacity-90">
                                    Gerar com IA
                                </button>
                            </div>
                        </div>
                        {editableProject.checklist && editableProject.checklist.length > 0 ? (
                            <ul className="space-y-2">
                                {editableProject.checklist.map(item => (
                                    <li key={item.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-brand-secondary group">
                                        <div 
                                            onClick={() => toggleChecklistItem(item.id)}
                                            className={`w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center cursor-pointer transition-colors ${item.completed ? 'bg-brand-primary border-brand-primary' : 'border-brand-text-secondary/50 hover:border-brand-primary'}`}
                                        >
                                           {item.completed && <CheckIcon className="w-3 h-3 text-brand-background" />}
                                        </div>
                                        
                                        <input 
                                            type="text" 
                                            value={item.text} 
                                            onChange={(e) => updateChecklistItemText(item.id, e.target.value)}
                                            onBlur={handleBlur}
                                            className={`flex-1 bg-transparent border-none outline-none text-brand-text-primary ${item.completed ? 'line-through text-brand-text-secondary' : ''}`}
                                        />

                                        <button 
                                            onClick={() => deleteChecklistItem(item.id)}
                                            className="text-brand-text-secondary hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Remover item"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <div className="text-center py-8 border-2 border-dashed border-brand-secondary rounded-lg">
                                <p className="text-brand-text-secondary mb-2">Nenhum checklist criado.</p>
                                <button onClick={handleGenerateChecklist} className="text-brand-primary hover:underline text-sm">Gerar automaticamente</button>
                            </div>
                        )}
                    </div>
                )}

                {!isLoading && activeTab === 'script' && (
                    <div className="h-full flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-brand-text-primary">Roteiro do Vídeo</h3>
                            <button onClick={handleGenerateScript} className="px-3 py-1.5 text-sm rounded-md bg-brand-primary text-brand-background font-semibold hover:bg-opacity-90">Gerar Roteiro com IA</button>
                        </div>
                        <div className="flex-grow">
                             <textarea 
                                value={editableProject.script || ''} 
                                onChange={(e) => handleChange('script', e.target.value)}
                                onBlur={handleBlur}
                                placeholder="Escreva o roteiro aqui ou gere com a IA..."
                                className="w-full h-96 p-4 bg-brand-secondary text-brand-text-primary rounded-md border border-transparent focus:border-brand-primary outline-none font-mono text-sm leading-relaxed resize-none"
                            />
                        </div>
                    </div>
                )}

                 {!isLoading && activeTab === 'thumbnail' && (
                    <div>
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-brand-text-primary">Thumbnail (Arte Conceito)</h3>
                            <button onClick={handleGenerateImage} className="px-3 py-1.5 text-sm rounded-md bg-brand-primary text-brand-background font-semibold hover:bg-opacity-90">Gerar Imagem com IA</button>
                        </div>
                        {editableProject.thumbnail ? (
                            <div className="relative group">
                                <img src={`data:image/png;base64,${editableProject.thumbnail}`} alt="Thumbnail gerado" className="w-full h-auto rounded-lg shadow-lg" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button onClick={handleGenerateImage} className="px-4 py-2 bg-white text-black rounded font-bold">Regenerar</button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-brand-secondary rounded-lg">
                                <p className="text-brand-text-secondary mb-4">Nenhuma imagem gerada ainda.</p>
                                <button onClick={handleGenerateImage} className="px-4 py-2 bg-brand-secondary text-brand-text-primary rounded hover:bg-brand-secondary/80">Criar agora</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};