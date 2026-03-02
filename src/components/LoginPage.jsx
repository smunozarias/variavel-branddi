import React, { useState } from "react";
import { LogIn, Mail, Lock, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Preencha email e senha");
      return;
    }

    if (password.length < 6) {
      toast.error("Senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      await onLogin(email, password, isSignUp);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-lg">
              <LogIn className="text-white" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Variável</h1>
          <p className="text-gray-600">
            {isSignUp ? "Criar nova conta" : "Acessar aplicação"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition"
                disabled={loading}
              />
            </div>
            {isSignUp && (
              <p className="text-xs text-gray-500 mt-1">
                Mínimo 6 caracteres
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-2 rounded-lg transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <LogIn size={20} />
                {isSignUp ? "Criar Conta" : "Entrar"}
              </>
            )}
          </button>
        </form>

        {/* Toggle Sign Up */}
        <div className="mt-6 text-center border-t pt-6">
          <p className="text-gray-600 text-sm mb-3">
            {isSignUp
              ? "Já tem uma conta?"
              : "Não tem conta?"}
          </p>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setEmail("");
              setPassword("");
            }}
            className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
          >
            {isSignUp ? "Fazer login" : "Criar nova conta"}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle size={20} className="text-blue-600 flex-shrink-0" />
            <p className="text-sm text-blue-700">
              Use seu email e crie uma senha segura. Esta é uma aplicação em desenvolvimento.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
