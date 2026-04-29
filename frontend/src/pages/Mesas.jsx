import { useState, useEffect, useRef } from 'react'
import api from '../services/api'
import { generarTicketPDF } from '../utils/factura'

const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')
const esAdmin = usuario.rol === 'Administrador'

const CAT_ICONS = {
    'Pizzas': '🍕', 'Pizza': '🍕',
    'Bebidas': '🥤', 'Bebida': '🥤',
    'Entradas': '🥗', 'Entrada': '🥗',
    'Postres': '🍰', 'Postre': '🍰',
    'Pastas': '🍝', 'Pasta': '🍝',
    'Ensaladas': '🥙', 'Ensalada': '🥙',
    'Carnes': '🥩', 'Carne': '🥩',
    'Sopas': '🍜', 'Sopa': '🍜',
}
const getCatIcon = (nombre) => CAT_ICONS[nombre] || '🍽'

export default function Mesas() {
    const [mesas,             setMesas]             = useState([])
    const [mesaSeleccionada,  setMesaSeleccionada]  = useState(null)
    const [ordenActiva,       setOrdenActiva]       = useState(null)
    const [productos,         setProductos]         = useState([])
    const [vista,             setVista]             = useState('mapa')
    const [modoEdicion,       setModoEdicion]       = useState(false)
    const [dragging,          setDragging]          = useState(null)
    const [offset,            setOffset]            = useState({ x: 0, y: 0 })
    const [prodSel,           setProdSel]           = useState('')
    const [cantidad,          setCantidad]          = useState(1)
    const [obsProducto,       setObsProducto]       = useState('')
    const [msg,               setMsg]               = useState('')
    const [cargando,          setCargando]          = useState(false)
    const [mostrarFormMesa,   setMostrarFormMesa]   = useState(false)
    const [formMesa,          setFormMesa]          = useState({ numero: '', capacidad: 4 })
    const [msgMapa,           setMsgMapa]           = useState('')
    const [categorias,        setCategorias]        = useState([])
    const [busquedaProd,      setBusquedaProd]      = useState('')
    const [filtroCat,         setFiltroCat]         = useState('Todos')
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
        if (mesa.estado === 'Disponible')      return { bg: '#0f2a1a', border: '#22c55e', text: '#22c55e', badge: 'Libre' }
        if (mesa.estado === 'EnProcesoDePago') return { bg: '#2a1a0a', border: '#f59e0b', text: '#f59e0b', badge: 'Pagando' }
        return { bg: '#1a1230', border: '#667EEA', text: '#a78bfa', badge: 'Ocupada' }
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
            const res = await api.post('/ordenes', { mesa_id: mesaSeleccionada.mesa_id, observaciones: '' })
            setOrdenActiva({ ...res.data, productos: [] })
            await cargar()
            setMsg('Orden creada — elegí los productos')
        } catch (err) {
            setMsg('❌ ' + (err.response?.data?.error || 'Error creando orden'))
        } finally {
            setCargando(false)
        }
    }

    const agregarProducto = async () => {
        if (!prodSel || !ordenActiva) return
        setCargando(true)
        try {
            const { data } = await api.post(`/ordenes/${ordenActiva.orden_id}/producto`, {
                producto_id: prodSel,
                cantidad: parseInt(cantidad),
                observacion: obsProducto
            })
            const res = await api.get(`/ordenes/${ordenActiva.orden_id}`)
            setOrdenActiva(res.data)
            setProdSel('')
            setCantidad(1)
            setObsProducto('')
            setMsg(data.reenviada ? '✅ Enviado a cocina' : '✅ Producto agregado')
            setTimeout(() => setMsg(''), 3000)
            cargar()
        } catch (err) {
            setMsg(err.response?.data?.error || 'Error agregando producto')
        } finally {
            setCargando(false)
        }
    }

    const enviarACobro = async () => {
        if (!ordenActiva) return
        setCargando(true)
        try {
            await api.patch(`/ordenes/${ordenActiva.orden_id}/estado`, { estado: 'PorCobrar' })
            const res = await api.get(`/ordenes/${ordenActiva.orden_id}`)
            setOrdenActiva(res.data)
            await cargar()
            setMsg('✅ Cuenta enviada a caja')
        } catch (err) {
            setMsg(err.response?.data?.error || 'Error enviando a cobro')
        } finally {
            setCargando(false)
        }
    }

    const desocuparMesa = async () => {
        if (!confirm(`¿Cancelar orden y desocupar Mesa ${mesaSeleccionada.numero}?`)) return
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

    const onMouseDown = (e, mesa) => {
        if (!modoEdicion || !esAdmin) return
        e.preventDefault()
        const rect = mapaRef.current.getBoundingClientRect()
        setDragging(mesa.mesa_id)
        setOffset({ x: e.clientX - rect.left - mesa.pos_x, y: e.clientY - rect.top - mesa.pos_y })
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
        if (mesa) await api.patch(`/mesas/${mesa.mesa_id}`, { pos_x: Math.round(mesa.pos_x), pos_y: Math.round(mesa.pos_y) })
        setDragging(null)
    }
    const onTouchStart = (e, mesa) => {
        if (!modoEdicion || !esAdmin) return
        const touch = e.touches[0]
        const rect = mapaRef.current.getBoundingClientRect()
        setDragging(mesa.mesa_id)
        setOffset({ x: touch.clientX - rect.left - mesa.pos_x, y: touch.clientY - rect.top - mesa.pos_y })
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
        if (mesa) await api.patch(`/mesas/${mesa.mesa_id}`, { pos_x: Math.round(mesa.pos_x), pos_y: Math.round(mesa.pos_y) })
        setDragging(null)
    }

    const mesasLibres   = mesas.filter(m => m.estado === 'Disponible').length
    const mesasOcupadas = mesas.filter(m => m.estado !== 'Disponible').length

    const productosFiltrados = productos.filter(p => {
        const matchCat  = filtroCat === 'Todos' || p.categoria === filtroCat
        const matchBusq = p.nombre.toLowerCase().includes(busquedaProd.toLowerCase())
        return matchCat && matchBusq
    })

    const prodSelObj = productos.find(p => String(p.producto_id) === String(prodSel))

    const estadoColor = {
        Pendiente: { dot: 'bg-yellow-400', text: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: 'Pendiente' },
        EnCocina:  { dot: 'bg-blue-400',   text: 'text-blue-400',   bg: 'bg-blue-500/10 border-blue-500/20',   label: 'En Cocina' },
        Lista:     { dot: 'bg-green-400',  text: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20', label: 'Lista ✓' },
        PorCobrar: { dot: 'bg-amber-400',  text: 'text-amber-400',  bg: 'bg-amber-500/10 border-amber-500/20', label: 'Por Cobrar' },
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

            {/* TOPBAR */}
            <div className="bg-[#111318] border-b border-white/8 px-4 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)', boxShadow: '0 4px 12px rgba(102,126,234,0.3)' }}>
                        <span className="text-white text-sm">🍕</span>
                    </div>
                    <div>
                        <p className="text-white text-sm font-bold leading-tight">Paris Rolly Pizza</p>
                        <p className="text-gray-500 text-xs">{usuario.nombre_completo} · {usuario.rol}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1.5 rounded-lg">
                        <span className="w-1.5 h-1.5 bg-green-400 rounded-full"/>
                        <span className="hidden sm:inline">{mesasLibres} libres</span>
                        <span className="sm:hidden">{mesasLibres}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-[#a78bfa] bg-purple-500/10 border border-purple-500/20 px-2.5 py-1.5 rounded-lg">
                        <span className="w-1.5 h-1.5 bg-[#a78bfa] rounded-full"/>
                        <span className="hidden sm:inline">{mesasOcupadas} ocupadas</span>
                        <span className="sm:hidden">{mesasOcupadas}</span>
                    </div>
                    {esAdmin && (
                        <button onClick={() => setModoEdicion(!modoEdicion)}
                            className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition ${modoEdicion
                                ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400'
                                : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}>
                            <span className="hidden sm:inline">{modoEdicion ? '✏️ Editando' : '✏️ Editar mapa'}</span>
                            <span className="sm:hidden">✏️</span>
                        </button>
                    )}
                    {esAdmin ? (
                        <button onClick={() => { window.location.href = '/dashboard' }}
                            className="text-xs text-gray-500 hover:text-white border border-white/8 px-3 py-1.5 rounded-lg transition">
                            <span className="hidden sm:inline">Dashboard →</span>
                            <span className="sm:hidden">↗</span>
                        </button>
                    ) : (
                        <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('usuario'); window.location.href = '/login' }}
                            className="text-xs text-gray-500 hover:text-red-400 border border-white/8 hover:border-red-500/30 px-3 py-1.5 rounded-lg transition">
                            <span className="hidden sm:inline">Cerrar sesión</span>
                            <span className="sm:hidden">✕</span>
                        </button>
                    )}
                </div>
            </div>

            {/* CONTENIDO */}
            <div className="flex-1 flex overflow-hidden">

                {/* MAPA DE MESAS */}
                <div className={`relative overflow-hidden ${vista === 'orden' ? 'hidden md:flex flex-1' : 'flex-1'}`}>
                    {modoEdicion && esAdmin && (
                        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2" style={{ minWidth: 340 }}>
                            <div className="bg-yellow-500/15 border border-yellow-500/30 text-yellow-400 text-xs px-4 py-2 rounded-xl flex items-center gap-3">
                                <span>Arrastrá las mesas para reposicionarlas</span>
                                <button onClick={() => { setMostrarFormMesa(true); setMsgMapa('') }}
                                    className="bg-yellow-500/20 hover:bg-yellow-500/35 border border-yellow-500/40 text-yellow-300 text-xs px-3 py-1 rounded-lg font-semibold transition">
                                    + Nueva
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
                        {[
                            { color: '#22c55e', bg: '#0f2a1a', label: 'Libre' },
                            { color: '#667EEA', bg: '#1a1230', label: 'Ocupada' },
                            { color: '#f59e0b', bg: '#2a1a0a', label: 'Pagando' },
                        ].map(({ color, bg, label }) => (
                            <div key={label} className="flex items-center gap-1.5 text-xs text-gray-400 bg-[#111318] border border-white/8 px-2.5 py-1.5 rounded-lg">
                                <span className="w-2.5 h-2.5 rounded-sm border" style={{ background: bg, borderColor: color }}/>
                                {label}
                            </div>
                        ))}
                    </div>

                    <div
                        ref={mapaRef}
                        className="w-full h-full relative select-none"
                        style={{ minHeight: '500px', background: 'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(255,255,255,0.018) 39px, rgba(255,255,255,0.018) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(255,255,255,0.018) 39px, rgba(255,255,255,0.018) 40px)' }}
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
                                    className="absolute"
                                    style={{
                                        left: mesa.pos_x || 0,
                                        top: mesa.pos_y || 0,
                                        width: 136,
                                        cursor: modoEdicion && esAdmin ? 'grab' : 'pointer',
                                        zIndex: isDraggingThis ? 50 : 1,
                                        transform: isDraggingThis ? 'scale(1.06)' : 'scale(1)',
                                        transition: isDraggingThis ? 'none' : 'transform 0.15s',
                                    }}
                                    onMouseDown={e => modoEdicion ? onMouseDown(e, mesa) : null}
                                    onTouchStart={e => modoEdicion ? onTouchStart(e, mesa) : null}
                                    onClick={() => !modoEdicion && abrirMesa(mesa)}
                                >
                                    <div className="rounded-2xl p-3 border-2 transition-all"
                                        style={{
                                            background: color.bg,
                                            borderColor: color.border,
                                            boxShadow: `0 0 22px ${color.border}30`,
                                        }}>
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
                                                    style={{ background: `${color.border}22`, color: color.text }}>
                                                    {color.badge}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs" style={{ color: color.text }}>👥 {mesa.capacidad}</span>
                                            {mesa.orden_id && (
                                                <span className="text-xs text-white font-bold">${Number(mesa.total || 0).toFixed(2)}</span>
                                            )}
                                        </div>
                                        {mesa.orden_id && (
                                            <div className="mt-1.5 text-xs" style={{ color: color.text }}>
                                                {mesa.total_items} ítem{mesa.total_items !== '1' ? 's' : ''}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* ══════════ PANEL LATERAL — ORDEN ══════════ */}
                {vista === 'orden' && mesaSeleccionada && (
                    <div className="w-full md:w-[400px] bg-[#0d0f14] md:border-l border-white/8 flex flex-col flex-shrink-0">

                        {/* Header */}
                        <div className="px-4 py-3 border-b border-white/8 flex justify-between items-center"
                            style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.08), rgba(118,75,162,0.04))' }}>
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-sm"
                                    style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
                                    {mesaSeleccionada.numero}
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm">Mesa {mesaSeleccionada.numero}</p>
                                    <p className="text-gray-500 text-xs">
                                        {mesaSeleccionada.capacidad} personas
                                        {ordenActiva && ` · #${ordenActiva.orden_id}`}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => { setVista('mapa'); setMesaSeleccionada(null); setOrdenActiva(null) }}
                                className="flex items-center gap-1.5 text-gray-400 hover:text-white transition text-sm bg-white/5 hover:bg-white/10 border border-white/8 rounded-xl px-3 py-1.5 md:w-9 md:h-9 md:p-0 md:justify-center">
                                <span className="md:hidden">← Mesas</span>
                                <span className="hidden md:inline text-base">✕</span>
                            </button>
                        </div>

                        {/* Toast mensaje */}
                        {msg && (
                            <div className={`mx-4 mt-3 px-4 py-2.5 rounded-xl text-xs font-medium border flex items-center gap-2 ${
                                msg.startsWith('✅') ? 'bg-green-500/10 border-green-500/25 text-green-400' :
                                msg.startsWith('❌') ? 'bg-red-500/10 border-red-500/25 text-red-400' :
                                'bg-[#667EEA]/10 border-[#667EEA]/25 text-[#a78bfa]'
                            }`}>
                                {msg}
                            </div>
                        )}

                        <div className="flex-1 overflow-y-auto">

                            {/* ── Sin orden: abrir mesa ── */}
                            {!ordenActiva && (
                                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                                    <div className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-5"
                                        style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.12), rgba(118,75,162,0.12))', border: '1px solid rgba(102,126,234,0.2)' }}>
                                        🪑
                                    </div>
                                    <p className="text-white font-bold text-lg mb-1">Mesa disponible</p>
                                    <p className="text-gray-500 text-sm mb-8">Abrí una orden para comenzar el pedido</p>
                                    <button onClick={crearOrden} disabled={cargando}
                                        className="w-full max-w-xs py-4 rounded-2xl text-white font-bold text-base transition disabled:opacity-50"
                                        style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)', boxShadow: '0 8px 24px rgba(102,126,234,0.35)' }}>
                                        {cargando ? 'Abriendo...' : '+ Abrir orden'}
                                    </button>
                                </div>
                            )}

                            {/* ── Con orden activa ── */}
                            {ordenActiva && (
                                <div className="p-4 space-y-4">

                                    {/* Estado badge */}
                                    {(() => {
                                        const e = estadoColor[ordenActiva.estado]
                                        return e ? (
                                            <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold ${e.bg}`}>
                                                <span className={`w-2 h-2 rounded-full ${e.dot}`}/>
                                                <span className={e.text}>{e.label}</span>
                                            </div>
                                        ) : null
                                    })()}

                                    {/* ══ BUSCADOR DE PRODUCTOS ══ */}
                                    {!['PorCobrar', 'Cerrada', 'Cancelada'].includes(ordenActiva.estado) && (
                                        <div className="bg-[#111318] border border-white/8 rounded-2xl overflow-hidden">
                                            <div className="px-4 pt-3 pb-2">
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Agregar al pedido</p>

                                                {/* Buscador */}
                                                <div className="relative mb-3">
                                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm select-none">🔍</span>
                                                    <input
                                                        placeholder="Buscar producto..."
                                                        value={busquedaProd}
                                                        onChange={e => { setBusquedaProd(e.target.value); setProdSel('') }}
                                                        className="w-full bg-[#1a1d24] border border-white/8 rounded-xl pl-9 pr-3 py-2.5 text-white text-sm outline-none placeholder-gray-600 transition"
                                                        style={{ fontSize: '16px' }}
                                                        onFocus={e => e.target.style.borderColor = '#667EEA'}
                                                        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                                    />
                                                </div>

                                                {/* Category tabs */}
                                                <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3" style={{ scrollbarWidth: 'none' }}>
                                                    {['Todos', ...categorias.map(c => c.nombre)].map(cat => (
                                                        <button key={cat}
                                                            onClick={() => { setFiltroCat(cat); setProdSel('') }}
                                                            className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition"
                                                            style={filtroCat === cat ? {
                                                                background: 'linear-gradient(135deg, rgba(102,126,234,0.2), rgba(118,75,162,0.2))',
                                                                borderColor: 'rgba(102,126,234,0.4)',
                                                                color: '#c4b5fd',
                                                            } : {
                                                                background: '#1a1d24',
                                                                borderColor: 'rgba(255,255,255,0.08)',
                                                                color: '#6B7280',
                                                            }}>
                                                            {cat !== 'Todos' && <span>{getCatIcon(cat)}</span>}
                                                            {cat}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Product grid */}
                                            <div className="grid grid-cols-3 gap-2 px-4 pb-3 max-h-48 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                                {productosFiltrados.length === 0 && (
                                                    <div className="col-span-3 text-center text-gray-600 text-xs py-6">Sin resultados</div>
                                                )}
                                                {productosFiltrados.map(p => {
                                                    const sel = String(prodSel) === String(p.producto_id)
                                                    return (
                                                        <button key={p.producto_id}
                                                            onClick={() => { setProdSel(sel ? '' : String(p.producto_id)); setCantidad(1); setObsProducto('') }}
                                                            className="text-left p-2.5 rounded-xl border transition-all active:scale-95"
                                                            style={sel ? {
                                                                background: 'linear-gradient(135deg, rgba(102,126,234,0.18), rgba(118,75,162,0.18))',
                                                                borderColor: 'rgba(102,126,234,0.5)',
                                                                boxShadow: '0 0 0 1px rgba(102,126,234,0.2)',
                                                            } : {
                                                                background: '#1a1d24',
                                                                borderColor: 'rgba(255,255,255,0.07)',
                                                            }}>
                                                            <div className="text-xl mb-1.5 leading-none">{getCatIcon(p.categoria)}</div>
                                                            <p className="text-white text-xs font-semibold leading-tight mb-1 line-clamp-2">{p.nombre}</p>
                                                            <p className="text-xs font-bold" style={{ color: sel ? '#c4b5fd' : '#6B7280' }}>
                                                                ${Number(p.precio).toFixed(2)}
                                                            </p>
                                                        </button>
                                                    )
                                                })}
                                            </div>

                                            {/* Selected product controls */}
                                            {prodSelObj && (
                                                <div className="mx-4 mb-4 p-3 rounded-xl border"
                                                    style={{ background: 'rgba(102,126,234,0.06)', borderColor: 'rgba(102,126,234,0.25)' }}>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <p className="text-white text-sm font-bold truncate flex-1 mr-2">{prodSelObj.nombre}</p>
                                                        <p className="text-[#c4b5fd] font-bold text-sm flex-shrink-0">
                                                            ${(Number(prodSelObj.precio) * cantidad).toFixed(2)}
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-2 mb-3">
                                                        {/* Qty stepper */}
                                                        <div className="flex items-center bg-[#1a1d24] border border-white/8 rounded-xl overflow-hidden flex-shrink-0">
                                                            <button onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                                                                className="w-10 h-10 text-white hover:bg-white/10 transition font-bold text-xl flex items-center justify-center">−</button>
                                                            <span className="w-9 text-center text-white font-bold text-sm">{cantidad}</span>
                                                            <button onClick={() => setCantidad(cantidad + 1)}
                                                                className="w-10 h-10 text-white hover:bg-white/10 transition font-bold text-xl flex items-center justify-center">+</button>
                                                        </div>
                                                        <input
                                                            placeholder="Observación (ej: sin cebolla)..."
                                                            value={obsProducto}
                                                            onChange={e => setObsProducto(e.target.value)}
                                                            className="flex-1 bg-[#1a1d24] border border-white/8 rounded-xl px-3 text-white text-xs outline-none placeholder-gray-600 transition"
                                                            style={{ fontSize: '16px' }}
                                                            onFocus={e => e.target.style.borderColor = '#667EEA'}
                                                            onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
                                                        />
                                                    </div>
                                                    <button onClick={agregarProducto} disabled={cargando}
                                                        className="w-full py-2.5 rounded-xl text-white text-sm font-bold transition disabled:opacity-50 active:scale-[0.98]"
                                                        style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)', boxShadow: '0 4px 14px rgba(102,126,234,0.3)' }}>
                                                        {cargando ? 'Agregando...' : `+ Agregar a la orden`}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* ══ PRODUCTOS EN LA ORDEN ══ */}
                                    <div>
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">
                                            En la orden · {ordenActiva.productos?.length || 0} ítem{ordenActiva.productos?.length !== 1 ? 's' : ''}
                                        </p>

                                        {ordenActiva.productos?.length === 0 ? (
                                            <div className="text-center py-6 text-gray-600 text-sm">
                                                Sin productos aún — elegí del menú
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                {ordenActiva.productos?.map(p => (
                                                    <div key={p.detalle_id}
                                                        className="flex items-center gap-3 bg-[#111318] border border-white/6 rounded-xl px-3 py-2.5 group">
                                                        <div className="w-7 h-7 rounded-lg bg-[#1a1d24] flex items-center justify-center text-sm flex-shrink-0">
                                                            {getCatIcon('')}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-white text-sm font-semibold truncate">{p.producto}</p>
                                                            {p.observacion && (
                                                                <p className="text-gray-500 text-xs truncate">📝 {p.observacion}</p>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-2 flex-shrink-0">
                                                            <div className="text-right">
                                                                <p className="text-xs text-gray-500">x{p.cantidad}</p>
                                                                <p className="text-sm font-bold" style={{ color: '#c4b5fd' }}>${Number(p.subtotal).toFixed(2)}</p>
                                                            </div>
                                                            {['Pendiente', 'EnCocina', 'Lista'].includes(ordenActiva.estado) && (
                                                                <button onClick={() => eliminarProducto(p.detalle_id)}
                                                                    className="w-7 h-7 bg-red-500/0 group-hover:bg-red-500/12 border border-red-500/0 group-hover:border-red-500/25 text-red-400/50 group-hover:text-red-400 rounded-lg flex items-center justify-center text-xs transition">
                                                                    ✕
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Total */}
                                        {ordenActiva.productos?.length > 0 && (
                                            <div className="mt-3 rounded-xl px-4 py-3 flex justify-between items-center"
                                                style={{ background: 'linear-gradient(135deg, rgba(102,126,234,0.1), rgba(118,75,162,0.1))', border: '1px solid rgba(102,126,234,0.2)' }}>
                                                <p className="text-gray-300 text-sm font-semibold">Total</p>
                                                <p className="text-2xl font-black" style={{ color: '#c4b5fd' }}>${Number(ordenActiva.total).toFixed(2)}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ══ FOOTER — ACCIONES ══ */}
                        {ordenActiva && (
                            <div className="p-4 border-t border-white/8 space-y-2" style={{ background: '#0d0f14' }}>
                                {ordenActiva.estado === 'PorCobrar' ? (
                                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
                                        <p className="text-amber-400 text-sm font-bold mb-1">⏳ Cuenta enviada a caja</p>
                                        <p className="text-gray-500 text-xs mb-3">El cajero está procesando el pago</p>
                                        <button
                                            onClick={() => generarTicketPDF(
                                                { orden_id: ordenActiva.orden_id, nro_mesa: ordenActiva.nro_mesa ?? mesaSeleccionada.numero, mesero: ordenActiva.mesero ?? usuario.nombre_completo, total: ordenActiva.total },
                                                ordenActiva.productos || []
                                            )}
                                            className="w-full text-xs text-amber-400 border border-amber-500/25 py-2 rounded-xl hover:bg-amber-500/10 transition">
                                            🧾 Reimprimir pre-cuenta
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => generarTicketPDF(
                                                    { orden_id: ordenActiva.orden_id, nro_mesa: ordenActiva.nro_mesa ?? mesaSeleccionada.numero, mesero: ordenActiva.mesero ?? usuario.nombre_completo, total: ordenActiva.total },
                                                    ordenActiva.productos || []
                                                )}
                                                disabled={!ordenActiva.productos?.length}
                                                className="py-3 rounded-xl text-sm font-semibold transition disabled:opacity-40 border"
                                                style={{ background: 'rgba(102,126,234,0.08)', borderColor: 'rgba(102,126,234,0.2)', color: '#a78bfa' }}>
                                                🧾 Pre-cuenta
                                            </button>
                                            <button
                                                onClick={enviarACobro}
                                                disabled={cargando || !ordenActiva.productos?.length}
                                                className="py-3 rounded-xl text-white text-sm font-bold transition disabled:opacity-40 active:scale-[0.98]"
                                                style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 4px 14px rgba(34,197,94,0.3)' }}>
                                                {cargando ? 'Enviando...' : '💰 Enviar a cobro'}
                                            </button>
                                        </div>
                                        {!['Cerrada', 'Cancelada'].includes(ordenActiva.estado) && (
                                            <button onClick={desocuparMesa} disabled={cargando}
                                                className="w-full text-xs text-red-400/70 hover:text-red-400 border border-red-500/15 hover:border-red-500/35 hover:bg-red-500/6 py-2.5 rounded-xl transition">
                                                🗑 Cancelar orden y desocupar mesa
                                            </button>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal nueva mesa */}
            {mostrarFormMesa && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
                    onClick={() => setMostrarFormMesa(false)}>
                    <div className="bg-[#111318] border border-white/10 rounded-2xl w-full max-w-xs p-6"
                        onClick={e => e.stopPropagation()}>
                        <p className="text-white font-bold mb-1">Nueva mesa</p>
                        <p className="text-gray-500 text-xs mb-5">Ingresá el número y capacidad</p>
                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Número de mesa</label>
                                <input type="number" min="1" placeholder="Ej: 7"
                                    value={formMesa.numero}
                                    onChange={e => setFormMesa({ ...formMesa, numero: e.target.value })}
                                    className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#667EEA] transition"
                                    style={{ fontSize: '16px' }}/>
                            </div>
                            <div>
                                <label className="text-gray-400 text-xs mb-1.5 block font-medium">Capacidad (personas)</label>
                                <input type="number" min="1" max="20"
                                    value={formMesa.capacidad}
                                    onChange={e => setFormMesa({ ...formMesa, capacidad: e.target.value })}
                                    className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2.5 text-white text-sm outline-none focus:border-[#667EEA] transition"
                                    style={{ fontSize: '16px' }}/>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setMostrarFormMesa(false)}
                                className="flex-1 text-gray-400 border border-white/8 rounded-xl py-2.5 text-sm hover:text-white transition">
                                Cancelar
                            </button>
                            <button onClick={nuevaMesa}
                                className="flex-1 text-white rounded-xl py-2.5 text-sm font-bold transition"
                                style={{ background: 'linear-gradient(135deg, #667EEA, #764BA2)' }}>
                                Crear mesa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
