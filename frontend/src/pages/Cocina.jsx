import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

function tiempoTranscurrido(fecha) {
    const mins = Math.floor((Date.now() - new Date(fecha).getTime()) / 60000)
    if (mins < 1)  return { texto: 'Ahora',       color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30'  }
    if (mins < 5)  return { texto: `${mins} min`,  color: 'text-green-400',  bg: 'bg-green-500/15 border-green-500/30'  }
    if (mins < 10) return { texto: `${mins} min`,  color: 'text-yellow-400', bg: 'bg-yellow-500/15 border-yellow-500/30' }
    return         { texto: `${mins} min`,          color: 'text-red-400',    bg: 'bg-red-500/15 border-red-500/30'       }
}

export default function Cocina() {
    const [ordenes, setOrdenes]   = useState([])
    const [marcando, setMarcando] = useState(null)
    const [tick, setTick]         = useState(0)
    const navigate = useNavigate()

    const cargar = useCallback(async () => {
        try {
            const res = await api.get('/ordenes/cocina')
            setOrdenes(res.data)
        } catch (err) {
            console.error(err)
        }
    }, [])

    useEffect(() => {
        cargar()
        const refresh  = setInterval(cargar,  15000)
        const reloj    = setInterval(() => setTick(t => t + 1), 60000)
        return () => { clearInterval(refresh); clearInterval(reloj) }
    }, [cargar])

    const marcarLista = async (orden_id) => {
        setMarcando(orden_id)
        try {
            await api.patch(`/ordenes/${orden_id}/estado`, { estado: 'Lista' })
            setOrdenes(prev => prev.filter(o => o.orden_id !== orden_id))
        } catch (err) {
            console.error(err)
        } finally {
            setMarcando(null)
        }
    }

    const cerrarSesion = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

            {/* TOPBAR */}
            <div className="bg-[#111318] border-b border-white/8 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-red-700 rounded-xl flex items-center justify-center text-base">
                        👨‍🍳
                    </div>
                    <div>
                        <p className="text-white text-sm font-bold">Cocina · Paris Rolly Pizza</p>
                        <p className="text-gray-500 text-xs">{usuario.nombre_completo}</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {ordenes.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 bg-orange-500/10 border border-orange-500/20 px-3 py-1.5 rounded-lg">
                            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"/>
                            {ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''} pendiente{ordenes.length !== 1 ? 's' : ''}
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1.5 rounded-lg">
                            <span className="w-2 h-2 bg-green-400 rounded-full"/>
                            Todo al día
                        </div>
                    )}
                    <button onClick={cerrarSesion}
                        className="text-xs text-gray-500 hover:text-red-400 border border-white/8 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition">
                        Cerrar sesión
                    </button>
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="flex-1 p-4 md:p-6 overflow-y-auto">
                {ordenes.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-96 text-center">
                        <div className="w-24 h-24 bg-green-500/10 border border-green-500/20 rounded-3xl flex items-center justify-center text-5xl mb-5">
                            ✅
                        </div>
                        <p className="text-white text-2xl font-bold mb-2">Todo listo</p>
                        <p className="text-gray-500 text-sm">No hay órdenes pendientes en cocina</p>
                        <p className="text-gray-600 text-xs mt-3">Actualización automática cada 15 seg</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {ordenes.map(orden => {
                            const t = tiempoTranscurrido(orden.fecha_envio_cocina)
                            const urgente = t.color === 'text-red-400'
                            return (
                                <div key={orden.orden_id}
                                    className={`bg-[#111318] rounded-2xl flex flex-col overflow-hidden border-2 transition-all ${
                                        urgente ? 'border-red-500/40' : orden.reagendada ? 'border-yellow-500/50' : 'border-white/8'
                                    }`}>

                                    {/* Header de la tarjeta */}
                                    <div className={`px-4 py-3 border-b border-white/8 flex justify-between items-center ${
                                        urgente ? 'bg-red-500/8' : orden.reagendada ? 'bg-yellow-500/8' : 'bg-[#1a1d24]'
                                    }`}>
                                        <div>
                                            <p className="text-white text-lg font-bold">Mesa {orden.nro_mesa}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-gray-500 text-xs">Orden #{orden.orden_id}</p>
                                                {orden.reagendada && (
                                                    <span className="text-xs font-bold text-yellow-400 bg-yellow-500/15 border border-yellow-500/30 px-2 py-0.5 rounded-lg animate-pulse">
                                                        ⚡ Actualizada
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className={`text-xs font-bold px-2.5 py-1.5 rounded-xl border ${t.bg} ${t.color}`}>
                                            ⏱ {t.texto}
                                        </span>
                                    </div>

                                    {/* Lista de productos */}
                                    <div className="flex-1 p-4 space-y-3">
                                        {orden.productos?.map(p => (
                                            <div key={p.detalle_id} className="flex gap-3 items-start">
                                                <span className="w-8 h-8 bg-orange-500/15 border border-orange-500/25 text-orange-400 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0">
                                                    {p.cantidad}
                                                </span>
                                                <div className="min-w-0">
                                                    <p className="text-white text-sm font-semibold leading-snug">{p.producto}</p>
                                                    {p.observacion && (
                                                        <p className="text-yellow-400 text-xs mt-0.5 font-medium">
                                                            ⚠ {p.observacion}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Botón lista */}
                                    <div className="p-4 pt-2">
                                        <button
                                            onClick={() => marcarLista(orden.orden_id)}
                                            disabled={marcando === orden.orden_id}
                                            className="w-full bg-green-500 hover:bg-green-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition text-sm tracking-wide">
                                            {marcando === orden.orden_id ? 'Marcando...' : '✓  Lista — Listo para servir'}
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
