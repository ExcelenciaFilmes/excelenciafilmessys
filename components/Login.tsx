
import React, { useState, useEffect } from 'react';
import { EyeIcon, EyeOffIcon, ExcelenciaLogo } from './icons';
import { supabase } from '../supabaseClient';

interface LoginProps {
  onLogin: (credentials: any) => Promise<void>;
  onRegister: (credentials: any) => Promise<void>;
}

const Login: React.FC<LoginProps> = ({ onLogin, onRegister }) => {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [hasAuthError, setHasAuthError] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'checking' | 'connected' | 'error'>('checking');

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
        const { error } = await supabase.from('projects').select('count', { count: 'exact', head: true });
        // Se o erro for de autenticação (PGRST301), ainda assim significa que conectou no banco
        if (!error || error.code === 'PGRST301') {
            setConnectionStatus('connected');
        } else {
            console.error("Erro conexão:", error);
            setConnectionStatus('error');
        }
    } catch (e) {
        console.error("Erro conexão catch:", e);
        setConnectionStatus('error');
    }
  };

  const resetFeedback = () => {
    setError(null);
    setMessage(null);
    setHasAuthError(false);
  };

  const handleInputChange = (setter: React.Dispatch<React.SetStateAction<string>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setter(e.target.value);
    if (error || hasAuthError) {
      resetFeedback();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    resetFeedback(); 

    try {
      if (isRegisterMode) {
        await onRegister({ name, email, password });
        setMessage('Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.');
        setIsRegisterMode(false);
        setName('');
        setPassword('');
      } else {
        await onLogin({ email, password });
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Ocorreu um erro desconhecido.';
      console.error("Authentication error:", err);
      
      setHasAuthError(true);
      setPassword(''); 

      const lowerCaseError = errorMessage.toLowerCase();

      if (lowerCaseError.includes('failed to fetch')) {
        setError('Falha na conexão. Verifique sua internet e se a URL do banco de dados e as configurações de CORS estão corretas.');
      } else if (lowerCaseError.includes('user already registered')) {
        setError('Este e-mail já está cadastrado. O formulário foi alterado para o modo de login. Por favor, digite sua senha para entrar.');
        setIsRegisterMode(false);
        setName('');
      } else if (lowerCaseError.includes('invalid login credentials')) {
        setError('E-mail ou senha inválidos. Por favor, verifique seus dados ou cadastre-se se for um novo usuário.');
      } else if (lowerCaseError.includes('email not confirmed')) {
        setError('Seu e-mail ainda não foi confirmado. Por favor, verifique sua caixa de entrada.');
      } else if (lowerCaseError.includes('database error saving new user')) {
        setError('Ocorreu um erro de configuração no banco de dados que impediu a criação do perfil de usuário. Por favor, contate o administrador do sistema.');
      } else {
        setError(`Ocorreu um erro ao tentar autenticar: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegisterMode(!isRegisterMode);
    resetFeedback();
    setPassword('');
  }
  
  const inputBaseClasses = "appearance-none relative block w-full px-3 py-2 border placeholder-gray-500 text-brand-text-primary bg-brand-secondary rounded-md focus:outline-none focus:ring-brand-primary focus:border-brand-primary sm:text-sm";
  const inputErrorClasses = hasAuthError ? "border-red-500" : "border-brand-secondary";

  return (
    <div className="min-h-screen bg-brand-background flex items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-8 bg-brand-surface rounded-lg shadow-lg relative overflow-hidden">
        {/* Connection Status Indicator */}
        <div className={`absolute top-0 left-0 w-full h-1 ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'}`} />

        <div className="flex flex-col items-center">
          <ExcelenciaLogo className="h-28 w-28 mb-6" />
          <h2 className="text-center text-3xl font-extrabold text-brand-text-primary">
            {isRegisterMode ? 'Crie sua conta' : 'Acesse sua conta'}
          </h2>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            {isRegisterMode && (
              <div>
                <label htmlFor="name" className="sr-only">Nome</label>
                <input
                  id="name" name="name" type="text" autoComplete="name" required
                  className={`${inputBaseClasses} ${inputErrorClasses}`}
                  placeholder="Nome Completo" value={name} onChange={handleInputChange(setName)}
                />
              </div>
            )}
            <div>
              <label htmlFor="email-address" className="sr-only">Email</label>
              <input
                id="email-address" name="email" type="email" autoComplete="email" required
                className={`${inputBaseClasses} ${inputErrorClasses}`}
                placeholder="Email" value={email} onChange={handleInputChange(setEmail)}
              />
            </div>
            <div className="relative">
              <label htmlFor="password" className="sr-only">Senha</label>
              <input
                id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={isRegisterMode ? "new-password" : "current-password"} required
                className={`${inputBaseClasses} ${inputErrorClasses}`}
                placeholder="Senha" value={password} onChange={handleInputChange(setPassword)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-brand-primary"
                aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOffIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
              </button>
            </div>
          </div>
          
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}
          {message && <p className="text-green-400 text-sm text-center font-medium">{message}</p>}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-brand-background bg-brand-primary hover:bg-opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Aguarde...' : (isRegisterMode ? 'Cadastrar' : 'Entrar')}
            </button>
          </div>
        </form>
        <div className="text-center text-sm space-y-2">
          <button onClick={toggleMode} className="font-medium text-brand-primary hover:underline block w-full">
            {isRegisterMode ? 'Já tem uma conta? Faça login' : 'Não tem uma conta? Cadastre-se'}
          </button>
          
          <div className="pt-4 flex justify-center gap-2 text-xs">
            <span className={connectionStatus === 'connected' ? "text-green-500" : "text-red-500"}>
                ● {connectionStatus === 'connected' ? 'Servidor Online' : connectionStatus === 'checking' ? 'Verificando...' : 'Servidor Offline'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
