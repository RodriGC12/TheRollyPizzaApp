import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function Login() {
    const [form, setForm] = useState({ nombre_usuario: '', password: '' })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
        const res = await api.post('/auth/login', form)
        localStorage.setItem('token', res.data.token)
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario))

        const rol = res.data.usuario.rol
        if (rol === 'Administrador' || rol === 'Cajero') {
            navigate('/dashboard')
        } else {
            navigate('/mesas')
        }
    } catch (err) {
        setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
        setLoading(false)
    }
}

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4"
             style={{backgroundImage:'linear-gradient(rgba(26,111,245,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(26,111,245,0.04) 1px, transparent 1px)', backgroundSize:'40px 40px'}}>

            <div className="bg-[#111318] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">

                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-900 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/20">
                        <svg className="w-9 h-9" viewBox="0 0 38 38" fill="none">
                            <circle cx="19" cy="19" r="14" stroke="white" strokeWidth="1.5"/>
                            <path d="M12 19C12 15.5 15 12.5 19 12.5C23 12.5 26 15.5 26 19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            <circle cx="15" cy="18" r="1.5" fill="white"/>
                            <circle cx="19" cy="15.5" r="1.5" fill="white"/>
                            <circle cx="23" cy="18" r="1.5" fill="white"/>
                            <path d="M11 21L27 21" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                            <path d="M13 21L12 25L26 25L25 21" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold text-white">
                        Paris Rolly <span className="text-blue-500">Pizza</span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-1 tracking-widest uppercase">
                        Sistema de Gestión
                    </p>
                </div>

                <hr className="border-white/10 mb-6" />

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider font-medium block mb-2">
                            Usuario
                        </label>
                        <input
                            type="text"
                            placeholder="nombre.usuario"
                            value={form.nombre_usuario}
                            onChange={e => setForm({...form, nombre_usuario: e.target.value})}
                            className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition placeholder-gray-600"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 uppercase tracking-wider font-medium block mb-2">
                            Contraseña
                        </label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                            className="w-full bg-[#1a1d24] border border-white/10 rounded-xl px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition placeholder-gray-600"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition mt-2"
                    >
                        {loading ? 'Ingresando...' : 'Ingresar al sistema'}
                    </button>
                </form>

                <p className="text-center text-xs text-gray-600 mt-6">
                    Paris Rolly Pizza App v1.0 © 2026
                </p>
            </div>
        </div>
    )
}