import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { generarFacturaPDF } from '../utils/factura'
import { DollarSign, ShoppingBag, Users, TrendingUp } from 'lucide-react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, AreaChart, Area
} from 'recharts'



export default function Dashboard() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const [paginaActiva, setPaginaActiva] = useState('dashboard')
    const [ordenesActivas, setOrdenesActivas] = useState([])
    const [ventasDia,      setVentasDia]      = useState({ total_ventas: 0, total_ordenes: 0 })
    const [ventasSemana,   setVentasSemana]   = useState([])
    const [ventasHora,     setVentasHora]     = useState([])
    const [mesas,          setMesas]          = useState([])
    const [cargando,       setCargando]       = useState(false)
    const navigate = useNavigate()

    useEffect(() => { cargarDatos() }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const hoy = new Date()
            const fechas = Array.from({ length: 7 }, (_, i) => {
                const d = new Date(hoy)
                d.setDate(d.getDate() - (6 - i))
                return d.toISOString().split('T')[0]
            })

            const [ordenes, caja, mesasRes, ...historiales] = await Promise.all([
                api.get('/ordenes'),
                api.get('/caja'),
                api.get('/mesas'),
                ...fechas.map(f => api.get(`/caja/historial?fecha=${f}`))
            ])

            setOrdenesActivas(ordenes.data)
            setVentasDia(caja.data.ventas)
            setMesas(mesasRes.data)

            const dias = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
            setVentasSemana(fechas.map((fecha, i) => {
                const d = new Date(fecha + 'T12:00:00')
                const total = historiales[i].data.reduce((s, o) => s + Number(o.total), 0)
                return { dia: dias[d.getDay()], ventas: parseFloat(total.toFixed(2)) }
            }))

            // Ventas por hora del día de hoy
            const todayOrdenes = historiales[6].data
            const horas = {}
            for (let h = 8; h <= 22; h++) horas[`${h}h`] = 0
            todayOrdenes.forEach(o => {
                const h = new Date(o.fecha_cierre).getHours()
                const key = `${h}h`
                if (key in horas) horas[key] = parseFloat((horas[key] + Number(o.total)).toFixed(2))
            })
            setVentasHora(Object.entries(horas).map(([hora, ventas]) => ({ hora, ventas })))

        } catch (err) {
            console.error(err)
        } finally {
            setCargando(false)
        }
    }

    const cerrarSesion = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        navigate('/login')
    }

    const getBadge = (estado) => {
        const badges = {
            Pendiente: 'bg-yellow-500/15 text-yellow-400',
            EnCocina:  'bg-blue-500/15 text-blue-400',
            Lista:     'bg-green-500/15 text-green-400',
            Cerrada:   'bg-white/10 text-gray-400',
            Cancelada: 'bg-red-500/15 text-red-400'
        }
        return badges[estado] || 'bg-white/10 text-gray-400'
    }

    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '▦' },
        { id: 'ordenes',   label: 'Pedidos',   icon: '≡' },
        { id: 'historial', label: 'Historial',  icon: '📋' },
        { id: 'menu',      label: 'Menú',       icon: '🍕' },
        { id: 'usuarios',  label: 'Usuarios',   icon: '👤' },
        { id: 'caja',      label: 'Caja',       icon: '💰' },
    ]

    const cambiarPagina = (id) => {
        setPaginaActiva(id)
        if (id === 'dashboard') cargarDatos()
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            <aside className="w-16 md:w-56 min-h-screen bg-[#111318] border-r border-white/8 flex flex-col flex-shrink-0">
                <div className="p-3 md:p-4 border-b border-white/8 flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-blue-900 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-sm">🍕</span>
                    </div>
                    <div className="hidden md:block">
                        <p className="text-white text-xs font-bold">Paris Rolly Pizza</p>
                        <p className="text-gray-500 text-xs">{usuario.rol}</p>
                    </div>
                </div>
                <nav className="flex-1 p-2 md:p-3 space-y-1">
                    {navItems.map(item => (
                        <button key={item.id} onClick={() => cambiarPagina(item.id)}
                            className={`w-full flex items-center gap-3 px-2 md:px-3 py-2.5 rounded-xl text-sm font-medium transition
                                ${paginaActiva === item.id
                                    ? 'bg-blue-500/12 text-blue-400 border border-blue-500/20'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                            <span className="text-base flex-shrink-0">{item.icon}</span>
                            <span className="hidden md:block">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-2 md:p-3 border-t border-white/8">
                    <div className="hidden md:flex items-center gap-2 px-3 py-2 bg-[#1a1d24] rounded-xl mb-2">
                        <div className="w-7 h-7 bg-blue-900 rounded-lg flex items-center justify-center text-xs font-bold text-blue-300">
                            {usuario.nombre_completo?.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-xs font-semibold truncate">{usuario.nombre_completo?.split(' ')[0]}</p>
                            <p className="text-gray-500 text-xs">{usuario.rol}</p>
                        </div>
                    </div>
                    <button onClick={cerrarSesion} className="w-full text-xs text-gray-500 hover:text-red-400 border border-white/8 hover:border-red-500/30 rounded-lg py-2 transition">
                        <span className="md:hidden">✕</span>
                        <span className="hidden md:inline">Cerrar sesión</span>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                <div className="bg-[#111318] border-b border-white/8 px-4 md:px-7 py-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <h1 className="text-white text-sm md:text-base font-semibold truncate">
                            {navItems.find(n => n.id === paginaActiva)?.label}
                        </h1>
                        <p className="text-gray-500 text-xs hidden sm:block">Paris Rolly Pizza · Admin</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => navigate('/mesas')}
                            className="text-xs text-blue-400 border border-blue-500/20 bg-blue-500/10 px-2.5 py-1.5 rounded-lg hover:bg-blue-500/20 transition">
                            <span className="hidden sm:inline">🗺 Mapa de mesas</span>
                            <span className="sm:hidden">🗺</span>
                        </button>
                        {paginaActiva === 'dashboard' && (
                            <button onClick={cargarDatos} className="text-xs text-gray-400 hover:text-blue-400 border border-white/8 px-2.5 py-1.5 rounded-lg transition">
                                <span className="hidden sm:inline">{cargando ? '⟳ Actualizando...' : '⟳ Actualizar'}</span>
                                <span className="sm:hidden">⟳</span>
                            </button>
                        )}
                        <div className="hidden md:block text-xs text-gray-500 bg-[#1a1d24] border border-white/8 px-2.5 py-1.5 rounded-lg">
                            {new Date().toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-4 md:p-7 overflow-y-auto">
                    {paginaActiva === 'dashboard' && (
                        <DashboardHome
                            ventasDia={ventasDia}
                            ordenesActivas={ordenesActivas}
                            mesas={mesas}
                            ventasSemana={ventasSemana}
                            ventasHora={ventasHora}
                            getBadge={getBadge}
                            cambiarPagina={cambiarPagina}
                        />
                    )}

                    {paginaActiva === 'ordenes'  && <PaginaOrdenes getBadge={getBadge} />}
                    {paginaActiva === 'historial' && <PaginaHistorial />}
                    {paginaActiva === 'menu'      && <PaginaMenu />}
                    {paginaActiva === 'usuarios'  && <PaginaUsuarios />}
                    {paginaActiva === 'caja'      && <PaginaCaja />}
                </div>
            </div>
        </div>
    )
}

/* ==================== TOOLTIP CUSTOM ==================== */
function ChartTooltip({ active, payload, label }) {
    if (!active || !payload?.length) return null
    return (
        <div style={{ background: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', padding: '8px 12px', fontSize: '12px' }}>
            <p style={{ color: '#9CA3AF', marginBottom: '3px' }}>{label}</p>
            <p style={{ color: '#fff', fontWeight: 700 }}>
                ${payload[0].value.toFixed(2)}
            </p>
        </div>
    )
}

/* ==================== DASHBOARD HOME ==================== */
function DashboardHome({ ventasDia, ordenesActivas, mesas, ventasSemana, ventasHora, getBadge, cambiarPagina }) {
    const totalVentas   = Number(ventasDia.total_ventas || 0)
    const totalOrdenes  = Number(ventasDia.total_ordenes || 0)
    const ticketProm    = totalOrdenes > 0 ? totalVentas / totalOrdenes : 0
    const mesasOcupadas = mesas.filter(m => m.estado !== 'Disponible').length

    const stats = [
        { label: 'Ventas del día',   value: `$${totalVentas.toFixed(2)}`,  icon: DollarSign,  color: '#22C55E', bg: 'rgba(34,197,94,0.12)'    },
        { label: 'Pedidos activos',  value: ordenesActivas.length,         icon: ShoppingBag, color: '#667EEA', bg: 'rgba(102,126,234,0.12)'  },
        { label: 'Mesas ocupadas',   value: `${mesasOcupadas}/${mesas.length}`, icon: Users,  color: '#FBBF24', bg: 'rgba(251,191,36,0.12)'   },
        { label: 'Ticket promedio',  value: `$${ticketProm.toFixed(2)}`,   icon: TrendingUp,  color: '#1A6FF5', bg: 'rgba(26,111,245,0.12)'   },
    ]

    const cocinaEstados = [
        { label: 'Pendientes',  estado: 'Pendiente',  color: '#FBBF24', bg: 'rgba(251,191,36,0.1)',   border: 'rgba(251,191,36,0.2)'   },
        { label: 'En cocina',   estado: 'EnCocina',   color: '#667EEA', bg: 'rgba(102,126,234,0.1)',  border: 'rgba(102,126,234,0.2)'  },
        { label: 'Listas',      estado: 'Lista',      color: '#22C55E', bg: 'rgba(34,197,94,0.1)',    border: 'rgba(34,197,94,0.2)'    },
        { label: 'Por cobrar',  estado: 'PorCobrar',  color: '#F97316', bg: 'rgba(249,115,22,0.1)',   border: 'rgba(249,115,22,0.2)'   },
    ]

    return (
        <div className="space-y-5">
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon
                    return (
                        <div key={i} className="bg-[#111318] border border-white/8 rounded-2xl p-4 md:p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                    style={{ background: s.bg }}>
                                    <Icon size={17} style={{ color: s.color }} />
                                </div>
                            </div>
                            <p className="text-white text-xl md:text-2xl font-bold leading-none mb-1">{s.value}</p>
                            <p className="text-gray-500 text-xs">{s.label}</p>
                        </div>
                    )
                })}
            </div>

            {/* Gráficos fila */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Bar chart ventas semana */}
                <div className="lg:col-span-2 bg-[#111318] border border-white/8 rounded-2xl p-5">
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="text-white text-sm font-semibold">Ventas de la semana</p>
                            <p className="text-gray-500 text-xs mt-0.5">
                                Total: ${ventasSemana.reduce((s, d) => s + d.ventas, 0).toFixed(2)}
                            </p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.2)', color: '#667EEA' }}>
                            Últimos 7 días
                        </span>
                    </div>
                    <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={ventasSemana} barSize={24}>
                            <defs>
                                <linearGradient id="barG" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#667EEA" />
                                    <stop offset="100%" stopColor="#764BA2" />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                            <XAxis dataKey="dia" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} tickFormatter={v => `$${v}`} width={50} />
                            <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                            <Bar dataKey="ventas" fill="url(#barG)" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Estado cocina */}
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                    <p className="text-white text-sm font-semibold mb-4">Estado de cocina</p>
                    <div className="space-y-3">
                        {cocinaEstados.map(e => {
                            const count = ordenesActivas.filter(o => o.estado === e.estado).length
                            return (
                                <div key={e.estado} className="flex items-center justify-between rounded-xl px-4 py-3"
                                    style={{ background: e.bg, border: `1px solid ${e.border}` }}>
                                    <p className="text-sm font-medium" style={{ color: e.color }}>{e.label}</p>
                                    <p className="text-2xl font-bold" style={{ color: e.color, lineHeight: 1 }}>{count}</p>
                                </div>
                            )
                        })}
                    </div>
                    <div className="mt-3 pt-3 border-t border-white/5 flex justify-between items-center">
                        <p className="text-gray-500 text-xs">Total en curso</p>
                        <p className="text-white text-lg font-bold">{ordenesActivas.length}</p>
                    </div>
                </div>
            </div>

            {/* Area chart ventas del día */}
            <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-white text-sm font-semibold">Ventas del día por hora</p>
                        <p className="text-gray-500 text-xs mt-0.5">Ingresos acumulados hoy</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#667EEA' }}/>
                        <span className="text-gray-400 text-xs">Ventas ($)</span>
                    </div>
                </div>
                <ResponsiveContainer width="100%" height={140}>
                    <AreaChart data={ventasHora}>
                        <defs>
                            <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#667EEA" stopOpacity={0.25} />
                                <stop offset="100%" stopColor="#667EEA" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                        <XAxis dataKey="hora" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={v => `$${v}`} width={45} />
                        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgba(102,126,234,0.3)', strokeWidth: 1 }} />
                        <Area type="monotone" dataKey="ventas" stroke="#667EEA" strokeWidth={2} fill="url(#areaG)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>

            {/* Órdenes activas recientes */}
            <div className="bg-[#111318] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center">
                    <p className="text-white text-sm font-semibold">Órdenes activas</p>
                    <button onClick={() => cambiarPagina('ordenes')} className="text-blue-400 text-xs hover:text-blue-300 transition">
                        Ver todas →
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide">#</th>
                                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide">Mesa</th>
                                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide hidden md:table-cell">Mesero</th>
                                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide">Total</th>
                                <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide">Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {ordenesActivas.length === 0 ? (
                                <tr><td colSpan="5" className="text-center text-gray-500 text-sm py-8">No hay órdenes activas</td></tr>
                            ) : ordenesActivas.slice(0, 8).map(orden => (
                                <tr key={orden.orden_id} className="border-b border-white/4 hover:bg-white/2">
                                    <td className="px-5 py-3 text-blue-400 text-sm font-bold">#{orden.orden_id}</td>
                                    <td className="px-5 py-3 text-gray-200 text-sm">Mesa {orden.nro_mesa}</td>
                                    <td className="px-5 py-3 text-gray-400 text-sm hidden md:table-cell">{orden.mesero}</td>
                                    <td className="px-5 py-3 text-white text-sm font-semibold">${Number(orden.total).toFixed(2)}</td>
                                    <td className="px-5 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getBadge(orden.estado)}`}>{orden.estado}</span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

/* ==================== PEDIDOS ==================== */
function PaginaOrdenes({ getBadge }) {
    const [ordenes,   setOrdenes]   = useState([])
    const [detalle,   setDetalle]   = useState(null)
    const [filtro,    setFiltro]    = useState('Todos')
    const [productos, setProductos] = useState([])
    const [agregando, setAgregando] = useState(false)
    const [prodSel,   setProdSel]   = useState('')
    const [cantidad,  setCantidad]  = useState(1)
    const [obs,       setObs]       = useState('')
    const [msg,       setMsg]       = useState('')

    useEffect(() => {
        cargar()
        api.get('/menu/productos').then(r => setProductos(r.data))
        const iv = setInterval(cargar, 15000)
        return () => clearInterval(iv)
    }, [])

    const cargar = async () => {
        const res = await api.get('/ordenes')
        setOrdenes(res.data)
    }

    const verDetalle = async (orden) => {
        setMsg('')
        setAgregando(false)
        const res = await api.get(`/ordenes/${orden.orden_id}`)
        setDetalle(res.data)
    }

    const cambiarEstado = async (id, estado) => {
        await api.patch(`/ordenes/${id}/estado`, { estado })
        cargar()
        if (detalle?.orden_id === id) {
            const res = await api.get(`/ordenes/${id}`)
            setDetalle(res.data)
        }
    }

    const eliminarOrden = async (id) => {
        if (!confirm('¿Eliminar esta orden?')) return
        await api.delete(`/ordenes/${id}`)
        setDetalle(null)
        cargar()
    }

    const eliminarProducto = async (detalleId) => {
        await api.delete(`/ordenes/${detalle.orden_id}/producto/${detalleId}`)
        const res = await api.get(`/ordenes/${detalle.orden_id}`)
        setDetalle(res.data)
        cargar()
    }

    const agregarProducto = async () => {
        if (!prodSel) return
        try {
            await api.post(`/ordenes/${detalle.orden_id}/producto`, { producto_id: prodSel, cantidad, observacion: obs })
            setAgregando(false)
            setProdSel('')
            setCantidad(1)
            setObs('')
            const res = await api.get(`/ordenes/${detalle.orden_id}`)
            setDetalle(res.data)
            cargar()
        } catch (err) {
            setMsg(err.response?.data?.error || 'Error agregando producto')
        }
    }

    const estadoCfg = {
        Pendiente:  { label: 'Pendiente',   dot: 'bg-yellow-400', border: 'border-yellow-500/25', badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
        EnCocina:   { label: 'En Cocina',   dot: 'bg-blue-400',   border: 'border-blue-500/25',   badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30'   },
        Lista:      { label: 'Lista ✓',     dot: 'bg-green-400',  border: 'border-green-500/25',  badge: 'bg-green-500/15 text-green-400 border-green-500/30'  },
        PorCobrar:  { label: 'Por Cobrar',  dot: 'bg-amber-400',  border: 'border-amber-500/25',  badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30'  },
        Cerrada:    { label: 'Cerrada',     dot: 'bg-gray-400',   border: 'border-white/8',       badge: 'bg-white/10 text-gray-400 border-white/15'           },
        Cancelada:  { label: 'Cancelada',   dot: 'bg-red-400',    border: 'border-red-500/25',    badge: 'bg-red-500/15 text-red-400 border-red-500/30'        },
    }

    const filtros = [
        { key: 'Todos',     label: 'Todos' },
        { key: 'Pendiente', label: 'Pendiente' },
        { key: 'EnCocina',  label: 'En Cocina' },
        { key: 'Lista',     label: 'Lista' },
        { key: 'PorCobrar', label: 'Por Cobrar' },
    ]
    const ordenesFiltradas = filtro === 'Todos' ? ordenes : ordenes.filter(o => o.estado === filtro)

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-white font-bold text-lg">Pedidos activos</h2>
                    <p className="text-gray-500 text-sm">{ordenes.length} orden{ordenes.length !== 1 ? 'es' : ''} · actualización automática</p>
                </div>
                <button onClick={cargar}
                    className="self-start sm:self-auto text-xs text-gray-400 hover:text-white border border-white/8 hover:border-white/20 px-3 py-1.5 rounded-lg transition">
                    ⟳ Actualizar
                </button>
            </div>

            {/* Filtros con conteo */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
                {filtros.map(f => {
                    const count = f.key === 'Todos' ? ordenes.length : ordenes.filter(o => o.estado === f.key).length
                    const cfg = estadoCfg[f.key]
                    return (
                        <button key={f.key} onClick={() => setFiltro(f.key)}
                            className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                                filtro === f.key
                                    ? (cfg ? `bg-opacity-20 ${cfg.badge}` : 'bg-[#667EEA]/15 border-[#667EEA]/30 text-[#a78bfa]')
                                    : 'bg-[#111318] border-white/8 text-gray-400 hover:text-white'
                            }`}
                            style={filtro === f.key && !cfg ? { background: 'rgba(102,126,234,0.15)', borderColor: 'rgba(102,126,234,0.3)', color: '#c4b5fd' } : {}}>
                            {cfg && <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`}/>}
                            {f.label}
                            <span className="px-1.5 py-0.5 rounded-md bg-white/10 text-gray-300 text-xs">{count}</span>
                        </button>
                    )
                })}
            </div>

            {/* Grid de órdenes */}
            {ordenesFiltradas.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-16 h-16 bg-white/5 border border-white/8 rounded-2xl flex items-center justify-center text-3xl mb-4">📋</div>
                    <p className="text-white font-semibold mb-1">Sin órdenes</p>
                    <p className="text-gray-500 text-sm">No hay órdenes con estado "{filtro === 'Todos' ? 'activas' : filtro}"</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {ordenesFiltradas.map(orden => {
                        const cfg = estadoCfg[orden.estado] || estadoCfg.Cerrada
                        return (
                            <div key={orden.orden_id}
                                className={`bg-[#111318] border rounded-2xl overflow-hidden cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] ${cfg.border}`}
                                onClick={() => verDetalle(orden)}>
                                {/* Header */}
                                <div className="px-4 pt-4 pb-3 flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm"
                                            style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
                                            {orden.nro_mesa}
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Mesa {orden.nro_mesa}</p>
                                            <p className="text-gray-500 text-xs">Orden #{orden.orden_id}</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-lg font-semibold border ${cfg.badge}`}>
                                        {cfg.label}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="px-4 pb-3 flex items-center justify-between">
                                    <p className="text-gray-400 text-xs truncate flex-1">{orden.mesero}</p>
                                    <p className="text-lg font-black" style={{ color: '#c4b5fd' }}>${Number(orden.total).toFixed(2)}</p>
                                </div>

                                {/* Acción rápida */}
                                <div className="px-4 pb-4">
                                    {orden.estado === 'Pendiente' && (
                                        <button onClick={e => { e.stopPropagation(); cambiarEstado(orden.orden_id, 'EnCocina') }}
                                            className="w-full text-xs py-2 rounded-xl font-semibold transition"
                                            style={{ background: 'rgba(102,126,234,0.1)', border: '1px solid rgba(102,126,234,0.2)', color: '#a78bfa' }}>
                                            → Enviar a cocina
                                        </button>
                                    )}
                                    {orden.estado === 'EnCocina' && (
                                        <button onClick={e => { e.stopPropagation(); cambiarEstado(orden.orden_id, 'Lista') }}
                                            className="w-full text-xs py-2 rounded-xl font-semibold bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition">
                                            ✓ Marcar lista
                                        </button>
                                    )}
                                    {orden.estado === 'Lista' && (
                                        <button onClick={e => { e.stopPropagation(); cambiarEstado(orden.orden_id, 'PorCobrar') }}
                                            className="w-full text-xs py-2 rounded-xl font-semibold bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition">
                                            💰 Enviar a cobro
                                        </button>
                                    )}
                                    {orden.estado === 'PorCobrar' && (
                                        <div className="text-center text-xs text-amber-400/70 py-1">⏳ Esperando cajero</div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Panel detalle — slide desde la derecha */}
            {detalle && (
                <div className="fixed inset-0 bg-black/65 z-50 flex justify-end" onClick={() => setDetalle(null)}>
                    <div className="bg-[#0d0f14] w-full max-w-sm h-full flex flex-col border-l border-white/8"
                        onClick={e => e.stopPropagation()}>

                        {/* Panel header */}
                        <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center"
                            style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.07), rgba(118,75,162,0.04))' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center font-black text-white text-sm flex-shrink-0"
                                    style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
                                    {detalle.nro_mesa}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Mesa {detalle.nro_mesa}</p>
                                    <p className="text-gray-500 text-xs">{detalle.mesero} · #{detalle.orden_id}</p>
                                </div>
                            </div>
                            <button onClick={() => setDetalle(null)}
                                className="w-8 h-8 bg-white/5 hover:bg-white/10 border border-white/8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition text-sm">
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5 space-y-4">
                            {/* Estado */}
                            {(() => { const cfg = estadoCfg[detalle.estado]; return cfg ? (
                                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${cfg.badge}`}>
                                    <span className={`w-2 h-2 rounded-full ${cfg.dot}`}/>{cfg.label}
                                </div>
                            ) : null })()}

                            {msg && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-xl">{msg}</div>}

                            {/* Productos */}
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                    Productos · {detalle.productos?.length || 0}
                                </p>
                                <div className="space-y-2">
                                    {detalle.productos?.map(p => (
                                        <div key={p.detalle_id}
                                            className="flex items-center gap-3 bg-[#111318] border border-white/6 rounded-xl px-3 py-2.5 group">
                                            <div className="w-7 h-7 rounded-lg bg-[#1a1d24] flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">
                                                {p.cantidad}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-white text-sm font-semibold truncate">{p.producto}</p>
                                                {p.observacion && <p className="text-gray-500 text-xs truncate">📝 {p.observacion}</p>}
                                            </div>
                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                <p className="text-sm font-bold" style={{ color: '#c4b5fd' }}>${Number(p.subtotal).toFixed(2)}</p>
                                                {['Pendiente', 'EnCocina', 'Lista'].includes(detalle.estado) && (
                                                    <button onClick={() => eliminarProducto(p.detalle_id)}
                                                        className="w-7 h-7 opacity-0 group-hover:opacity-100 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center text-xs transition">
                                                        ✕
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Agregar producto (solo Pendiente/EnCocina) */}
                            {['Pendiente', 'EnCocina'].includes(detalle.estado) && (
                                !agregando ? (
                                    <button onClick={() => setAgregando(true)}
                                        className="w-full border border-dashed border-white/15 text-gray-500 hover:text-[#a78bfa] hover:border-[#667EEA]/30 text-xs py-2.5 rounded-xl transition">
                                        + Agregar producto
                                    </button>
                                ) : (
                                    <div className="bg-[#111318] border border-[#667EEA]/20 rounded-xl p-3 space-y-2">
                                        <select value={prodSel} onChange={e => setProdSel(e.target.value)}
                                            className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none"
                                            style={{ fontSize: '16px' }}>
                                            <option value="">Seleccionar producto...</option>
                                            {productos.map(p => (
                                                <option key={p.producto_id} value={p.producto_id}>{p.nombre} — ${Number(p.precio).toFixed(2)}</option>
                                            ))}
                                        </select>
                                        <div className="flex gap-2">
                                            <div className="flex items-center bg-[#1a1d24] border border-white/8 rounded-xl overflow-hidden flex-shrink-0">
                                                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-9 h-9 text-white hover:bg-white/10 font-bold text-lg flex items-center justify-center">−</button>
                                                <span className="w-8 text-center text-white font-bold text-sm">{cantidad}</span>
                                                <button onClick={() => setCantidad(cantidad + 1)} className="w-9 h-9 text-white hover:bg-white/10 font-bold text-lg flex items-center justify-center">+</button>
                                            </div>
                                            <input placeholder="Observación..." value={obs} onChange={e => setObs(e.target.value)}
                                                className="flex-1 bg-[#1a1d24] border border-white/8 rounded-xl px-3 text-white text-xs outline-none placeholder-gray-600"
                                                style={{ fontSize: '16px' }}/>
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => setAgregando(false)} className="flex-1 text-gray-400 border border-white/8 rounded-xl py-2 text-xs hover:text-white transition">Cancelar</button>
                                            <button onClick={agregarProducto}
                                                className="flex-1 text-white rounded-xl py-2 text-xs font-bold transition"
                                                style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
                                                Agregar
                                            </button>
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Total */}
                            <div className="rounded-xl px-4 py-3 flex justify-between items-center"
                                style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))', border: '1px solid rgba(102,126,234,0.2)' }}>
                                <p className="text-gray-300 font-semibold text-sm">Total</p>
                                <p className="text-2xl font-black" style={{ color: '#c4b5fd' }}>${Number(detalle.total).toFixed(2)}</p>
                            </div>

                            {!['Cerrada', 'Cancelada'].includes(detalle.estado) && (
                                <button onClick={() => eliminarOrden(detalle.orden_id)}
                                    className="w-full text-xs text-red-400/60 hover:text-red-400 border border-red-500/15 hover:border-red-500/30 hover:bg-red-500/6 py-2.5 rounded-xl transition">
                                    🗑 Cancelar y eliminar orden
                                </button>
                            )}
                        </div>

                        {/* Footer acciones */}
                        <div className="p-4 border-t border-white/8 space-y-2">
                            {detalle.estado === 'Pendiente' && (
                                <button onClick={() => cambiarEstado(detalle.orden_id, 'EnCocina')}
                                    className="w-full text-white text-sm py-3 rounded-xl font-bold transition"
                                    style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)', boxShadow: '0 4px 14px rgba(102,126,234,0.3)' }}>
                                    → Enviar a cocina
                                </button>
                            )}
                            {detalle.estado === 'EnCocina' && (
                                <button onClick={() => cambiarEstado(detalle.orden_id, 'Lista')}
                                    className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm py-3 rounded-xl font-bold transition">
                                    ✓ Marcar lista
                                </button>
                            )}
                            {detalle.estado === 'Lista' && (
                                <button onClick={() => cambiarEstado(detalle.orden_id, 'PorCobrar')}
                                    className="w-full bg-green-500 hover:bg-green-600 text-white text-sm py-3 rounded-xl font-bold transition">
                                    💰 Enviar a cobro
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ==================== HISTORIAL ==================== */
function PaginaHistorial() {
    const [historial,   setHistorial]   = useState([])
    const [fechaSel,    setFechaSel]    = useState(new Date().toISOString().split('T')[0])
    const [detalleOrden, setDetalleOrden] = useState(null)
    const [ordenSelec,  setOrdenSelec]  = useState(null)
    const [cargando,    setCargando]    = useState(false)

    useEffect(() => { cargar() }, [fechaSel])

    const cargar = async () => {
        setCargando(true)
        try {
            const h = await api.get(`/caja/historial?fecha=${fechaSel}`)
            setHistorial(h.data)
        } catch (err) { console.error(err) }
        finally { setCargando(false) }
    }

    const verDetalle = async (orden) => {
        const res = await api.get(`/ordenes/${orden.orden_id}`)
        setDetalleOrden(res.data)
        setOrdenSelec(orden)
    }

    const generarFactura = async (orden) => {
        const res = await api.get(`/ordenes/${orden.orden_id}`)
        generarFacturaPDF(orden, res.data.productos)
    }

    const totalDia     = historial.reduce((a, o) => a + Number(o.total), 0)
    const ticketProm   = historial.length > 0 ? totalDia / historial.length : 0
    const esHoy        = fechaSel === new Date().toISOString().split('T')[0]

    return (
        <div>
            {/* Header + selector de fecha */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-white font-bold text-lg">Historial de órdenes</h2>
                    <p className="text-gray-500 text-sm">{esHoy ? 'Hoy' : fechaSel} · {historial.length} orden{historial.length !== 1 ? 'es' : ''}</p>
                </div>
                <div className="flex items-center gap-2">
                    <input type="date" value={fechaSel}
                        onChange={e => setFechaSel(e.target.value)}
                        className="bg-[#111318] border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none transition"
                        style={{ colorScheme: 'dark' }}
                        onFocus={e => e.target.style.borderColor = '#667EEA'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                    {!esHoy && (
                        <button onClick={() => setFechaSel(new Date().toISOString().split('T')[0])}
                            className="text-xs text-gray-400 hover:text-white border border-white/8 px-3 py-2 rounded-xl transition">
                            Hoy
                        </button>
                    )}
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {[
                    { label: 'Total vendido',   value: `$${totalDia.toFixed(2)}`,          color: 'text-green-400',  icon: '💵', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.2)'   },
                    { label: 'Órdenes',          value: historial.length,                   color: 'text-white',      icon: '📋', bg: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.08)' },
                    { label: 'Ticket promedio',  value: `$${ticketProm.toFixed(2)}`,        color: 'text-[#c4b5fd]',  icon: '🎯', bg: 'rgba(102,126,234,0.08)', border: 'rgba(102,126,234,0.2)'  },
                ].map(s => (
                    <div key={s.label} className="rounded-2xl p-5 border"
                        style={{ background: s.bg, borderColor: s.border }}>
                        <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-500 text-xs font-medium uppercase tracking-wider">{s.label}</p>
                            <span className="text-xl">{s.icon}</span>
                        </div>
                        <p className={`text-3xl font-black ${s.color}`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabla */}
            <div className="bg-[#111318] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8 flex items-center justify-between">
                    <p className="text-white font-bold text-sm">Órdenes cerradas</p>
                    {cargando && <span className="text-xs text-gray-500 animate-pulse">Cargando...</span>}
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                {['#', 'Mesa', 'Mesero', 'Hora', 'Total', ''].map((h, i) => (
                                    <th key={i} className={`text-left text-xs text-gray-500 font-semibold px-4 py-3 uppercase tracking-wider ${i === 2 ? 'hidden md:table-cell' : ''}`}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {historial.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="text-center py-14">
                                        <div className="flex flex-col items-center gap-2">
                                            <span className="text-3xl">📭</span>
                                            <p className="text-gray-500 text-sm">Sin órdenes para esta fecha</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : historial.map(o => (
                                <tr key={o.orden_id} className="border-b border-white/4 hover:bg-white/[0.02] transition cursor-pointer"
                                    onClick={() => verDetalle(o)}>
                                    <td className="px-4 py-3">
                                        <span className="text-white text-sm font-bold">#{o.orden_id}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-black"
                                            style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
                                            {o.nro_mesa}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">{o.mesero}</td>
                                    <td className="px-4 py-3 text-gray-400 text-sm">
                                        {new Date(o.fecha_cierre).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-green-400 font-bold text-sm">${Number(o.total).toFixed(2)}</span>
                                    </td>
                                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                                        <button onClick={() => generarFactura(o)}
                                            className="text-xs px-3 py-1.5 rounded-lg border transition"
                                            style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                                            🖨 PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {historial.length > 0 && (
                    <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
                        <span className="text-gray-500 text-xs">{historial.length} órdenes</span>
                        <span className="text-green-400 font-bold text-sm">Total: ${totalDia.toFixed(2)}</span>
                    </div>
                )}
            </div>

            {/* Modal detalle */}
            {detalleOrden && (
                <div className="fixed inset-0 bg-black/65 z-50 flex items-center justify-center p-4"
                    onClick={() => setDetalleOrden(null)}>
                    <div className="bg-[#111318] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center"
                            style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.04))' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-white text-sm"
                                    style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
                                    {detalleOrden.nro_mesa}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Orden #{detalleOrden.orden_id}</p>
                                    <p className="text-gray-500 text-xs">Mesa {detalleOrden.nro_mesa} · {detalleOrden.mesero}</p>
                                </div>
                            </div>
                            <button onClick={() => setDetalleOrden(null)}
                                className="w-8 h-8 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white text-sm transition">✕</button>
                        </div>
                        <div className="p-5 space-y-2 max-h-80 overflow-y-auto">
                            {detalleOrden.productos?.map(p => (
                                <div key={p.detalle_id} className="flex items-center gap-3 bg-[#1a1d24] rounded-xl px-3 py-2.5">
                                    <span className="w-7 h-7 bg-[#22262f] rounded-lg flex items-center justify-center text-xs font-bold text-gray-400 flex-shrink-0">{p.cantidad}</span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-semibold truncate">{p.producto}</p>
                                        {p.observacion && <p className="text-gray-500 text-xs">📝 {p.observacion}</p>}
                                    </div>
                                    <p className="text-sm font-bold flex-shrink-0" style={{ color: '#c4b5fd' }}>${Number(p.subtotal).toFixed(2)}</p>
                                </div>
                            ))}
                        </div>
                        <div className="px-5 pb-5 space-y-3">
                            <div className="rounded-xl px-4 py-3 flex justify-between items-center"
                                style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))', border: '1px solid rgba(102,126,234,0.2)' }}>
                                <p className="text-gray-300 font-semibold text-sm">Total</p>
                                <p className="text-xl font-black" style={{ color: '#c4b5fd' }}>${Number(detalleOrden.total).toFixed(2)}</p>
                            </div>
                            <button onClick={() => generarFacturaPDF(ordenSelec, detalleOrden.productos)}
                                className="w-full py-3 text-white text-sm font-bold rounded-xl transition"
                                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.25)' }}>
                                🖨 Generar factura PDF
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
/* ==================== MENÚ ==================== */
const MENU_CAT_ICONS = { 'Pizzas':'🍕','Pizza':'🍕','Bebidas':'🥤','Bebida':'🥤','Entradas':'🥗','Postres':'🍰','Pastas':'🍝','Ensaladas':'🥙','Carnes':'🥩','Sopas':'🍜' }
const getMenuCatIcon = n => MENU_CAT_ICONS[n] || '🍽'

function PaginaMenu() {
    const [productos,        setProductos]        = useState([])
    const [categorias,       setCategorias]       = useState([])
    const [mostrarForm,      setMostrarForm]      = useState(false)
    const [editando,         setEditando]         = useState(null)
    const [form,             setForm]             = useState({ categoria_id: '', nombre: '', descripcion: '', precio: '', disponible: true })
    const [msg,              setMsg]              = useState({ texto: '', tipo: '' })
    const [filtroCategoria,  setFiltroCategoria]  = useState('Todos')
    const [busqueda,         setBusqueda]         = useState('')

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        const [p, c] = await Promise.all([api.get('/menu/productos'), api.get('/menu/categorias')])
        setProductos(p.data)
        setCategorias(c.data)
    }

    const mostrarMsg = (texto, tipo = 'ok') => {
        setMsg({ texto, tipo })
        setTimeout(() => setMsg({ texto: '', tipo: '' }), 3500)
    }

    const abrirForm = (producto = null) => {
        if (producto) {
            setEditando(producto)
            setForm({ categoria_id: producto.categoria_id, nombre: producto.nombre, descripcion: producto.descripcion || '', precio: producto.precio, disponible: producto.disponible })
        } else {
            setEditando(null)
            setForm({ categoria_id: '', nombre: '', descripcion: '', precio: '', disponible: true })
        }
        setMostrarForm(true)
    }

    const cerrarForm = () => { setMostrarForm(false); setEditando(null) }

    const guardar = async (e) => {
        e.preventDefault()
        try {
            if (editando) {
                await api.put(`/menu/productos/${editando.producto_id}`, form)
                mostrarMsg('Producto actualizado correctamente')
            } else {
                await api.post('/menu/productos', form)
                mostrarMsg('Producto creado correctamente')
            }
            cerrarForm()
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error guardando producto', 'err')
        }
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar este producto del menú?')) return
        try {
            await api.delete(`/menu/productos/${id}`)
            mostrarMsg('Producto eliminado')
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error eliminando producto', 'err')
        }
    }

    const productosFiltrados = productos.filter(p => {
        const matchCat   = filtroCategoria === 'Todos' || p.categoria === filtroCategoria
        const matchBusq  = p.nombre.toLowerCase().includes(busqueda.toLowerCase())
        return matchCat && matchBusq
    })

    const inputCls = "w-full bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder-gray-600"

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-white font-bold text-lg">Menú</h2>
                    <p className="text-gray-500 text-sm">{productos.length} producto{productos.length !== 1 ? 's' : ''} registrado{productos.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={() => abrirForm()}
                    className="self-start sm:self-auto flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl transition active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)', boxShadow: '0 4px 14px rgba(102,126,234,0.35)' }}>
                    + Nuevo producto
                </button>
            </div>

            {/* Toast */}
            {msg.texto && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm mb-5 ${msg.tipo === 'err' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                    <span>{msg.tipo === 'err' ? '⚠' : '✓'}</span>{msg.texto}
                </div>
            )}

            {/* Buscador + filtro categoría */}
            <div className="flex flex-col sm:flex-row gap-3 mb-5">
                <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
                    <input placeholder="Buscar producto..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="w-full bg-[#111318] border border-white/8 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none transition placeholder-gray-600"
                        style={{ fontSize: '16px' }}
                        onFocus={e => e.target.style.borderColor = '#667EEA'}
                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                    {['Todos', ...categorias.map(c => c.nombre)].map(cat => (
                        <button key={cat} onClick={() => setFiltroCategoria(cat)}
                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition"
                            style={filtroCategoria === cat ? {
                                background: 'linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))',
                                borderColor: 'rgba(102,126,234,0.4)', color: '#c4b5fd'
                            } : {
                                background: '#111318', borderColor: 'rgba(255,255,255,0.08)', color: '#6B7280'
                            }}>
                            {cat !== 'Todos' && <span>{getMenuCatIcon(cat)}</span>}
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid de productos */}
            {productosFiltrados.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <span className="text-4xl mb-3">🍽</span>
                    <p className="text-white font-semibold mb-1">Sin productos</p>
                    <p className="text-gray-500 text-sm">No hay productos que coincidan con tu búsqueda</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                    {productosFiltrados.map(p => (
                        <div key={p.producto_id}
                            className={`bg-[#111318] border rounded-2xl overflow-hidden transition-all ${p.disponible ? 'border-white/8' : 'border-red-500/15 opacity-60'}`}>
                            <div className="p-4 flex items-start gap-3">
                                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                                    style={{ background: p.disponible ? 'linear-gradient(135deg, rgba(102,126,234,0.15), rgba(118,75,162,0.15))' : 'rgba(255,255,255,0.05)', border: `1px solid ${p.disponible ? 'rgba(102,126,234,0.2)' : 'rgba(255,255,255,0.08)'}` }}>
                                    {getMenuCatIcon(p.categoria)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-1">
                                        <p className="text-white font-bold text-sm leading-tight">{p.nombre}</p>
                                        <p className="font-black text-sm flex-shrink-0" style={{ color: '#c4b5fd' }}>${Number(p.precio).toFixed(2)}</p>
                                    </div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs text-gray-500">{p.categoria}</span>
                                        <span className={`text-xs px-1.5 py-0.5 rounded-md font-semibold ${p.disponible ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                            {p.disponible ? '● Disponible' : '● No disponible'}
                                        </span>
                                    </div>
                                    {p.descripcion && <p className="text-gray-500 text-xs line-clamp-2 leading-relaxed">{p.descripcion}</p>}
                                </div>
                            </div>
                            <div className="px-4 pb-4 flex gap-2">
                                <button onClick={() => abrirForm(p)}
                                    className="flex-1 text-xs font-semibold py-2 rounded-xl border transition"
                                    style={{ background: 'rgba(102,126,234,0.08)', borderColor: 'rgba(102,126,234,0.2)', color: '#a78bfa' }}>
                                    ✏ Editar
                                </button>
                                <button onClick={() => eliminar(p.producto_id)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl border bg-red-500/8 border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/15 transition text-xs flex-shrink-0">
                                    🗑
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal crear/editar */}
            {mostrarForm && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={cerrarForm}>
                    <div className="bg-[#111318] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
                        onClick={e => e.stopPropagation()}>
                        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between"
                            style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.04))' }}>
                            <div>
                                <p className="text-white font-bold">{editando ? 'Editar producto' : 'Nuevo producto'}</p>
                                <p className="text-gray-500 text-xs">{editando ? `Modificando "${editando.nombre}"` : 'Completá los datos del producto'}</p>
                            </div>
                            <button onClick={cerrarForm}
                                className="w-8 h-8 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white text-sm transition">✕</button>
                        </div>
                        <form onSubmit={guardar} className="p-6 space-y-4">
                            <div>
                                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Nombre</label>
                                <input required placeholder="Ej: Pizza Margherita" value={form.nombre}
                                    onChange={e => setForm({...form, nombre: e.target.value})}
                                    className={inputCls} style={{ fontSize: '16px' }}
                                    onFocus={e => e.target.style.borderColor = '#667EEA'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Precio ($)</label>
                                    <input required type="number" step="0.01" placeholder="0.00" value={form.precio}
                                        onChange={e => setForm({...form, precio: e.target.value})}
                                        className={inputCls} style={{ fontSize: '16px' }}
                                        onFocus={e => e.target.style.borderColor = '#667EEA'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                                </div>
                                <div>
                                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Categoría</label>
                                    <select required value={form.categoria_id}
                                        onChange={e => setForm({...form, categoria_id: e.target.value})}
                                        className={inputCls} style={{ fontSize: '16px' }}
                                        onFocus={e => e.target.style.borderColor = '#667EEA'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}>
                                        <option value="">Seleccionar...</option>
                                        {categorias.map(c => <option key={c.categoria_id} value={c.categoria_id}>{c.nombre}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Descripción (opcional)</label>
                                <textarea placeholder="Ej: Incluye pizza grande + 2 bebidas + pan de ajo" value={form.descripcion}
                                    onChange={e => setForm({...form, descripcion: e.target.value})}
                                    className={`${inputCls} resize-none h-20`} style={{ fontSize: '16px' }}
                                    onFocus={e => e.target.style.borderColor = '#667EEA'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                            </div>
                            <div className="flex items-center justify-between bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-3">
                                <div>
                                    <p className="text-white text-sm font-semibold">Disponible en menú</p>
                                    <p className="text-gray-500 text-xs">Los meseros podrán agregar este producto</p>
                                </div>
                                <button type="button" onClick={() => setForm({...form, disponible: !form.disponible})}
                                    className={`w-12 h-6 rounded-full border transition-all relative flex-shrink-0 ${form.disponible ? 'bg-green-500/20 border-green-500/40' : 'bg-white/10 border-white/20'}`}>
                                    <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${form.disponible ? 'left-6 bg-green-400' : 'left-0.5 bg-gray-500'}`}/>
                                </button>
                            </div>
                            <div className="flex gap-3 pt-1">
                                <button type="button" onClick={cerrarForm}
                                    className="flex-1 py-3 text-gray-400 border border-white/8 rounded-xl text-sm font-medium hover:text-white hover:bg-white/5 transition">
                                    Cancelar
                                </button>
                                <button type="submit"
                                    className="flex-1 py-3 text-white rounded-xl text-sm font-bold transition active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)', boxShadow: '0 4px 14px rgba(102,126,234,0.3)' }}>
                                    {editando ? 'Guardar cambios' : 'Crear producto'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ==================== USUARIOS ==================== */
function PaginaUsuarios() {
    const [usuarios,    setUsuarios]    = useState([])
    const [roles,       setRoles]       = useState([])
    const [form,        setForm]        = useState({ rol_id: '', nombre_completo: '', nombre_usuario: '', password: '' })
    const [editando,    setEditando]    = useState(null)
    const [cambioPass,  setCambioPass]  = useState(null)
    const [nuevaPass,   setNuevaPass]   = useState('')
    const [mostrarForm, setMostrarForm] = useState(false)
    const [msg,         setMsg]         = useState({ texto: '', tipo: '' })

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        const [u, r] = await Promise.all([api.get('/usuarios'), api.get('/usuarios/roles')])
        setUsuarios(u.data)
        setRoles(r.data)
    }

    const mostrarMsg = (texto, tipo = 'ok') => {
        setMsg({ texto, tipo })
        setTimeout(() => setMsg({ texto: '', tipo: '' }), 3500)
    }

    const abrirNuevo = () => {
        setEditando(null)
        setForm({ rol_id: '', nombre_completo: '', nombre_usuario: '', password: '' })
        setMostrarForm(true)
    }

    const abrirEditar = (u) => {
        setEditando(u)
        setForm({ rol_id: u.rol_id || '', nombre_completo: u.nombre_completo, nombre_usuario: u.nombre_usuario, password: '' })
        setMostrarForm(true)
    }

    const cerrarForm = () => { setMostrarForm(false); setEditando(null) }

    const guardar = async (e) => {
        e.preventDefault()
        try {
            if (editando) {
                await api.put(`/usuarios/${editando.usuario_id}`, { nombre_completo: form.nombre_completo, nombre_usuario: form.nombre_usuario, rol_id: form.rol_id })
                mostrarMsg('Usuario actualizado correctamente')
            } else {
                await api.post('/usuarios', form)
                mostrarMsg('Usuario creado correctamente')
            }
            cerrarForm()
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error guardando usuario', 'err')
        }
    }

    const guardarPassword = async (id) => {
        if (!nuevaPass.trim()) return
        try {
            await api.patch(`/usuarios/${id}/password`, { password: nuevaPass })
            mostrarMsg('Contraseña actualizada')
            setCambioPass(null)
            setNuevaPass('')
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error cambiando contraseña', 'err')
        }
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar este usuario? Esta acción no se puede deshacer.')) return
        try {
            await api.delete(`/usuarios/${id}`)
            mostrarMsg('Usuario eliminado')
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error eliminando usuario', 'err')
        }
    }

    const toggleActivo = async (u) => {
        try {
            await api.patch(`/usuarios/${u.usuario_id}`)
            cargar()
        } catch (err) {
            mostrarMsg('Error cambiando estado', 'err')
        }
    }

    const rolConfig = {
        'Administrador': { bg: 'from-[#667EEA] to-[#764BA2]', badge: 'bg-purple-500/15 border-purple-500/30 text-purple-300', icon: '👑' },
        'Cajero':        { bg: 'from-green-600 to-green-800',  badge: 'bg-green-500/15 border-green-500/30 text-green-300',   icon: '💰' },
        'Mesero':        { bg: 'from-blue-500 to-blue-800',    badge: 'bg-blue-500/15 border-blue-500/30 text-blue-300',     icon: '🍽' },
        'Cocina':        { bg: 'from-orange-500 to-red-700',   badge: 'bg-orange-500/15 border-orange-500/30 text-orange-300', icon: '👨‍🍳' },
    }
    const getRol = (nombre) => rolConfig[nombre] || { bg: 'from-gray-600 to-gray-800', badge: 'bg-white/10 border-white/20 text-gray-300', icon: '👤' }

    const inputCls = "w-full bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-3 text-white text-sm outline-none transition placeholder-gray-600"

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <div>
                    <h2 className="text-white font-bold text-lg">Usuarios</h2>
                    <p className="text-gray-500 text-sm">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={abrirNuevo}
                    className="flex items-center gap-2 text-sm font-bold text-white px-5 py-2.5 rounded-xl transition active:scale-95 self-start sm:self-auto"
                    style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)', boxShadow: '0 4px 14px rgba(102,126,234,0.35)' }}>
                    + Nuevo usuario
                </button>
            </div>

            {/* Toast */}
            {msg.texto && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm mb-5 ${
                    msg.tipo === 'err'
                        ? 'bg-red-500/10 border-red-500/20 text-red-400'
                        : 'bg-green-500/10 border-green-500/20 text-green-400'
                }`}>
                    <span>{msg.tipo === 'err' ? '⚠' : '✓'}</span>
                    {msg.texto}
                </div>
            )}

            {/* Grid de usuarios */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {usuarios.map(u => {
                    const rc = getRol(u.rol)
                    return (
                        <div key={u.usuario_id}
                            className={`bg-[#111318] rounded-2xl overflow-hidden border transition-all ${
                                u.activo ? 'border-white/8' : 'border-red-500/20 opacity-70'
                            }`}>

                            {/* Card header con avatar */}
                            <div className="px-5 pt-5 pb-4 flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${rc.bg} flex items-center justify-center text-white font-black text-lg flex-shrink-0`}
                                    style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
                                    {u.nombre_completo.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-white font-bold text-sm truncate">{u.nombre_completo}</p>
                                    <p className="text-gray-500 text-xs truncate">@{u.nombre_usuario}</p>
                                </div>
                                {/* Toggle activo */}
                                <button onClick={() => toggleActivo(u)}
                                    title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                                    className={`w-10 h-6 rounded-full border transition-all flex-shrink-0 relative ${
                                        u.activo
                                            ? 'bg-green-500/20 border-green-500/40'
                                            : 'bg-red-500/20 border-red-500/40'
                                    }`}>
                                    <span className={`absolute top-0.5 w-5 h-5 rounded-full transition-all ${
                                        u.activo
                                            ? 'left-4 bg-green-400'
                                            : 'left-0.5 bg-red-400'
                                    }`}/>
                                </button>
                            </div>

                            {/* Rol badge */}
                            <div className="px-5 pb-4">
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border ${rc.badge}`}>
                                    <span>{rc.icon}</span>
                                    {u.rol}
                                </span>
                                {!u.activo && (
                                    <span className="ml-2 inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-lg border bg-red-500/10 border-red-500/25 text-red-400">
                                        Inactivo
                                    </span>
                                )}
                            </div>

                            {/* Campo cambio de contraseña inline */}
                            {cambioPass === u.usuario_id && (
                                <div className="px-5 pb-4">
                                    <div className="bg-[#1a1d24] border border-white/8 rounded-xl p-3 space-y-2">
                                        <p className="text-gray-400 text-xs font-semibold">Nueva contraseña</p>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                placeholder="Mínimo 6 caracteres..."
                                                value={nuevaPass}
                                                onChange={e => setNuevaPass(e.target.value)}
                                                className="flex-1 bg-[#22262f] border border-white/8 rounded-lg px-3 py-2 text-white text-xs outline-none"
                                                style={{ fontSize: '16px' }}
                                                onFocus={e => e.target.style.borderColor = '#667EEA'}
                                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                                onKeyDown={e => e.key === 'Enter' && guardarPassword(u.usuario_id)}
                                            />
                                            <button onClick={() => guardarPassword(u.usuario_id)}
                                                className="px-3 py-2 rounded-lg text-white text-xs font-bold flex-shrink-0"
                                                style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
                                                OK
                                            </button>
                                            <button onClick={() => { setCambioPass(null); setNuevaPass('') }}
                                                className="px-2 py-2 rounded-lg text-gray-400 border border-white/8 text-xs hover:text-white transition">
                                                ✕
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Acciones */}
                            <div className="px-5 pb-5 flex gap-2">
                                <button onClick={() => abrirEditar(u)}
                                    className="flex-1 text-xs font-semibold py-2 rounded-xl border transition"
                                    style={{ background: 'rgba(102,126,234,0.08)', borderColor: 'rgba(102,126,234,0.2)', color: '#a78bfa' }}>
                                    ✏ Editar
                                </button>
                                <button onClick={() => { setCambioPass(cambioPass === u.usuario_id ? null : u.usuario_id); setNuevaPass('') }}
                                    className={`flex-1 text-xs font-semibold py-2 rounded-xl border transition ${
                                        cambioPass === u.usuario_id
                                            ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300'
                                            : 'bg-yellow-500/8 border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/15'
                                    }`}>
                                    🔑 Clave
                                </button>
                                <button onClick={() => eliminar(u.usuario_id)}
                                    className="w-9 h-9 flex items-center justify-center rounded-xl border bg-red-500/8 border-red-500/20 text-red-400/60 hover:text-red-400 hover:bg-red-500/15 hover:border-red-500/35 transition text-xs flex-shrink-0">
                                    🗑
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Modal crear/editar */}
            {mostrarForm && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={cerrarForm}>
                    <div className="bg-[#111318] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden"
                        onClick={e => e.stopPropagation()}>

                        {/* Modal header */}
                        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between"
                            style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.04))' }}>
                            <div>
                                <p className="text-white font-bold">{editando ? 'Editar usuario' : 'Nuevo usuario'}</p>
                                <p className="text-gray-500 text-xs">{editando ? `Modificando @${editando.nombre_usuario}` : 'Completá los datos del nuevo usuario'}</p>
                            </div>
                            <button onClick={cerrarForm}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 text-gray-400 hover:text-white flex items-center justify-center text-sm transition">
                                ✕
                            </button>
                        </div>

                        <form onSubmit={guardar} className="p-6 space-y-4">
                            <div>
                                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Nombre completo</label>
                                <input required placeholder="Ej: Juan Pérez" value={form.nombre_completo}
                                    onChange={e => setForm({ ...form, nombre_completo: e.target.value })}
                                    className={inputCls}
                                    style={{ fontSize: '16px' }}
                                    onFocus={e => e.target.style.borderColor = '#667EEA'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Nombre de usuario</label>
                                <input required placeholder="Ej: juan.perez" value={form.nombre_usuario}
                                    onChange={e => setForm({ ...form, nombre_usuario: e.target.value })}
                                    autoCapitalize="none" autoCorrect="off"
                                    className={inputCls}
                                    style={{ fontSize: '16px' }}
                                    onFocus={e => e.target.style.borderColor = '#667EEA'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                            </div>
                            {!editando && (
                                <div>
                                    <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Contraseña</label>
                                    <input required type="password" placeholder="Mínimo 6 caracteres" value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        className={inputCls}
                                        style={{ fontSize: '16px' }}
                                        onFocus={e => e.target.style.borderColor = '#667EEA'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                                </div>
                            )}
                            <div>
                                <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">Rol</label>
                                <select required value={form.rol_id}
                                    onChange={e => setForm({ ...form, rol_id: e.target.value })}
                                    className={inputCls}
                                    style={{ fontSize: '16px' }}
                                    onFocus={e => e.target.style.borderColor = '#667EEA'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}>
                                    <option value="">Seleccionar rol...</option>
                                    {roles.map(r => <option key={r.rol_id} value={r.rol_id}>{r.nombre}</option>)}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button type="button" onClick={cerrarForm}
                                    className="flex-1 py-3 text-gray-400 border border-white/8 rounded-xl text-sm font-medium hover:text-white hover:bg-white/5 transition">
                                    Cancelar
                                </button>
                                <button type="submit"
                                    className="flex-1 py-3 text-white rounded-xl text-sm font-bold transition active:scale-[0.98]"
                                    style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)', boxShadow: '0 4px 14px rgba(102,126,234,0.3)' }}>
                                    {editando ? 'Guardar cambios' : 'Crear usuario'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

/* ==================== CAJA ==================== */
function PaginaCaja() {
    const [estado,         setEstado]         = useState(null)
    const [historial,      setHistorial]      = useState([])
    const [porCobrar,      setPorCobrar]      = useState([])
    const [montoApertura,  setMontoApertura]  = useState('')
    const [montoCierre,    setMontoCierre]    = useState('')
    const [observaciones,  setObservaciones]  = useState('')
    const [msg,            setMsg]            = useState({ texto: '', tipo: '' })
    const [pinReabrir,     setPinReabrir]     = useState('')
    const [mostrarReabrir, setMostrarReabrir] = useState(false)
    const [cargando,       setCargando]       = useState(false)
    const [pagoModal,      setPagoModal]      = useState(null)
    const [metodoPago,     setMetodoPago]     = useState('')
    const [montoRecibido,  setMontoRecibido]  = useState('')

    useEffect(() => {
        cargar()
        const iv = setInterval(cargar, 15000)
        return () => clearInterval(iv)
    }, [])

    const cargar = async () => {
        const [c, h] = await Promise.all([api.get('/caja'), api.get('/caja/historial')])
        setEstado(c.data)
        setHistorial(h.data)
        setPorCobrar(c.data.porCobrar || [])
    }

    const mostrarMsg = (texto, tipo = 'ok') => {
        setMsg({ texto, tipo })
        setTimeout(() => setMsg({ texto: '', tipo: '' }), 4000)
    }

    const abrirCaja = async () => {
        if (!montoApertura) return
        setCargando(true)
        try {
            await api.post('/caja/abrir', { monto_apertura: parseFloat(montoApertura) })
            setMontoApertura('')
            mostrarMsg('Caja abierta correctamente')
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error abriendo caja', 'err')
        } finally { setCargando(false) }
    }

    const cerrarCaja = async () => {
        if (!montoCierre || !confirm('¿Confirmar cierre de caja?')) return
        setCargando(true)
        try {
            await api.post('/caja/cerrar', { monto_fisico_contado: parseFloat(montoCierre), observaciones })
            setMontoCierre('')
            setObservaciones('')
            mostrarMsg('Caja cerrada correctamente')
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error cerrando caja', 'err')
        } finally { setCargando(false) }
    }

    const reabrirCaja = async () => {
        setCargando(true)
        try {
            await api.post('/caja/reabrir', { pin: pinReabrir })
            setPinReabrir('')
            setMostrarReabrir(false)
            mostrarMsg('Caja reabierta correctamente')
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'PIN incorrecto', 'err')
        } finally { setCargando(false) }
    }

    const abrirPagoModal = (orden) => {
        setPagoModal(orden)
        setMetodoPago('')
        setMontoRecibido('')
    }

    const cerrarPagoModal = () => {
        setPagoModal(null)
        setMetodoPago('')
        setMontoRecibido('')
    }

    const confirmarCobro = async () => {
        if (!metodoPago) return
        setCargando(true)
        try {
            await api.patch(`/ordenes/${pagoModal.orden_id}/estado`, { estado: 'Cerrada' })
            const pago = {
                metodo: metodoPago,
                montoRecibido: metodoPago === 'efectivo' ? parseFloat(montoRecibido) : null,
                vuelto: metodoPago === 'efectivo' ? parseFloat(montoRecibido) - Number(pagoModal.total) : null,
            }
            const res = await api.get(`/ordenes/${pagoModal.orden_id}`)
            generarFacturaPDF(pagoModal, res.data.productos, pago)
            mostrarMsg(`Cobro registrado · Mesa ${pagoModal.nro_mesa} · $${Number(pagoModal.total).toFixed(2)}`)
            cerrarPagoModal()
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error registrando cobro', 'err')
        } finally { setCargando(false) }
    }

    const generarFactura = async (orden) => {
        const res = await api.get(`/ordenes/${orden.orden_id}`)
        generarFacturaPDF(orden, res.data.productos)
    }

    const totalVentas  = Number(estado?.ventas?.total_ventas || 0)
    const cajaAbierta  = estado?.caja?.estado === 'Abierta'
    const cajaCerrada  = estado?.caja?.estado === 'Cerrada'
    const diferencia   = montoCierre ? parseFloat(montoCierre) - totalVentas : null
    const inputCls     = "w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none transition placeholder-gray-600"

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-white font-bold text-lg">Caja</h2>
                    <p className="text-gray-500 text-sm flex items-center gap-2">
                        <span className={`w-1.5 h-1.5 rounded-full inline-block ${cajaAbierta ? 'bg-green-400' : cajaCerrada ? 'bg-red-400' : 'bg-gray-500'}`}/>
                        {cajaAbierta ? 'Caja abierta' : cajaCerrada ? 'Caja cerrada hoy' : 'Sin caja hoy'}
                    </p>
                </div>
                {porCobrar.length > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded-lg">
                        <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"/>
                        {porCobrar.length} por cobrar
                    </div>
                )}
            </div>

            {/* Toast */}
            {msg.texto && (
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-sm ${msg.tipo === 'err' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                    <span>{msg.tipo === 'err' ? '⚠' : '✓'}</span>{msg.texto}
                </div>
            )}

            {/* ── CUENTAS POR COBRAR ── */}
            {porCobrar.length > 0 && (
                <section>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Cuentas por cobrar</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {porCobrar.map(o => (
                            <div key={o.orden_id}
                                className="bg-[#111318] border-2 border-amber-500/30 rounded-2xl overflow-hidden flex flex-col">
                                <div className="px-4 py-3 border-b border-white/8 flex justify-between items-center"
                                    style={{ background: 'rgba(245,158,11,0.05)' }}>
                                    <div>
                                        <p className="text-white font-bold text-lg">Mesa {o.nro_mesa}</p>
                                        <p className="text-gray-500 text-xs truncate">{o.mesero} · #{o.orden_id}</p>
                                    </div>
                                    <span className="text-amber-400 text-xs font-bold bg-amber-500/15 border border-amber-500/25 px-2 py-1 rounded-lg">Por cobrar</span>
                                </div>
                                <div className="p-4 flex flex-col gap-3 flex-1">
                                    <p className="text-amber-400 text-3xl font-black">${Number(o.total).toFixed(2)}</p>
                                    <button onClick={() => abrirPagoModal(o)} disabled={cargando}
                                        className="w-full py-3 text-white text-sm font-bold rounded-xl transition disabled:opacity-50 active:scale-95"
                                        style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.25)' }}>
                                        💰 Cobrar y facturar
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── CONTROLES DE CAJA ── */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

                {/* Ventas del día */}
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Ventas del día</p>
                    <p className="text-green-400 text-3xl font-black mb-1">${totalVentas.toFixed(2)}</p>
                    <p className="text-gray-500 text-xs">{estado?.ventas?.total_ordenes || 0} órdenes cerradas</p>
                    {(estado?.ventas?.total_ordenes || 0) > 0 && (
                        <p className="text-[#a78bfa] text-xs mt-1">
                            Ticket prom: ${(totalVentas / estado.ventas.total_ordenes).toFixed(2)}
                        </p>
                    )}
                </div>

                {/* Apertura / estado */}
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Caja</p>
                    {!estado?.caja && (
                        <div>
                            <p className="text-gray-400 text-sm mb-3">Sin caja abierta hoy</p>
                            <div className="flex gap-2">
                                <input type="number" placeholder="Monto inicial..." value={montoApertura}
                                    onChange={e => setMontoApertura(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && abrirCaja()}
                                    className={inputCls} style={{ fontSize: '16px' }}
                                    onFocus={e => e.target.style.borderColor = '#22c55e'}
                                    onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                                <button onClick={abrirCaja} disabled={cargando || !montoApertura}
                                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-bold px-4 rounded-xl transition flex-shrink-0">
                                    Abrir
                                </button>
                            </div>
                        </div>
                    )}
                    {cajaAbierta && (
                        <div>
                            <p className="text-[#c4b5fd] text-2xl font-black mb-0.5">${Number(estado.caja.monto_apertura).toFixed(2)}</p>
                            <p className="text-gray-500 text-xs">
                                Apertura · {new Date(estado.caja.hora_apertura).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-green-400">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"/>Abierta
                            </div>
                        </div>
                    )}
                    {cajaCerrada && (
                        <div>
                            <p className="text-gray-400 text-sm mb-3">Caja cerrada hoy</p>
                            {!mostrarReabrir ? (
                                <button onClick={() => setMostrarReabrir(true)}
                                    className="w-full border border-dashed border-white/15 text-gray-500 hover:text-amber-400 hover:border-amber-500/30 text-xs py-2 rounded-xl transition">
                                    Reabrir caja
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <input type="password" placeholder="PIN de autorización..."
                                        value={pinReabrir} onChange={e => setPinReabrir(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && reabrirCaja()}
                                        className={inputCls} style={{ fontSize: '16px' }}
                                        onFocus={e => e.target.style.borderColor = '#f59e0b'}
                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setMostrarReabrir(false); setPinReabrir('') }}
                                            className="flex-1 text-gray-400 border border-white/8 rounded-xl text-xs py-2 hover:text-white transition">
                                            Cancelar
                                        </button>
                                        <button onClick={reabrirCaja} disabled={cargando}
                                            className="flex-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs py-2 rounded-xl font-semibold hover:bg-amber-500/20 transition">
                                            Confirmar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Cierre */}
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3 font-semibold">Cierre de caja</p>
                    {cajaAbierta ? (
                        <div className="space-y-2">
                            <input type="number" placeholder="Efectivo contado..." value={montoCierre}
                                onChange={e => setMontoCierre(e.target.value)}
                                className={inputCls} style={{ fontSize: '16px' }}
                                onFocus={e => e.target.style.borderColor = '#667EEA'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                            {diferencia !== null && (
                                <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-xl ${diferencia >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                    <span>{diferencia >= 0 ? '✓' : '⚠'}</span>
                                    {diferencia >= 0 ? `Sobrante: +$${diferencia.toFixed(2)}` : `Faltante: -$${Math.abs(diferencia).toFixed(2)}`}
                                </div>
                            )}
                            <input placeholder="Observaciones (opcional)" value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                className={inputCls} style={{ fontSize: '16px' }}
                                onFocus={e => e.target.style.borderColor = '#667EEA'}
                                onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}/>
                            <button onClick={cerrarCaja} disabled={cargando || !montoCierre}
                                className="w-full py-2.5 text-white text-sm font-bold rounded-xl transition disabled:opacity-50"
                                style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
                                Cerrar caja del día
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-sm">{cajaCerrada ? 'Caja ya cerrada hoy' : 'Abrí la caja primero'}</p>
                    )}
                </div>
            </section>

            {/* ── HISTORIAL DEL DÍA ── */}
            <section>
                <div className="bg-[#111318] border border-white/8 rounded-2xl overflow-hidden">
                    <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center">
                        <p className="text-white font-bold text-sm">Órdenes cerradas hoy</p>
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 text-xs">{historial.length} órdenes</span>
                            {historial.length > 0 && (
                                <span className="text-green-400 text-xs font-bold">${historial.reduce((a, o) => a + Number(o.total), 0).toFixed(2)}</span>
                            )}
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5">
                                    {['#', 'Mesa', 'Mesero', 'Hora', 'Total', ''].map((h, i) => (
                                        <th key={i} className={`text-left text-xs text-gray-500 font-semibold px-4 py-3 uppercase tracking-wider ${i === 2 ? 'hidden md:table-cell' : ''}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {historial.length === 0 ? (
                                    <tr><td colSpan="6" className="text-center text-gray-500 text-sm py-10">No hay órdenes cerradas hoy</td></tr>
                                ) : historial.map(o => (
                                    <tr key={o.orden_id} className="border-b border-white/4 hover:bg-white/[0.02] transition">
                                        <td className="px-4 py-3 text-white text-sm font-bold">#{o.orden_id}</td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg text-white text-xs font-black"
                                                style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
                                                {o.nro_mesa}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 text-sm hidden md:table-cell">{o.mesero}</td>
                                        <td className="px-4 py-3 text-gray-400 text-sm">
                                            {new Date(o.fecha_cierre).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                                        </td>
                                        <td className="px-4 py-3 text-green-400 text-sm font-bold">${Number(o.total).toFixed(2)}</td>
                                        <td className="px-4 py-3">
                                            <button onClick={() => generarFactura(o)}
                                                className="text-xs px-3 py-1.5 rounded-lg border transition"
                                                style={{ background: 'rgba(34,197,94,0.08)', borderColor: 'rgba(34,197,94,0.2)', color: '#4ade80' }}>
                                                🖨 PDF
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            {/* ── MODAL DE PAGO ── */}
            {pagoModal && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={cerrarPagoModal}>
                    <div className="bg-[#111318] border border-white/10 rounded-2xl w-full max-w-sm overflow-hidden"
                        onClick={e => e.stopPropagation()}>

                        {/* Header */}
                        <div className="px-5 py-4 border-b border-white/8"
                            style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(22,163,74,0.04))' }}>
                            <div className="flex items-center justify-between mb-3">
                                <div>
                                    <p className="text-white font-bold">Registrar cobro</p>
                                    <p className="text-gray-500 text-xs">Mesa {pagoModal.nro_mesa} · Orden #{pagoModal.orden_id}</p>
                                </div>
                                <button onClick={cerrarPagoModal}
                                    className="w-8 h-8 bg-white/5 border border-white/8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white text-sm transition">
                                    ✕
                                </button>
                            </div>
                            <div className="text-center py-2">
                                <p className="text-gray-400 text-xs mb-1">Total a cobrar</p>
                                <p className="text-4xl font-black text-white">${Number(pagoModal.total).toFixed(2)}</p>
                            </div>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Selección de método */}
                            <div>
                                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">Forma de pago</p>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => { setMetodoPago('efectivo'); setMontoRecibido('') }}
                                        className={`py-4 rounded-xl border-2 font-bold text-sm transition flex flex-col items-center gap-2 ${
                                            metodoPago === 'efectivo'
                                                ? 'border-green-500/60 bg-green-500/15 text-green-400'
                                                : 'border-white/10 bg-white/4 text-gray-400 hover:border-white/20 hover:text-white'
                                        }`}>
                                        <span className="text-2xl">💵</span>
                                        Efectivo
                                    </button>
                                    <button onClick={() => { setMetodoPago('tarjeta'); setMontoRecibido('') }}
                                        className={`py-4 rounded-xl border-2 font-bold text-sm transition flex flex-col items-center gap-2 ${
                                            metodoPago === 'tarjeta'
                                                ? 'border-blue-500/60 bg-blue-500/15 text-blue-400'
                                                : 'border-white/10 bg-white/4 text-gray-400 hover:border-white/20 hover:text-white'
                                        }`}>
                                        <span className="text-2xl">💳</span>
                                        Tarjeta
                                    </button>
                                </div>
                            </div>

                            {/* Efectivo: monto recibido + vuelto */}
                            {metodoPago === 'efectivo' && (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-1.5 block">
                                            Monto recibido del cliente
                                        </label>
                                        <input
                                            type="number" step="0.01"
                                            placeholder={`Mínimo $${Number(pagoModal.total).toFixed(2)}`}
                                            value={montoRecibido}
                                            onChange={e => setMontoRecibido(e.target.value)}
                                            autoFocus
                                            className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-3 text-white text-lg font-bold outline-none transition"
                                            style={{ fontSize: '16px' }}
                                            onFocus={e => e.target.style.borderColor = '#22c55e'}
                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                        />
                                    </div>
                                    {montoRecibido && parseFloat(montoRecibido) >= Number(pagoModal.total) && (
                                        <div className="rounded-xl px-4 py-3 flex justify-between items-center bg-green-500/10 border border-green-500/20">
                                            <p className="text-green-300 font-semibold text-sm">Vuelto</p>
                                            <p className="text-green-400 text-2xl font-black">
                                                ${(parseFloat(montoRecibido) - Number(pagoModal.total)).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                    {montoRecibido && parseFloat(montoRecibido) < Number(pagoModal.total) && (
                                        <div className="rounded-xl px-4 py-3 flex justify-between items-center bg-red-500/10 border border-red-500/20">
                                            <p className="text-red-300 font-semibold text-sm">Monto insuficiente</p>
                                            <p className="text-red-400 font-bold text-sm">
                                                Faltan ${(Number(pagoModal.total) - parseFloat(montoRecibido)).toFixed(2)}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {metodoPago === 'tarjeta' && (
                                <div className="rounded-xl px-4 py-3 bg-blue-500/8 border border-blue-500/20">
                                    <p className="text-blue-300 text-sm font-semibold">💳 Cobro por tarjeta</p>
                                    <p className="text-blue-400/70 text-xs mt-0.5">Se generará la factura directamente</p>
                                </div>
                            )}

                            {/* Botones */}
                            <div className="flex gap-3 pt-1">
                                <button onClick={cerrarPagoModal}
                                    className="flex-1 py-3 text-gray-400 border border-white/8 rounded-xl text-sm font-medium hover:text-white hover:bg-white/5 transition">
                                    Cancelar
                                </button>
                                <button onClick={confirmarCobro}
                                    disabled={
                                        !metodoPago || cargando ||
                                        (metodoPago === 'efectivo' && (!montoRecibido || parseFloat(montoRecibido) < Number(pagoModal.total)))
                                    }
                                    className="flex-1 py-3 text-white rounded-xl text-sm font-bold transition active:scale-[0.98] disabled:opacity-40"
                                    style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.25)' }}>
                                    {cargando ? 'Procesando...' : '✓ Confirmar cobro'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}