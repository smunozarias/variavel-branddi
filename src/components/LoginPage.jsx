import React, { useState } from "react";
import { Lock, AlertCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage({ onLogin }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!password) {
      toast.error("Preencha a senha");
      return;
    }

    setLoading(true);

    try {
      await onLogin(password);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#021017] to-[#05202B] flex items-center justify-center p-4">
      <div className="bg-[#0A2230] rounded-lg shadow-2xl p-8 w-full max-w-md border border-[#00D4C5]/20">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-[#00D4C5] p-3 rounded-2xl">
              <Lock className="text-[#021017]" size={32} />
            </div>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-2">Variável</h1>
          <p className="text-[#00D4C5] font-semibold text-sm uppercase tracking-widest">
            Comercial Branddi
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-[#00D4C5] mb-2 uppercase tracking-wider">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-[#00D4C5]" size={20} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                className="w-full pl-10 pr-4 py-3 bg-[#051F2B] border border-[#00D4C5]/30 rounded-lg focus:ring-2 focus:ring-[#00D4C5] focus:border-transparent outline-none transition text-white placeholder-gray-500"
                disabled={loading}
                autoFocus
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#00D4C5] hover:bg-[#00B8A9] disabled:bg-gray-500 text-[#021017] font-black py-3 rounded-lg transition flex items-center justify-center gap-2 uppercase tracking-widest text-sm"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Lock size={20} />
                Entrar
              </>
            )}
          </button>
        </form>

        {/* Info */}
        <div className="mt-6 bg-[#051F2B] border border-[#00D4C5]/30 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertCircle size={20} className="text-[#00D4C5] flex-shrink-0" />
            <p className="text-xs text-[#00D4C5] leading-relaxed">
              Digite a senha para acessar a aplicação Variável Comercial.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
