import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { generarTicketPDF } from '../utils/factura'

const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
const esAdmin = usuario.rol === 'Administrador'

export default function Mesas() {
    const [mesas, setMesas] = useState([])
    const [mesaSeleccionada, setMesaSeleccionada] = useState(null)
    const [ordenActiva, setOrdenActiva] = useState(null)
    const [productos, setProductos] = useState([])
    const [vista, setVista] = useState('mapa')
    const [modoEdicion, setModoEdicion] = useState(false)
    const [dragging, setDragging] = useState(null)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [prodSel, setProdSel] = useState('')
    const [cantidad, setCantidad] = useState(1)
    const [obsProducto, setObsProducto] = useState('')
    const [msg, setMsg] = useState('')
    const [cargando, setCargando] = useState(false)
    const [mostrarFormMesa, setMostrarFormMesa] = useState(false)
    const [formMesa, setFormMesa] = useState({ numero: '', capacidad: 4 })
    const [msgMapa, setMsgMapa] = useState('')
    const [categorias, setCategorias] = useState([])
    const [busquedaProd, setBusquedaProd] = useState('')
    const [filtroCat, setFiltroCat] = useState('Todos')
    const mapaRef = useRef(null)

    useEffect(() => {
        cargar()
        api.get('/menu/productos').then(r => setProductos(r.data))
        api.get('/menu/categorias').then(r => setCategorias(r.data))
        const interval = setInterval(cargar, 15000)
        return () => clearInterval(interval)
    }, [])

    const cargar = async () => {
        const res = await api.get('/mesas')
        setMesas(res.data)
    }

    const getColorMesa = (mesa) => {
        if (mesa.estado === 'Disponible') return {
            bg: '#0f2a1a', border: '#22c55e', text: '#22c55e', badge: 'Libre'
        }
        if (mesa.estado === 'EnProcesoDePago') return {
            bg: '#2a1a0a', border: '#f59e0b', text: '#f59e0b', badge: 'Pagando'
        }
        return {
            bg: '#0a1a2a', border: '#1a6ff5', text: '#1a6ff5', badge: 'Ocupada'
        }
    }

    const abrirMesa = async (mesa) => {
        setMesaSeleccionada(mesa)
        setMsg('')
        setProdSel('')
        setCantidad(1)
        setObsProducto('')
        setBusquedaProd('')
        setFiltroCat('Todos')
        if (mesa.orden_id) {
            const res = await api.get(`/ordenes/${mesa.orden_id}`)
            setOrdenActiva(res.data)
        } else {
            setOrdenActiva(null)
        }
        setVista('orden')
    }

    const crearOrden = async () => {
    setCargando(true)
    try {
        const res = await api.post('/ordenes', {
            mesa_id: mesaSeleccionada.mesa_id,
            observaciones: ''
        })
        const orden = res.data
        setOrdenActiva({ ...orden, productos: [] })
        await cargar()
        setMsg('Orden creada — agregá los productos')
    } catch (err) {
        const error = err.response?.data?.error || 'Error creando orden'
        setMsg('❌ ' + error)
    } finally {
        setCargando(false)
    }
}

    const agregarProducto = async () => {
        if (!prodSel || !ordenActiva) return
        setCargando(true)
        try {
            await api.post(`/ordenes/${ordenActiva.orden_id}/producto`, {
                producto_id: prodSel,
                cantidad: parseInt(cantidad),
                observacion: obsProducto
            })
            await api.patch(`/ordenes/${ordenActiva.orden_id}/estado`, { estado: 'EnCocina' })
            const res = await api.get(`/ordenes/${ordenActiva.orden_id}`)
            setOrdenActiva(res.data)
            setProdSel('')
            setCantidad(1)
            setObsProducto('')
            setMsg('✅ Producto agregado y enviado a cocina')
            cargar()
        } catch (err) {
            setMsg(err.response?.data?.error || 'Error agregando producto')
        } finally {
            setCargando(false)
        }
    }

    const cerrarOrden = async () => {
        if (!ordenActiva) return
        if (!confirm('¿Cerrar esta orden? Se registrará en caja.')) return
        setCargando(true)
        try {
            await api.patch(`/ordenes/${ordenActiva.orden_id}/estado`, { estado: 'Cerrada' })
            setMsg('✅ Orden cerrada correctamente')
            setOrdenActiva(null)
            await cargar()
            setTimeout(() => setVista('mapa'), 1200)
        } catch (err) {
            setMsg(err.response?.data?.error || 'Error cerrando orden')
        } finally {
            setCargando(false)
        }
    }

    const desocuparMesa = async () => {
        if (!confirm(`¿Desocupar Mesa ${mesaSeleccionada.numero}? Se eliminará la orden activa.`)) return
        setCargando(true)
        try {
            await api.delete(`/ordenes/${ordenActiva.orden_id}`)
            setOrdenActiva(null)
            setVista('mapa')
            await cargar()
        } catch (err) {
            setMsg(err.response?.data?.error || 'Error al desocupar la mesa')
        } finally {
            setCargando(false)
        }
    }

    const eliminarProducto = async (detalleId) => {
        try {
            await api.delete(`/ordenes/${ordenActiva.orden_id}/producto/${detalleId}`)
            const res = await api.get(`/ordenes/${ordenActiva.orden_id}`)
            setOrdenActiva(res.data)
            cargar()
        } catch (err) {
            setMsg(err.response?.data?.error || 'Error eliminando producto')
        }
    }

    const nuevaMesa = async () => {
        if (!formMesa.numero) return
        try {
            await api.post('/mesas', { numero: parseInt(formMesa.numero), capacidad: parseInt(formMesa.capacidad) })
            setMostrarFormMesa(false)
            setFormMesa({ numero: '', capacidad: 4 })
            setMsgMapa('✅ Mesa creada')
            cargar()
        } catch (err) {
            setMsgMapa('❌ ' + (err.response?.data?.error || 'Error creando mesa'))
        }
    }

    const eliminarMesa = async (mesa) => {
        if (!confirm(`¿Eliminar Mesa ${mesa.numero}?`)) return
        try {
            await api.delete(`/mesas/${mesa.mesa_id}`)
            setMsgMapa('✅ Mesa eliminada')
            cargar()
        } catch (err) {
            setMsgMapa('❌ ' + (err.response?.data?.error || 'Error eliminando mesa'))
        }
    }

    // Drag & drop para admin
    const onMouseDown = (e, mesa) => {
        if (!modoEdicion || !esAdmin) return
        e.preventDefault()
        const rect = mapaRef.current.getBoundingClientRect()
        setDragging(mesa.mesa_id)
        setOffset({
            x: e.clientX - rect.left - mesa.pos_x,
            y: e.clientY - rect.top - mesa.pos_y
        })
    }

    const onMouseMove = (e) => {
        if (!dragging || !mapaRef.current) return
        const rect = mapaRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(e.clientX - rect.left - offset.x, rect.width - 130))
        const y = Math.max(0, Math.min(e.clientY - rect.top - offset.y, rect.height - 100))
        setMesas(prev => prev.map(m => m.mesa_id === dragging ? { ...m, pos_x: x, pos_y: y } : m))
    }

    const onMouseUp = async () => {
        if (!dragging) return
        const mesa = mesas.find(m => m.mesa_id === dragging)
        if (mesa) {
            await api.patch(`/mesas/${mesa.mesa_id}`, { pos_x: Math.round(mesa.pos_x), pos_y: Math.round(mesa.pos_y) })
        }
        setDragging(null)
    }

    // Touch support para móvil
    const onTouchStart = (e, mesa) => {
        if (!modoEdicion || !esAdmin) return
        const touch = e.touches[0]
        const rect = mapaRef.current.getBoundingClientRect()
        setDragging(mesa.mesa_id)
        setOffset({
            x: touch.clientX - rect.left - mesa.pos_x,
            y: touch.clientY - rect.top - mesa.pos_y
        })
    }

    const onTouchMove = (e) => {
        if (!dragging || !mapaRef.current) return
        e.preventDefault()
        const touch = e.touches[0]
        const rect = mapaRef.current.getBoundingClientRect()
        const x = Math.max(0, Math.min(touch.clientX - rect.left - offset.x, rect.width - 130))
        const y = Math.max(0, Math.min(touch.clientY - rect.top - offset.y, rect.height - 100))
        setMesas(prev => prev.map(m => m.mesa_id === dragging ? { ...m, pos_x: x, pos_y: y } : m))
    }

    const onTouchEnd = async () => {
        if (!dragging) return
        const mesa = mesas.find(m => m.mesa_id === dragging)
        if (mesa) {
            await api.patch(`/mesas/${mesa.mesa_id}`, { pos_x: Math.round(mesa.pos_x), pos_y: Math.round(mesa.pos_y) })
        }
        setDragging(null)
    }

    const mesasLibres   = mesas.filter(m => m.estado === 'Disponible').length
    const mesasOcupadas = mesas.filter(m => m.estado !== 'Disponible').length

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

            {/* TOPBAR */}
            <div className="bg-[#111318] border-b border-white/8 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-900 rounded-xl flex items-center justify-center">
                        <span className="text-white text-xs">🍕</span>
                    </div>
                    <div>
                        <p className="text-white text-sm font-bold">Paris Rolly Pizza</p>
                        <p className="text-gray-500 text-xs">{usuario.nombre_completo} · {usuario.rol}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-lg">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"/>
                        {mesasLibres} libres
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-lg">
                        <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"/>
                        {mesasOcupadas} ocupadas
                    </div>
                    {esAdmin && (
                        <button onClick={() => setModoEdicion(!modoEdicion)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${modoEdicion
                                ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                            {modoEdicion ? '✏️ Editando' : '✏️ Editar mapa'}
                        </button>
                    )}
                    {esAdmin ? (
                        <button onClick={() => { window.location.href = '/dashboard' }}
                            className="text-xs text-gray-500 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition">
                            Dashboard →
                        </button>
                    ) : (
                        <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('usuario'); window.location.href = '/login' }}
                            className="text-xs text-gray-500 hover:text-red-400 border border-white/8 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition">
                            Cerrar sesión
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="flex-1 flex overflow-hidden">

                {/* MAPA DE MESAS */}
                <div className="flex-1 relative overflow-hidden">
                    {modoEdicion && esAdmin && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2" style={{ minWidth: 360 }}>
                            <div className="bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs px-4 py-2 rounded-xl flex items-center gap-3">
                                <span>Arrastrá las mesas para reposicionarlas</span>
                                <button onClick={() => { setMostrarFormMesa(true); setMsgMapa('') }}
                                    className="bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/40 text-yellow-300 text-xs px-3 py-1 rounded-lg font-semibold transition">
                                    + Nueva mesa
                                </button>
                            </div>
                            {msgMapa && (
                                <div className={`text-xs px-4 py-2 rounded-xl border ${msgMapa.startsWith('✅') ? 'bg-green-500/15 border-green-500/30 text-green-400' : 'bg-red-500/15 border-red-500/30 text-red-400'}`}>
                                    {msgMapa}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Leyenda */}
                    <div className="absolute bottom-4 left-4 z-10 flex gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#111318] border border-white/8 px-2.5 py-1.5 rounded-lg">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#0f2a1a] border border-green-500"/>Libre
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#111318] border border-white/8 px-2.5 py-1.5 rounded-lg">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#0a1a2a] border border-blue-500"/>Ocupada
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#111318] border border-white/8 px-2.5 py-1.5 rounded-lg">
                            <span className="w-2.5 h-2.5 rounded-sm bg-[#2a1a0a] border border-yellow-500"/>Pagando
                        </div>
                    </div>

                    <div
                        ref={mapaRef}
                        className="w-full h-full relative select-none"
                        style={{ minHeight: '500px', background: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.02) 39px, rgba(255,255,255,0.02) 40px)' }}
                        onMouseMove={onMouseMove}
                        onMouseUp={onMouseUp}
                        onMouseLeave={onMouseUp}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        {mesas.map(mesa => {
                            const color = getColorMesa(mesa)
                            const isDraggingThis = dragging === mesa.mesa_id
                            return (
                                <div
                                    key={mesa.mesa_id}
                                    className="absolute transition-shadow"
                                    style={{
                                        left: mesa.pos_x || 0,
                                        top: mesa.pos_y || 0,
                                        width: 130,
                                        cursor: modoEdicion && esAdmin ? 'grab' : 'pointer',
                                        zIndex: isDraggingThis ? 50 : 1,
                                        transform: isDraggingThis ? 'scale(1.05)' : 'scale(1)',
                                        transition: isDraggingThis ? 'none' : 'transform 0.15s'
                                    }}
                                    onMouseDown={e => modoEdicion ? onMouseDown(e, mesa) : null}
                                    onTouchStart={e => modoEdicion ? onTouchStart(e, mesa) : null}
                                    onClick={() => !modoEdicion && abrirMesa(mesa)}
                                >
                                    <div
                                        className="rounded-2xl p-3 border-2 transition-all"
                                        style={{
                                            background: color.bg,
                                            borderColor: color.border,
                                            boxShadow: `0 0 20px ${color.border}25`
                                        }}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-white text-sm font-bold">Mesa {mesa.numero}</span>
                                            {modoEdicion && esAdmin ? (
                                                <button
                                                    onMouseDown={e => e.stopPropagation()}
                                                    onClick={e => { e.stopPropagation(); eliminarMesa(mesa) }}
                                                    className="w-6 h-6 bg-red-500/20 hover:bg-red-500/40 border border-red-500/40 text-red-400 rounded-lg flex items-center justify-center text-xs transition">
                                                    ✕
                                                </button>
                                            ) : (
                                                <span className="text-xs px-1.5 py-0.5 rounded-md font-semibold"
                                                    style={{ background: `${color.border}20`, color: color.text }}>
                                                    {color.badge}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs" style={{ color: color.text }}>
                                                👥 {mesa.capacidad}
                                            </span>
                                            {mesa.orden_id && (
                                                <span className="text-xs text-white font-bold">
                                                    ${Number(mesa.total || 0).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        {mesa.orden_id && (
                                            <div className="mt-1.5 text-xs" style={{ color: color.text }}>
                                                {mesa.total_items} item{mesa.total_items !== '1' ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* PANEL LATERAL — ORDEN */}
                {vista === 'orden' && mesaSeleccionada && (
                    <div className="w-full max-w-sm bg-[#111318] border-l border-white/8 flex flex-col flex-shrink-0"
                        style={{ minWidth: '320px' }}>

                        {/* Header panel */}
                        <div className="px-5 py-4 border-b border-white/8 flex justify-between items-center">
                            <div>
                                <p className="text-white font-bold">Mesa {mesaSeleccionada.numero}</p>
                                <p className="text-gray-500 text-xs">
                                    Capacidad: {mesaSeleccionada.capacidad} personas
                                    {ordenActiva && ` · Orden #${ordenActiva.orden_id}`}
                                </p>
                            </div>
                            <button onClick={() => { setVista('mapa'); setMesaSeleccionada(null); setOrdenActiva(null) }}
                                className="w-8 h-8 bg-[#1a1d24] rounded-lg flex items-center justify-center text-gray-400 hover:text-white">
                                ✕
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-5">
                            {msg && (
                                <div className="bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-3 py-2 rounded-lg mb-4">
                                    {msg}
                                </div>
                            )}

                            {/* Sin orden activa */}
                            {!ordenActiva && (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
                                        🪑
                                    </div>
                                    <p className="text-white font-semibold mb-1">Mesa disponible</p>
                                    <p className="text-gray-500 text-xs mb-6">Abrí una orden para comenzar a tomar el pedido</p>
                                    <button onClick={crearOrden} disabled={cargando}
                                        className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition text-sm">
                                        {cargando ? 'Abriendo...' : '+ Abrir orden'}
                                    </button>
                                </div>
                            )}

                            {/* Con orden activa */}
                            {ordenActiva && (
                                <div>
                                    {/* Agregar producto */}
                                    <div className="bg-[#1a1d24] border border-white/8 rounded-xl p-4 mb-4">
                                        <p className="text-white text-xs font-semibold mb-3 uppercase tracking-wider">Agregar al pedido</p>

                                        {/* Filtro por categoría */}
                                        <div className="flex gap-1.5 flex-wrap mb-2">
                                            {['Todos', ...categorias.map(c => c.nombre)].map(cat => (
                                                <button key={cat} onClick={() => { setFiltroCat(cat); setProdSel('') }}
                                                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition ${filtroCat === cat
                                                        ? 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                                                        : 'bg-[#22262f] border-white/8 text-gray-400 hover:text-white'}`}>
                                                    {cat}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Buscador */}
                                        <input
                                            placeholder="Buscar producto..."
                                            value={busquedaProd}
                                            onChange={e => { setBusquedaProd(e.target.value); setProdSel('') }}
                                            className="w-full bg-[#22262f] border border-white/8 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500 mb-2"
                                        />

                                        {/* Select filtrado */}
                                        <select value={prodSel} onChange={e => setProdSel(e.target.value)}
                                            className="w-full bg-[#22262f] border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500 mb-2">
                                            <option value="">Seleccionar producto...</option>
                                            {productos
                                                .filter(p => {
                                                    const matchCat  = filtroCat === 'Todos' || p.categoria === filtroCat
                                                    const matchBusq = p.nombre.toLowerCase().includes(busquedaProd.toLowerCase())
                                                    return matchCat && matchBusq
                                                })
                                                .map(p => (
                                                    <option key={p.producto_id} value={p.producto_id}>
                                                        {p.nombre} — ${Number(p.precio).toFixed(2)}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                        <div className="flex gap-2 mb-2">
                                            <div className="flex items-center gap-1">
                                                <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                                    className="w-8 h-8 bg-[#22262f] border border-white/8 rounded-lg text-white text-sm hover:bg-white/10">−</button>
                                                <span className="w-8 text-center text-white text-sm font-bold">{cantidad}</span>
                                                <button onClick={() => setCantidad(cantidad + 1)}
                                                    className="w-8 h-8 bg-[#22262f] border border-white/8 rounded-lg text-white text-sm hover:bg-white/10">+</button>
                                            </div>
                                            <input placeholder="Obs: sin cebolla..." value={obsProducto}
                                                onChange={e => setObsProducto(e.target.value)}
                                                className="flex-1 bg-[#22262f] border border-white/8 rounded-xl px-3 py-2 text-white text-xs outline-none focus:border-blue-500"/>
                                        </div>
                                        <button onClick={agregarProducto} disabled={!prodSel || cargando}
                                            className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                                            {cargando ? 'Agregando...' : '+ Agregar y enviar a cocina'}
                                        </button>
                                    </div>

                                    {/* Lista de productos */}
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Productos en la orden</p>
                                    {ordenActiva.productos?.length === 0 ? (
                                        <p className="text-gray-600 text-xs text-center py-4">Sin productos aún</p>
                                    ) : (
                                        <div className="space-y-2 mb-4">
                                            {ordenActiva.productos?.map(p => (
                                                <div key={p.detalle_id} className="bg-[#1a1d24] rounded-xl p-3 flex justify-between items-center">
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-white text-sm font-medium truncate">{p.producto}</p>
                                                        <p className="text-gray-500 text-xs">
                                                            x{p.cantidad}{p.observacion && ` · ${p.observacion}`}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <p className="text-blue-400 font-bold text-sm">${Number(p.subtotal).toFixed(2)}</p>
                                                        {['Pendiente', 'EnCocina', 'Lista'].includes(ordenActiva.estado) ? (
                                                            <button onClick={() => eliminarProducto(p.detalle_id)}
                                                                className="w-6 h-6 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg flex items-center justify-center text-xs hover:bg-red-500/20">
                                                                ✕
                                                            </button>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Total */}
                                    <div className="bg-blue-500/8 border border-blue-500/20 rounded-xl p-4 flex justify-between items-center mb-4">
                                        <p className="text-white font-semibold">Total</p>
                                        <p className="text-blue-400 text-xl font-bold">${Number(ordenActiva.total).toFixed(2)}</p>
                                    </div>

                                    {/* Estado */}
                                    <div className="bg-[#1a1d24] rounded-xl p-3 mb-4 flex items-center gap-2">
                                        <span className={`w-2 h-2 rounded-full ${
                                            ordenActiva.estado === 'Pendiente' ? 'bg-yellow-400' :
                                            ordenActiva.estado === 'EnCocina'  ? 'bg-blue-400' :
                                            ordenActiva.estado === 'Lista'     ? 'bg-green-400' : 'bg-gray-400'}`}/>
                                        <p className="text-gray-300 text-xs">Estado: <span className="font-semibold text-white">{ordenActiva.estado}</span></p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer — pre-cuenta y cerrar orden */}
                        {ordenActiva && (
                            <div className="p-5 border-t border-white/8 space-y-2">
                                <button
                                    onClick={() => generarTicketPDF(
                                        {
                                            orden_id: ordenActiva.orden_id,
                                            nro_mesa: ordenActiva.nro_mesa ?? mesaSeleccionada.numero,
                                            mesero:   ordenActiva.mesero   ?? usuario.nombre_completo,
                                            total:    ordenActiva.total
                                        },
                                        ordenActiva.productos || []
                                    )}
                                    disabled={!ordenActiva.productos?.length}
                                    className="w-full bg-blue-500/10 hover:bg-blue-500/20 disabled:opacity-40 border border-blue-500/20 text-blue-400 font-semibold py-2.5 rounded-xl transition text-sm">
                                    🧾 Generar pre-cuenta
                                </button>
                                <button onClick={cerrarOrden} disabled={cargando || !ordenActiva.productos?.length}
                                    className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-40 text-white font-semibold py-3 rounded-xl transition text-sm">
                                    {cargando ? 'Cerrando...' : '💳 Cerrar orden y cobrar'}
                                </button>
                                <p className="text-center text-xs text-gray-500">Al cerrar se registra en caja automáticamente</p>
                                {ordenActiva.estado === 'Pendiente' && (
                                    <button onClick={desocuparMesa} disabled={cargando}
                                        className="w-full text-xs text-red-400 hover:text-red-300 border border-red-500/20 hover:border-red-500/40 hover:bg-red-500/8 py-2 rounded-xl transition">
                                        🗑 Desocupar mesa (eliminar orden)
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal nueva mesa */}
            {mostrarFormMesa && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
                    onClick={() => setMostrarFormMesa(false)}>
                    <div className="bg-[#111318] border border-white/8 rounded-2xl w-full max-w-xs p-6"
                        onClick={e => e.stopPropagation()}>
                        <p className="text-white font-bold mb-4">Nueva mesa</p>
                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Número de mesa</label>
                                <input type="number" min="1" placeholder="Ej: 7"
                                    value={formMesa.numero}
                                    onChange={e => setFormMesa({ ...formMesa, numero: e.target.value })}
                                    className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1 block">Capacidad (personas)</label>
                                <input type="number" min="1" max="20"
                                    value={formMesa.capacidad}
                                    onChange={e => setFormMesa({ ...formMesa, capacidad: e.target.value })}
                                    className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-blue-500"/>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setMostrarFormMesa(false)}
                                className="flex-1 text-gray-400 border border-white/8 rounded-xl py-2.5 text-sm hover:text-white transition">
                                Cancelar
                            </button>
                            <button onClick={nuevaMesa}
                                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold transition">
                                Crear mesa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}