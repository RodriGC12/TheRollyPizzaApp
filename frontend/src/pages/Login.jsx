import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import api from '../services/api'

const inputBase = {
    width: '100%',
    height: '48px',
    background: '#1a1d24',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    fontSize: '16px', // 16px evita el zoom automático en iOS
    color: '#fff',
    outline: 'none',
    transition: 'border 0.15s, box-shadow 0.15s',
}

export default function Login() {
    const [form, setForm]             = useState({ nombre_usuario: '', password: '' })
    const [showPassword, setShowPass] = useState(false)
    const [error, setError]           = useState('')
    const [loading, setLoading]       = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        try {
            const res = await api.post('/auth/login', form)
            localStorage.setItem('token',   res.data.token)
            localStorage.setItem('usuario', JSON.stringify(res.data.usuario))

            const rol = (res.data.usuario.rol || '').toLowerCase()
            if (rol === 'administrador')  navigate('/dashboard')
            else if (rol === 'cajero')    navigate('/caja')
            else if (rol === 'cocina')    navigate('/cocina')
            else                          navigate('/mesas')
        } catch (err) {
            setError(err.response?.data?.error || 'Credenciales incorrectas')
        } finally {
            setLoading(false)
        }
    }

    const onFocus = e => {
        e.target.style.border = '1px solid #667EEA'
        e.target.style.boxShadow = '0 0 0 3px rgba(102,126,234,0.12)'
    }
    const onBlur = e => {
        e.target.style.border = '1px solid rgba(255,255,255,0.08)'
        e.target.style.boxShadow = 'none'
    }

    return (
        <div
            className="min-h-screen flex flex-col justify-center items-center"
            style={{
                background: 'linear-gradient(135deg, #0a0a0a 0%, #111318 50%, #0a0a0a 100%)',
                padding: '16px',
            }}
        >
            {/* Grid de fondo */}
            <div className="fixed inset-0 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(rgba(102,126,234,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(102,126,234,0.025) 1px, transparent 1px)',
                backgroundSize: '40px 40px'
            }}/>

            {/* Glow detrás del card */}
            <div className="fixed pointer-events-none" style={{
                top: '10%', left: '50%', transform: 'translateX(-50%)',
                width: '500px', height: '280px',
                background: 'radial-gradient(ellipse, rgba(102,126,234,0.07) 0%, transparent 70%)',
                filter: 'blur(50px)'
            }}/>

            <div className="relative w-full" style={{ maxWidth: '400px' }}>

                {/* ── LOGO ── */}
                <div className="flex flex-col items-center mb-6">
                    <div
                        className="flex items-center justify-center mb-3"
                        style={{
                            width: '60px', height: '60px',
                            background: 'linear-gradient(135deg, #667EEA, #764BA2)',
                            borderRadius: '18px',
                            boxShadow: '0 8px 28px rgba(102,126,234,0.4), 0 0 0 1px rgba(102,126,234,0.2)'
                        }}
                    >
                        <span style={{ fontSize: '26px' }}>🍕</span>
                    </div>
                    <h1 style={{
                        fontSize: 'clamp(20px, 5vw, 24px)',
                        fontWeight: 800,
                        letterSpacing: '-0.4px',
                        background: 'linear-gradient(135deg, #ffffff 40%, #a78bfa)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        marginBottom: '4px',
                        textAlign: 'center',
                    }}>
                        Paris Rolly Pizza
                    </h1>
                    <p style={{ color: '#6B7280', fontSize: '11px', letterSpacing: '0.08em' }}>
                        SISTEMA DE GESTIÓN POS
                    </p>
                </div>

                {/* ── CARD ── */}
                <div style={{
                    background: '#111318',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '20px',
                    boxShadow: '0 20px 56px rgba(0,0,0,0.55), 0 0 0 1px rgba(102,126,234,0.04)',
                    padding: 'clamp(20px, 6vw, 36px) clamp(18px, 6vw, 36px) clamp(18px, 5vw, 28px)',
                }}>

                    <div style={{ marginBottom: '24px' }}>
                        <h2 style={{ color: '#fff', fontSize: 'clamp(16px, 4vw, 18px)', fontWeight: 700, marginBottom: '5px' }}>
                            Bienvenido de vuelta
                        </h2>
                        <p style={{ color: '#6B7280', fontSize: '13px' }}>
                            Ingresa tus credenciales para acceder
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

                        {/* Usuario */}
                        <div>
                            <label style={{
                                display: 'block', color: '#9CA3AF',
                                fontSize: '11px', fontWeight: 600,
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                                marginBottom: '7px'
                            }}>
                                Usuario
                            </label>
                            <input
                                type="text"
                                placeholder="nombre.usuario"
                                value={form.nombre_usuario}
                                onChange={e => setForm({ ...form, nombre_usuario: e.target.value })}
                                onFocus={onFocus}
                                onBlur={onBlur}
                                autoCapitalize="none"
                                autoCorrect="off"
                                required
                                style={{ ...inputBase, padding: '0 16px' }}
                            />
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label style={{
                                display: 'block', color: '#9CA3AF',
                                fontSize: '11px', fontWeight: 600,
                                letterSpacing: '0.06em', textTransform: 'uppercase',
                                marginBottom: '7px'
                            }}>
                                Contraseña
                            </label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={form.password}
                                    onChange={e => setForm({ ...form, password: e.target.value })}
                                    onFocus={onFocus}
                                    onBlur={onBlur}
                                    required
                                    style={{ ...inputBase, padding: '0 48px 0 16px' }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(v => !v)}
                                    style={{
                                        position: 'absolute', right: '14px',
                                        top: '50%', transform: 'translateY(-50%)',
                                        color: '#4B5563', background: 'none', border: 'none',
                                        cursor: 'pointer', padding: '4px',
                                        display: 'flex', alignItems: 'center',
                                        // tap target grande para móvil
                                        minWidth: '32px', minHeight: '32px', justifyContent: 'center'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#9CA3AF'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#4B5563'}
                                >
                                    {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <div style={{
                                background: 'rgba(239,68,68,0.08)',
                                border: '1px solid rgba(239,68,68,0.2)',
                                borderRadius: '10px',
                                padding: '11px 14px',
                                color: '#f87171',
                                fontSize: '13px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                            }}>
                                <span style={{ flexShrink: 0 }}>⚠</span>
                                {error}
                            </div>
                        )}

                        {/* Botón submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="active:scale-[0.97]"
                            style={{
                                width: '100%',
                                height: '50px',
                                background: loading
                                    ? 'rgba(102,126,234,0.45)'
                                    : 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: '#fff',
                                fontSize: '15px',
                                fontWeight: 700,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                boxShadow: loading ? 'none' : '0 4px 18px rgba(102,126,234,0.38)',
                                transition: 'filter 0.15s, box-shadow 0.15s',
                                marginTop: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px',
                            }}
                            onMouseEnter={e => { if (!loading) e.currentTarget.style.filter = 'brightness(112%)' }}
                            onMouseLeave={e => { e.currentTarget.style.filter = 'none' }}
                        >
                            {loading ? (
                                <>
                                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.25)" strokeWidth="3"/>
                                        <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                                    </svg>
                                    Verificando...
                                </>
                            ) : 'Ingresar al Sistema'}
                        </button>
                    </form>

                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '22px', paddingTop: '16px' }}>
                        <p style={{ textAlign: 'center', color: '#374151', fontSize: '11px', letterSpacing: '0.02em' }}>
                            Paris Rolly Pizza © 2026 · POS v2.0
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
