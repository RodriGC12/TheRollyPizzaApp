import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { generarFacturaPDF } from '../utils/factura'



export default function Dashboard() {
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
    const [paginaActiva, setPaginaActiva] = useState('dashboard')
    const [ordenesActivas, setOrdenesActivas] = useState([])
    const [ventasDia, setVentasDia] = useState({ total_ventas: 0, total_ordenes: 0 })
    const [cargando, setCargando] = useState(false)
    const navigate = useNavigate()

    useEffect(() => { cargarDatos() }, [])

    const cargarDatos = async () => {
        setCargando(true)
        try {
            const [ordenes, caja] = await Promise.all([
                api.get('/ordenes'),
                api.get('/caja')
            ])
            setOrdenesActivas(ordenes.data)
            setVentasDia(caja.data.ventas)
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
                <div className="bg-[#111318] border-b border-white/8 px-4 md:px-7 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-white text-base md:text-lg font-semibold">
                            {navItems.find(n => n.id === paginaActiva)?.label}
                        </h1>
                        <p className="text-gray-500 text-xs mt-0.5">Paris Rolly Pizza · Admin</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/mesas')}
                       className="text-xs text-blue-400 border border-blue-500/20 bg-blue-500/10 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition">
                        🗺 Mapa de mesas
                        </button>
                        {paginaActiva === 'dashboard' && (
                            <button onClick={cargarDatos} className="text-xs text-gray-400 hover:text-blue-400 border border-white/8 px-3 py-1.5 rounded-lg transition">
                                {cargando ? '⟳ Actualizando...' : '⟳ Actualizar'}
                            </button>
                        )}
                        <div className="text-xs text-gray-500 bg-[#1a1d24] border border-white/8 px-3 py-1.5 rounded-lg">
                            {new Date().toLocaleDateString('es-SV', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </div>
                    </div>
                </div>

                <div className="flex-1 p-4 md:p-7 overflow-y-auto">
                    {paginaActiva === 'dashboard' && (
                        <div>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                                <div className="bg-[#111318] border border-white/8 rounded-2xl p-4 md:p-5">
                                    <div className="w-9 h-9 bg-blue-500/15 rounded-xl flex items-center justify-center text-blue-400 text-sm mb-3">$</div>
                                    <p className="text-white text-2xl font-bold">${Number(ventasDia.total_ventas || 0).toFixed(2)}</p>
                                    <p className="text-gray-500 text-xs mt-1">Ventas del día</p>
                                </div>
                                <div className="bg-[#111318] border border-white/8 rounded-2xl p-4 md:p-5">
                                    <div className="w-9 h-9 bg-green-500/15 rounded-xl flex items-center justify-center text-green-400 text-sm mb-3">✓</div>
                                    <p className="text-white text-2xl font-bold">{ventasDia.total_ordenes || 0}</p>
                                    <p className="text-gray-500 text-xs mt-1">Pedidos cerrados</p>
                                </div>
                                <div className="bg-[#111318] border border-white/8 rounded-2xl p-4 md:p-5 col-span-2 md:col-span-1">
                                    <div className="w-9 h-9 bg-yellow-500/15 rounded-xl flex items-center justify-center text-yellow-400 text-sm mb-3">⏳</div>
                                    <p className="text-white text-2xl font-bold">{ordenesActivas.length}</p>
                                    <p className="text-gray-500 text-xs mt-1">Órdenes activas</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                                    <p className="text-white text-sm font-semibold mb-4">Órdenes por estado</p>
                                    {(() => {
                                        const estados = ['Pendiente', 'EnCocina', 'Lista']
                                        const colores = {
                                            Pendiente: { bar: 'bg-yellow-400', text: 'text-yellow-400' },
                                            EnCocina:  { bar: 'bg-blue-400',   text: 'text-blue-400'   },
                                            Lista:     { bar: 'bg-green-400',  text: 'text-green-400'  },
                                        }
                                        const max = Math.max(...estados.map(e => ordenesActivas.filter(o => o.estado === e).length), 1)
                                        return (
                                            <div className="space-y-3">
                                                {estados.map(estado => {
                                                    const count = ordenesActivas.filter(o => o.estado === estado).length
                                                    const pct = Math.round((count / max) * 100)
                                                    return (
                                                        <div key={estado}>
                                                            <div className="flex justify-between items-center mb-1">
                                                                <span className="text-gray-400 text-xs">{estado}</span>
                                                                <span className={`text-xs font-bold ${colores[estado].text}`}>{count}</span>
                                                            </div>
                                                            <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                                                <div className={`h-full rounded-full transition-all duration-700 ${colores[estado].bar}`} style={{ width: `${pct}%` }}/>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                                {ordenesActivas.length === 0 && <p className="text-gray-600 text-xs text-center py-4">Sin órdenes activas</p>}
                                            </div>
                                        )
                                    })()}
                                </div>
                                <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                                    <p className="text-white text-sm font-semibold mb-4">Resumen del día</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-gray-400 text-sm">Total vendido</span>
                                            <span className="text-green-400 font-bold">${Number(ventasDia.total_ventas || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-gray-400 text-sm">Órdenes cerradas</span>
                                            <span className="text-white font-bold">{ventasDia.total_ordenes || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-white/5">
                                            <span className="text-gray-400 text-sm">Ticket promedio</span>
                                            <span className="text-blue-400 font-bold">
                                                ${ventasDia.total_ordenes > 0
                                                    ? (Number(ventasDia.total_ventas) / Number(ventasDia.total_ordenes)).toFixed(2)
                                                    : '0.00'}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center py-2">
                                            <span className="text-gray-400 text-sm">Órdenes activas</span>
                                            <span className="text-yellow-400 font-bold">{ordenesActivas.length}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-[#111318] border border-white/8 rounded-2xl overflow-hidden">
                                <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center">
                                    <span className="text-white text-sm font-semibold">Órdenes activas</span>
                                    <button onClick={() => cambiarPagina('ordenes')} className="text-blue-400 text-xs">Ver todas →</button>
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
                                            ) : ordenesActivas.map(orden => (
                                                <tr key={orden.orden_id} className="border-b border-white/4 hover:bg-white/2">
                                                    <td className="px-5 py-3 text-white text-sm font-semibold">#{orden.orden_id}</td>
                                                    <td className="px-5 py-3 text-gray-300 text-sm">Mesa {orden.nro_mesa}</td>
                                                    <td className="px-5 py-3 text-gray-400 text-sm hidden md:table-cell">{orden.mesero}</td>
                                                    <td className="px-5 py-3 text-blue-400 text-sm font-bold">${Number(orden.total).toFixed(2)}</td>
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

/* ==================== PEDIDOS ==================== */
function PaginaOrdenes({ getBadge }) {
    const [ordenes, setOrdenes] = useState([])
    const [detalle, setDetalle] = useState(null)
    const [filtro, setFiltro] = useState('Todos')
    const [productos, setProductos] = useState([])
    const [agregando, setAgregando] = useState(false)
    const [prodSel, setProdSel] = useState('')
    const [cantidad, setCantidad] = useState(1)
    const [obs, setObs] = useState('')
    const [msg, setMsg] = useState('')

    useEffect(() => {
        cargar()
        api.get('/menu/productos').then(r => setProductos(r.data))
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
            await api.post(`/ordenes/${detalle.orden_id}/producto`, {
                producto_id: prodSel, cantidad, observacion: obs
            })
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

    const filtros = ['Todos', 'Pendiente', 'EnCocina', 'Lista']
    const ordenesFiltradas = filtro === 'Todos' ? ordenes : ordenes.filter(o => o.estado === filtro)

    return (
        <div>
            <div className="flex gap-2 mb-5 flex-wrap">
                {filtros.map(f => (
                    <button key={f} onClick={() => setFiltro(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                            ${filtro === f ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-[#111318] border-white/8 text-gray-400 hover:text-white'}`}>
                        {f}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {ordenesFiltradas.length === 0 ? (
                    <p className="text-gray-500 text-sm col-span-3 text-center py-10">No hay órdenes</p>
                ) : ordenesFiltradas.map(orden => (
                    <div key={orden.orden_id}
                        className="bg-[#111318] border border-white/8 rounded-2xl overflow-hidden hover:border-blue-500/30 transition cursor-pointer"
                        onClick={() => verDetalle(orden)}>
                        <div className="px-4 py-3 border-b border-white/8 flex justify-between items-center">
                            <div>
                                <p className="text-white font-bold text-sm">#{orden.orden_id}</p>
                                <p className="text-gray-500 text-xs">Mesa {orden.nro_mesa}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getBadge(orden.estado)}`}>{orden.estado}</span>
                        </div>
                        <div className="px-4 py-3 flex justify-between items-center">
                            <p className="text-gray-400 text-xs">{orden.mesero}</p>
                            <p className="text-blue-400 font-bold">${Number(orden.total).toFixed(2)}</p>
                        </div>
                        <div className="px-4 pb-3 flex gap-2">
                            {orden.estado === 'Pendiente' && (
                                <button onClick={e => { e.stopPropagation(); cambiarEstado(orden.orden_id, 'EnCocina') }}
                                    className="flex-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs py-2 rounded-lg font-semibold hover:bg-blue-500/20 transition">
                                    Enviar a cocina
                                </button>
                            )}
                            {orden.estado === 'EnCocina' && (
                                <button onClick={e => { e.stopPropagation(); cambiarEstado(orden.orden_id, 'Lista') }}
                                    className="flex-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs py-2 rounded-lg font-semibold hover:bg-blue-500/20 transition">
                                    Marcar lista
                                </button>
                            )}
                            {orden.estado === 'Lista' && (
                                <button onClick={e => { e.stopPropagation(); cambiarEstado(orden.orden_id, 'Cerrada') }}
                                    className="flex-1 bg-green-500/10 border border-green-500/20 text-green-400 text-xs py-2 rounded-lg font-semibold hover:bg-green-500/20 transition">
                                    Cerrar orden
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {detalle && (
                <div className="fixed inset-0 bg-black/60 z-50 flex justify-end" onClick={() => setDetalle(null)}>
                    <div className="bg-[#111318] w-full max-w-sm h-full flex flex-col border-l border-white/8" onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center">
                            <div>
                                <p className="text-white font-bold">#{detalle.orden_id}</p>
                                <p className="text-gray-500 text-xs">Mesa {detalle.nro_mesa} · {detalle.mesero}</p>
                            </div>
                            <div className="flex gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full font-semibold ${getBadge(detalle.estado)}`}>{detalle.estado}</span>
                                <button onClick={() => setDetalle(null)} className="text-gray-400 hover:text-white bg-[#1a1d24] w-8 h-8 rounded-lg flex items-center justify-center">✕</button>
                            </div>
                        </div>
                        <div className="flex-1 p-5 overflow-y-auto">
                            {msg && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-3 py-2 rounded-lg mb-3">{msg}</div>}
                            <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Productos</p>
                            <div className="space-y-2 mb-4">
                                {detalle.productos?.map(p => (
                                    <div key={p.detalle_id} className="bg-[#1a1d24] rounded-xl p-3 flex justify-between items-center">
                                        <div>
                                            <p className="text-white text-sm font-medium">{p.producto}</p>
                                            <p className="text-gray-500 text-xs">Cant: {p.cantidad}{p.observacion && ` · ${p.observacion}`}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <p className="text-blue-400 font-bold text-sm">${Number(p.subtotal).toFixed(2)}</p>
                                            {detalle.estado === 'Pendiente' && (
                                                <button onClick={() => eliminarProducto(p.detalle_id)}
                                                    className="text-red-400 hover:text-red-300 text-xs bg-red-500/10 w-6 h-6 rounded-lg flex items-center justify-center">✕</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {detalle.estado === 'Pendiente' && (
                                <div className="mb-4">
                                    {!agregando ? (
                                        <button onClick={() => setAgregando(true)}
                                            className="w-full border border-dashed border-white/15 text-gray-500 hover:text-blue-400 hover:border-blue-500/30 text-xs py-2.5 rounded-xl transition">
                                            + Agregar producto
                                        </button>
                                    ) : (
                                        <div className="bg-[#1a1d24] rounded-xl p-3 space-y-2">
                                            <select value={prodSel} onChange={e => setProdSel(e.target.value)}
                                                className="w-full bg-[#22262f] border border-white/8 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-blue-500">
                                                <option value="">Seleccionar producto</option>
                                                {productos.map(p => (
                                                    <option key={p.producto_id} value={p.producto_id}>{p.nombre} — ${Number(p.precio).toFixed(2)}</option>
                                                ))}
                                            </select>
                                            <div className="flex gap-2">
                                                <input type="number" min="1" value={cantidad} onChange={e => setCantidad(e.target.value)}
                                                    className="w-20 bg-[#22262f] border border-white/8 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-blue-500"/>
                                                <input placeholder="Observación..." value={obs} onChange={e => setObs(e.target.value)}
                                                    className="flex-1 bg-[#22262f] border border-white/8 rounded-lg px-3 py-2 text-white text-xs outline-none focus:border-blue-500"/>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => setAgregando(false)} className="flex-1 text-gray-400 border border-white/8 rounded-lg py-1.5 text-xs">Cancelar</button>
                                                <button onClick={agregarProducto} className="flex-1 bg-blue-500 text-white rounded-lg py-1.5 text-xs font-semibold">Agregar</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 flex justify-between items-center mb-4">
                                <p className="text-white font-semibold">Total</p>
                                <p className="text-blue-400 text-xl font-bold">${Number(detalle.total).toFixed(2)}</p>
                            </div>

                            {detalle.estado === 'Pendiente' && (
                                <button onClick={() => eliminarOrden(detalle.orden_id)}
                                    className="w-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-2.5 rounded-xl font-semibold hover:bg-red-500/20 transition">
                                    🗑 Eliminar orden completa
                                </button>
                            )}
                        </div>
                        <div className="p-5 border-t border-white/8 flex gap-2">
                            {detalle.estado === 'Pendiente' && (
                                <button onClick={() => cambiarEstado(detalle.orden_id, 'EnCocina')}
                                    className="flex-1 bg-blue-500 text-white text-xs py-2.5 rounded-xl font-semibold hover:bg-blue-600 transition">
                                    Enviar a cocina
                                </button>
                            )}
                            {detalle.estado === 'EnCocina' && (
                                <button onClick={() => cambiarEstado(detalle.orden_id, 'Lista')}
                                    className="flex-1 bg-blue-500 text-white text-xs py-2.5 rounded-xl font-semibold hover:bg-blue-600 transition">
                                    Marcar lista
                                </button>
                            )}
                            {detalle.estado === 'Lista' && (
                                <button onClick={() => cambiarEstado(detalle.orden_id, 'Cerrada')}
                                    className="flex-1 bg-green-500 text-white text-xs py-2.5 rounded-xl font-semibold hover:bg-green-600 transition">
                                    Cerrar orden
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
    const [historial, setHistorial] = useState([])
    const [metricas, setMetricas] = useState(null)
    const [fechaSel, setFechaSel] = useState(new Date().toISOString().split('T')[0])
    const [detalleOrden, setDetalleOrden] = useState(null)
    const [ordenSelec, setOrdenSelec] = useState(null)

    useEffect(() => { cargar() }, [fechaSel])

    const cargar = async () => {
        try {
            const [h, c] = await Promise.all([
                api.get(`/caja/historial?fecha=${fechaSel}`),
                api.get('/caja')
            ])
            setHistorial(h.data)
            setMetricas(c.data.ventas)
        } catch (err) { console.error(err) }
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

    return (
        <div>
            {/* Filtro por fecha */}
            <div className="flex items-center gap-3 mb-5">
                <label className="text-gray-400 text-sm">Fecha:</label>
                <input type="date" value={fechaSel}
                    onChange={e => setFechaSel(e.target.value)}
                    className="bg-[#111318] border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
                <button onClick={cargar}
                    className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs px-3 py-2 rounded-xl hover:bg-blue-500/20 transition">
                    Buscar
                </button>
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Total vendido</p>
                    <p className="text-green-400 text-2xl font-bold">
                        ${historial.reduce((acc, o) => acc + Number(o.total), 0).toFixed(2)}
                    </p>
                </div>
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-4">
                    <p className="text-xs text-gray-500 mb-1">Órdenes cerradas</p>
                    <p className="text-white text-2xl font-bold">{historial.length}</p>
                </div>
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-4 col-span-2 md:col-span-1">
                    <p className="text-xs text-gray-500 mb-1">Ticket promedio</p>
                    <p className="text-blue-400 text-2xl font-bold">
                        ${historial.length > 0
                            ? (historial.reduce((acc, o) => acc + Number(o.total), 0) / historial.length).toFixed(2)
                            : '0.00'}
                    </p>
                </div>
            </div>

            {/* Tabla historial */}
            <div className="bg-[#111318] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center">
                    <p className="text-white text-sm font-semibold">Órdenes del {fechaSel}</p>
                    <p className="text-gray-500 text-xs">{historial.length} órdenes</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">#</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Mesa</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide hidden md:table-cell">Mesero</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Hora cierre</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Total</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Detalle</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.length === 0 ? (
                                <tr><td colSpan="6" className="text-center text-gray-500 text-sm py-8">No hay órdenes para esta fecha</td></tr>
                            ) : historial.map(o => (
                                <tr key={o.orden_id} className="border-b border-white/4 hover:bg-white/2">
                                    <td className="px-5 py-3 text-white text-sm font-bold">#{o.orden_id}</td>
                                    <td className="px-5 py-3 text-gray-300 text-sm">Mesa {o.nro_mesa}</td>
                                    <td className="px-5 py-3 text-gray-400 text-sm hidden md:table-cell">{o.mesero}</td>
                                    <td className="px-5 py-3 text-gray-400 text-sm">
                                        {new Date(o.fecha_cierre).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-5 py-3 text-green-400 text-sm font-bold">${Number(o.total).toFixed(2)}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => verDetalle(o)}
                                                className="text-xs px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition">
                                                Ver
                                            </button>
                                            <button onClick={() => generarFactura(o)}
                                                className="text-xs px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition">
                                                PDF
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal detalle orden */}
            {detalleOrden && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={() => setDetalleOrden(null)}>
                    <div className="bg-[#111318] border border-white/8 rounded-2xl w-full max-w-md"
                        onClick={e => e.stopPropagation()}>
                        <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center">
                            <div>
                                <p className="text-white font-bold">Orden #{detalleOrden.orden_id}</p>
                                <p className="text-gray-500 text-xs">Mesa {detalleOrden.nro_mesa} · {detalleOrden.mesero}</p>
                            </div>
                            <button onClick={() => setDetalleOrden(null)}
                                className="w-8 h-8 bg-[#1a1d24] rounded-lg flex items-center justify-center text-gray-400 hover:text-white">✕</button>
                        </div>
                        <div className="p-5">
                            <div className="space-y-2 mb-4">
                                {detalleOrden.productos?.map(p => (
                                    <div key={p.detalle_id} className="bg-[#1a1d24] rounded-xl p-3 flex justify-between">
                                        <div>
                                            <p className="text-white text-sm font-medium">{p.producto}</p>
                                            <p className="text-gray-500 text-xs">x{p.cantidad}{p.observacion && ` · ${p.observacion}`}</p>
                                        </div>
                                        <p className="text-blue-400 font-bold text-sm">${Number(p.subtotal).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 flex justify-between mb-4">
                                <p className="text-white font-semibold">Total</p>
                                <p className="text-blue-400 text-xl font-bold">${Number(detalleOrden.total).toFixed(2)}</p>
                            </div>
                            <button
                                onClick={() => generarFacturaPDF(ordenSelec, detalleOrden.productos)}
                                className="w-full bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-semibold py-2.5 rounded-xl hover:bg-green-500/20 transition">
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
function PaginaMenu() {
    const [productos, setProductos] = useState([])
    const [categorias, setCategorias] = useState([])
    const [mostrarForm, setMostrarForm] = useState(false)
    const [editando, setEditando] = useState(null)
    const [form, setForm] = useState({ categoria_id: '', nombre: '', descripcion: '', precio: '', disponible: true })
    const [msg, setMsg] = useState('')
    const [filtroCategoria, setFiltroCategoria] = useState('Todos')

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        const [p, c] = await Promise.all([api.get('/menu/productos'), api.get('/menu/categorias')])
        setProductos(p.data)
        setCategorias(c.data)
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
        setMsg('')
    }

    const guardar = async (e) => {
        e.preventDefault()
        try {
            if (editando) {
                await api.put(`/menu/productos/${editando.producto_id}`, form)
                setMsg('Producto actualizado correctamente')
            } else {
                await api.post('/menu/productos', form)
                setMsg('Producto creado correctamente')
            }
            setMostrarForm(false)
            cargar()
        } catch (err) {
            setMsg(err.response?.data?.error || 'Error guardando producto')
        }
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar este producto del menú?')) return
        try {
            await api.delete(`/menu/productos/${id}`)
            cargar()
        } catch (err) {
            alert(err.response?.data?.error || 'Error eliminando producto')
        }
    }

    const productosFiltrados = filtroCategoria === 'Todos' ? productos : productos.filter(p => p.categoria === filtroCategoria)

    return (
        <div>
            <div className="flex justify-between items-center mb-5 flex-wrap gap-3">
                <div className="flex gap-2 flex-wrap">
                    <button onClick={() => setFiltroCategoria('Todos')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                            ${filtroCategoria === 'Todos' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-[#111318] border-white/8 text-gray-400 hover:text-white'}`}>
                        Todos
                    </button>
                    {categorias.map(c => (
                        <button key={c.categoria_id} onClick={() => setFiltroCategoria(c.nombre)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition
                                ${filtroCategoria === c.nombre ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-[#111318] border-white/8 text-gray-400 hover:text-white'}`}>
                            {c.nombre}
                        </button>
                    ))}
                </div>
                <button onClick={() => abrirForm()}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">
                    + Nuevo producto
                </button>
            </div>

            {msg && <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-3 rounded-xl mb-4">{msg}</div>}

            {mostrarForm && (
                <form onSubmit={guardar} className="bg-[#111318] border border-white/8 rounded-2xl p-5 mb-5">
                    <p className="text-white text-sm font-semibold mb-4">{editando ? 'Editar producto' : 'Nuevo producto'}</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input required placeholder="Nombre del producto" value={form.nombre}
                            onChange={e => setForm({...form, nombre: e.target.value})}
                            className="bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
                        <input required type="number" step="0.01" placeholder="Precio ($)" value={form.precio}
                            onChange={e => setForm({...form, precio: e.target.value})}
                            className="bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
                        <select required value={form.categoria_id} onChange={e => setForm({...form, categoria_id: e.target.value})}
                            className="bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500">
                            <option value="">Seleccionar categoría</option>
                            {categorias.map(c => <option key={c.categoria_id} value={c.categoria_id}>{c.nombre}</option>)}
                        </select>
                        <select value={form.disponible} onChange={e => setForm({...form, disponible: e.target.value === 'true'})}
                            className="bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500">
                            <option value="true">Disponible</option>
                            <option value="false">No disponible</option>
                        </select>
                        <textarea placeholder="Descripción (opcional)" value={form.descripcion}
                            onChange={e => setForm({...form, descripcion: e.target.value})}
                            className="md:col-span-2 bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500 resize-none h-20"/>
                    </div>
                    <div className="flex gap-3 justify-end mt-4">
                        <button type="button" onClick={() => setMostrarForm(false)}
                            className="px-4 py-2 text-gray-400 border border-white/8 rounded-xl text-sm hover:text-white transition">Cancelar</button>
                        <button type="submit"
                            className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition">
                            {editando ? 'Guardar cambios' : 'Crear producto'}
                        </button>
                    </div>
                </form>
            )}

            <div className="bg-[#111318] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8 flex justify-between">
                    <p className="text-white text-sm font-semibold">Productos del menú</p>
                    <p className="text-gray-500 text-xs">{productosFiltrados.length} productos</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Producto</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide hidden md:table-cell">Categoría</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Precio</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Estado</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {productosFiltrados.map(p => (
                                <tr key={p.producto_id} className="border-b border-white/4 hover:bg-white/2">
                                    <td className="px-5 py-3">
                                        <p className="text-white text-sm font-medium">{p.nombre}</p>
                                        {p.descripcion && <p className="text-gray-500 text-xs truncate max-w-xs">{p.descripcion}</p>}
                                    </td>
                                    <td className="px-5 py-3 text-gray-400 text-sm hidden md:table-cell">{p.categoria}</td>
                                    <td className="px-5 py-3 text-blue-400 text-sm font-bold">${Number(p.precio).toFixed(2)}</td>
                                    <td className="px-5 py-3">
                                        <span className={`text-xs px-2 py-1 rounded-full font-semibold ${p.disponible ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                            {p.disponible ? 'Disponible' : 'No disponible'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3">
                                        <div className="flex gap-2">
                                            <button onClick={() => abrirForm(p)}
                                                className="text-xs px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition">
                                                Editar
                                            </button>
                                            <button onClick={() => eliminar(p.producto_id)}
                                                className="text-xs px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                                                Eliminar
                                            </button>
                                        </div>
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

/* ==================== USUARIOS ==================== */
function PaginaUsuarios() {
    const [usuarios, setUsuarios] = useState([])
    const [roles, setRoles] = useState([])
    const [form, setForm] = useState({ rol_id: '', nombre_completo: '', nombre_usuario: '', password: '' })
    const [editando, setEditando] = useState(null)
    const [cambioPass, setCambioPass] = useState(null)
    const [nuevaPass, setNuevaPass] = useState('')
    const [mostrarForm, setMostrarForm] = useState(false)
    const [msg, setMsg] = useState('')

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        const [u, r] = await Promise.all([api.get('/usuarios'), api.get('/usuarios/roles')])
        setUsuarios(u.data)
        setRoles(r.data)
    }

    const abrirEditar = (u) => {
        setEditando(u)
        setForm({ rol_id: u.rol_id || '', nombre_completo: u.nombre_completo, nombre_usuario: u.nombre_usuario, password: '' })
        setMostrarForm(true)
        setMsg('')
    }

    const guardar = async (e) => {
        e.preventDefault()
        try {
            if (editando) {
                await api.put(`/usuarios/${editando.usuario_id}`, { nombre_completo: form.nombre_completo, nombre_usuario: form.nombre_usuario, rol_id: form.rol_id })
                setMsg('Usuario actualizado correctamente')
            } else {
                await api.post('/usuarios', form)
                setMsg('Usuario creado correctamente')
            }
            setMostrarForm(false)
            setEditando(null)
            cargar()
        } catch (err) {
            setMsg(err.response?.data?.error || 'Error guardando usuario')
        }
    }

    const guardarPassword = async (id) => {
        try {
            await api.patch(`/usuarios/${id}/password`, { password: nuevaPass })
            setMsg('Contraseña actualizada correctamente')
            setCambioPass(null)
            setNuevaPass('')
        } catch (err) {
            setMsg(err.response?.data?.error || 'Error cambiando contraseña')
        }
    }

    const eliminar = async (id) => {
        if (!confirm('¿Eliminar este usuario?')) return
        try {
            await api.delete(`/usuarios/${id}`)
            cargar()
        } catch (err) {
            alert(err.response?.data?.error || 'Error eliminando usuario')
        }
    }

    const toggleActivo = async (id) => {
        await api.patch(`/usuarios/${id}`)
        cargar()
    }

    const colores = ['bg-blue-900 text-blue-300', 'bg-green-900 text-green-300', 'bg-yellow-900 text-yellow-300', 'bg-purple-900 text-purple-300']

    return (
        <div>
            <div className="flex justify-between items-center mb-5">
                <p className="text-gray-400 text-sm">{usuarios.length} usuarios registrados</p>
                <button onClick={() => { setEditando(null); setForm({ rol_id: '', nombre_completo: '', nombre_usuario: '', password: '' }); setMostrarForm(true); setMsg('') }}
                    className="bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-xl transition">
                    + Nuevo usuario
                </button>
            </div>

            {msg && <div className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm px-4 py-3 rounded-xl mb-4">{msg}</div>}

            {mostrarForm && (
                <form onSubmit={guardar} className="bg-[#111318] border border-white/8 rounded-2xl p-5 mb-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <p className="md:col-span-2 text-white text-sm font-semibold">{editando ? 'Editar usuario' : 'Nuevo usuario'}</p>
                    <input required placeholder="Nombre completo" value={form.nombre_completo}
                        onChange={e => setForm({...form, nombre_completo: e.target.value})}
                        className="bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
                    <input required placeholder="Nombre de usuario" value={form.nombre_usuario}
                        onChange={e => setForm({...form, nombre_usuario: e.target.value})}
                        className="bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
                    {!editando && (
                        <input required type="password" placeholder="Contraseña" value={form.password}
                            onChange={e => setForm({...form, password: e.target.value})}
                            className="bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
                    )}
                    <select required value={form.rol_id} onChange={e => setForm({...form, rol_id: e.target.value})}
                        className="bg-[#1a1d24] border border-white/8 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-blue-500">
                        <option value="">Seleccionar rol</option>
                        {roles.map(r => <option key={r.rol_id} value={r.rol_id}>{r.nombre}</option>)}
                    </select>
                    <div className="md:col-span-2 flex gap-3 justify-end">
                        <button type="button" onClick={() => { setMostrarForm(false); setEditando(null) }}
                            className="px-4 py-2 text-gray-400 border border-white/8 rounded-xl text-sm hover:text-white transition">Cancelar</button>
                        <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded-xl text-sm font-semibold hover:bg-blue-600 transition">
                            {editando ? 'Guardar cambios' : 'Crear usuario'}
                        </button>
                    </div>
                </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {usuarios.map((u, i) => (
                    <div key={u.usuario_id} className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold ${colores[i % colores.length]}`}>
                                {u.nombre_completo.charAt(0)}
                            </div>
                            <div>
                                <p className="text-white text-sm font-semibold">{u.nombre_completo}</p>
                                <p className="text-gray-500 text-xs">{u.rol} · @{u.nombre_usuario}</p>
                            </div>
                        </div>
                        <hr className="border-white/8 mb-3"/>
                        {cambioPass === u.usuario_id && (
                            <div className="flex gap-2 mb-3">
                                <input type="password" placeholder="Nueva contraseña..." value={nuevaPass}
                                    onChange={e => setNuevaPass(e.target.value)}
                                    className="flex-1 bg-[#1a1d24] border border-white/8 rounded-lg px-3 py-1.5 text-white text-xs outline-none focus:border-blue-500"/>
                                <button onClick={() => guardarPassword(u.usuario_id)}
                                    className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded-lg font-semibold">OK</button>
                                <button onClick={() => { setCambioPass(null); setNuevaPass('') }}
                                    className="text-gray-400 border border-white/8 text-xs px-2 py-1.5 rounded-lg">✕</button>
                            </div>
                        )}
                        <div className="flex gap-2 flex-wrap">
                            <button onClick={() => abrirEditar(u)}
                                className="text-xs px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition">
                                Editar
                            </button>
                            <button onClick={() => { setCambioPass(u.usuario_id); setNuevaPass('') }}
                                className="text-xs px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition">
                                Contraseña
                            </button>
                            <button onClick={() => toggleActivo(u.usuario_id)}
                                className={`text-xs px-3 py-1.5 rounded-lg border transition
                                    ${u.activo
                                        ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400'
                                        : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-green-500/10 hover:border-green-500/20 hover:text-green-400'}`}>
                                {u.activo ? 'Activo' : 'Inactivo'}
                            </button>
                            <button onClick={() => eliminar(u.usuario_id)}
                                className="text-xs px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition">
                                Eliminar
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

/* ==================== CAJA ==================== */
function PaginaCaja() {
    const [estado, setEstado] = useState(null)
    const [historial, setHistorial] = useState([])
    const [montoApertura, setMontoApertura] = useState('')
    const [montoCierre, setMontoCierre] = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [msg, setMsg] = useState('')
    const [pinReabrir, setPinReabrir] = useState('')
    const [mostrarReabrir, setMostrarReabrir] = useState(false)

    useEffect(() => { cargar() }, [])

    const cargar = async () => {
        const [c, h] = await Promise.all([api.get('/caja'), api.get('/caja/historial')])
        setEstado(c.data)
        setHistorial(h.data)
    }

    const abrirCaja = async () => {
        try {
            await api.post('/caja/abrir', { monto_apertura: parseFloat(montoApertura) })
            setMsg('✅ Caja abierta correctamente')
            setMontoApertura('')
            cargar()
        } catch (err) {
            setMsg('❌ ' + (err.response?.data?.error || 'Error abriendo caja'))
        }
    }

    const cerrarCaja = async () => {
        try {
            await api.post('/caja/cerrar', { monto_fisico_contado: parseFloat(montoCierre), observaciones })
            setMsg('✅ Caja cerrada correctamente')
            setMontoCierre('')
            cargar()
        } catch (err) {
            setMsg('❌ ' + (err.response?.data?.error || 'Error cerrando caja'))
        }
    }

    const reabrirCaja = async () => {
        try {
            await api.post('/caja/reabrir', { pin: pinReabrir })
            setMsg('✅ Caja reabierta correctamente')
            setPinReabrir('')
            setMostrarReabrir(false)
            cargar()
        } catch (err) {
            setMsg('❌ ' + (err.response?.data?.error || 'Error reabriendo caja'))
        }
    }

    const generarFactura = async (orden) => {
        const res = await api.get(`/ordenes/${orden.orden_id}`)
        generarFacturaPDF(orden, res.data.productos)
    }

    const totalVentas = Number(estado?.ventas?.total_ventas || 0)
    const diferencia  = montoCierre ? parseFloat(montoCierre) - totalVentas : null

    return (
        <div>
            {msg && <div className="bg-[#111318] border border-white/8 text-gray-300 text-sm px-4 py-3 rounded-xl mb-5">{msg}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Apertura de caja</p>
                    <p className="text-blue-400 text-3xl font-bold mb-1">${Number(estado?.caja?.monto_apertura || 0).toFixed(2)}</p>
                    <p className="text-gray-500 text-xs mb-4">
                        {estado?.caja
                            ? `Estado: ${estado.caja.estado} · ${new Date(estado.caja.hora_apertura).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}`
                            : 'Sin caja abierta hoy'}
                    </p>
                    {!estado?.caja && (
                        <div className="flex gap-2">
                            <input type="number" placeholder="Monto inicial..." value={montoApertura}
                                onChange={e => setMontoApertura(e.target.value)}
                                className="flex-1 bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
                            <button onClick={abrirCaja} className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">Abrir</button>
                        </div>
                    )}
                </div>
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Ventas del día</p>
                    <p className="text-green-400 text-3xl font-bold mb-1">${totalVentas.toFixed(2)}</p>
                    <p className="text-gray-500 text-xs">{estado?.ventas?.total_ordenes || 0} órdenes cerradas hoy</p>
                </div>
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Cierre de caja</p>
                    <p className="text-yellow-400 text-3xl font-bold mb-1">{montoCierre ? `$${parseFloat(montoCierre).toFixed(2)}` : '$0.00'}</p>
                    <p className="text-gray-500 text-xs mb-4">Efectivo contado al final del día</p>
                    {estado?.caja?.estado === 'Abierta' && (
                        <div className="space-y-2">
                            <input type="number" placeholder="Efectivo contado..." value={montoCierre}
                                onChange={e => setMontoCierre(e.target.value)}
                                className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
                            <input placeholder="Observaciones (opcional)" value={observaciones}
                                onChange={e => setObservaciones(e.target.value)}
                                className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
                            <button onClick={cerrarCaja} className="w-full bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold py-2 rounded-xl transition">
                                Cerrar caja del día
                            </button>
                        </div>
                    )}
                    {estado?.caja?.estado === 'Cerrada' && (
                        <div>
                            <p className="text-gray-500 text-xs bg-white/5 rounded-xl px-3 py-2 mb-2">Caja cerrada hoy</p>
                            {!mostrarReabrir ? (
                                <button onClick={() => { setMostrarReabrir(true); setMsg('') }}
                                    className="w-full border border-dashed border-white/15 text-gray-500 hover:text-yellow-400 hover:border-yellow-500/30 text-xs py-2 rounded-xl transition">
                                    Reabrir caja
                                </button>
                            ) : (
                                <div className="space-y-2">
                                    <input type="password" placeholder="PIN de autorización..."
                                        value={pinReabrir} onChange={e => setPinReabrir(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && reabrirCaja()}
                                        className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-yellow-500"/>
                                    {msg && (
                                        <p className={`text-xs px-2 py-1.5 rounded-lg ${msg.startsWith('✅') ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                                            {msg}
                                        </p>
                                    )}
                                    <div className="flex gap-2">
                                        <button onClick={() => { setMostrarReabrir(false); setPinReabrir(''); setMsg('') }}
                                            className="flex-1 text-gray-400 border border-white/8 rounded-xl text-xs py-2 hover:text-white transition">
                                            Cancelar
                                        </button>
                                        <button onClick={reabrirCaja}
                                            className="flex-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs py-2 rounded-xl font-semibold hover:bg-yellow-500/20 transition">
                                            Confirmar
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Diferencia</p>
                    <p className={`text-3xl font-bold mb-1 ${diferencia === null ? 'text-gray-500' : diferencia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {diferencia === null ? '—' : `${diferencia >= 0 ? '+' : ''}$${diferencia.toFixed(2)}`}
                    </p>
                    <p className="text-gray-500 text-xs">
                        {diferencia === null ? 'Ingresá el monto de cierre para calcular' : diferencia >= 0 ? '✅ Sobrante en caja' : '⚠️ Faltante en caja'}
                    </p>
                </div>
            </div>
            <div className="bg-[#111318] border border-white/8 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center">
                    <p className="text-white text-sm font-semibold">Órdenes cerradas hoy</p>
                    <p className="text-gray-500 text-xs">{historial.length} órdenes</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5">
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">#</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Mesa</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide hidden md:table-cell">Mesero</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Hora</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Total</th>
                                <th className="text-left text-xs text-gray-500 px-5 py-3 uppercase tracking-wide">Factura</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historial.length === 0 ? (
                                <tr><td colSpan="6" className="text-center text-gray-500 text-sm py-8">No hay órdenes cerradas hoy</td></tr>
                            ) : historial.map(o => (
                                <tr key={o.orden_id} className="border-b border-white/4 hover:bg-white/2">
                                    <td className="px-5 py-3 text-white text-sm font-bold">#{o.orden_id}</td>
                                    <td className="px-5 py-3 text-gray-300 text-sm">Mesa {o.nro_mesa}</td>
                                    <td className="px-5 py-3 text-gray-400 text-sm hidden md:table-cell">{o.mesero}</td>
                                    <td className="px-5 py-3 text-gray-400 text-sm">
                                        {new Date(o.fecha_cierre).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-5 py-3 text-green-400 text-sm font-bold">${Number(o.total).toFixed(2)}</td>
                                    <td className="px-5 py-3">
                                        <button onClick={() => generarFactura(o)}
                                            className="text-xs px-3 py-1.5 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg hover:bg-green-500/20 transition">
                                            🖨 PDF
                                        </button>
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