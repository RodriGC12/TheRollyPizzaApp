import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { generarFacturaPDF } from '../utils/factura'

const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

export default function Caja() {
    const [caja, setCaja]           = useState(null)
    const [ventas, setVentas]       = useState({ total_ventas: 0, total_ordenes: 0 })
    const [porCobrar, setPorCobrar] = useState([])
    const [historial, setHistorial] = useState([])
    const [montoApertura, setMontoApertura] = useState('')
    const [montoCierre, setMontoCierre]     = useState('')
    const [observaciones, setObservaciones] = useState('')
    const [pinReabrir, setPinReabrir]       = useState('')
    const [mostrarReabrir, setMostrarReabrir] = useState(false)
    const [msg, setMsg]             = useState({ texto: '', tipo: '' })
    const [cargando, setCargando]   = useState(false)
    const [pagoModal, setPagoModal]       = useState(null)
    const [metodoPago, setMetodoPago]     = useState('')
    const [montoRecibido, setMontoRecibido] = useState('')
    const navigate = useNavigate()

    const cargar = useCallback(async () => {
        try {
            const [c, h] = await Promise.all([
                api.get('/caja'),
                api.get('/caja/historial')
            ])
            setCaja(c.data.caja)
            setVentas(c.data.ventas || { total_ventas: 0, total_ordenes: 0 })
            setPorCobrar(c.data.porCobrar || [])
            setHistorial(h.data)
        } catch (err) {
            console.error(err)
        }
    }, [])

    useEffect(() => {
        cargar()
        const interval = setInterval(cargar, 15000)
        return () => clearInterval(interval)
    }, [cargar])

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
            mostrarMsg('Caja abierta correctamente', 'ok')
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error abriendo caja', 'err')
        } finally {
            setCargando(false)
        }
    }

    const cerrarCaja = async () => {
        if (!montoCierre) return
        if (!confirm('¿Confirmar cierre de caja?')) return
        setCargando(true)
        try {
            await api.post('/caja/cerrar', {
                monto_fisico_contado: parseFloat(montoCierre),
                observaciones
            })
            setMontoCierre('')
            setObservaciones('')
            mostrarMsg('Caja cerrada correctamente', 'ok')
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error cerrando caja', 'err')
        } finally {
            setCargando(false)
        }
    }

    const reabrirCaja = async () => {
        setCargando(true)
        try {
            await api.post('/caja/reabrir', { pin: pinReabrir })
            setPinReabrir('')
            setMostrarReabrir(false)
            mostrarMsg('Caja reabierta correctamente', 'ok')
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'PIN incorrecto', 'err')
        } finally {
            setCargando(false)
        }
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
            mostrarMsg(`Cobro registrado — Mesa ${pagoModal.nro_mesa} · $${Number(pagoModal.total).toFixed(2)}`, 'ok')
            cerrarPagoModal()
            cargar()
        } catch (err) {
            mostrarMsg(err.response?.data?.error || 'Error registrando cobro', 'err')
        } finally {
            setCargando(false)
        }
    }

    const generarFactura = async (orden) => {
        const res = await api.get(`/ordenes/${orden.orden_id}`)
        generarFacturaPDF(orden, res.data.productos)
    }

    const cerrarSesion = () => {
        localStorage.removeItem('token')
        localStorage.removeItem('usuario')
        navigate('/login')
    }

    const totalVentas  = Number(ventas.total_ventas || 0)
    const cajaAbierta  = caja?.estado === 'Abierta'
    const cajaCerrada  = caja?.estado === 'Cerrada'
    const diferencia   = montoCierre ? parseFloat(montoCierre) - totalVentas : null

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col">

            {/* TOPBAR */}
            <div className="bg-[#111318] border-b border-white/8 px-4 md:px-6 py-3 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center text-base">
                        💰
                    </div>
                    <div>
                        <p className="text-white text-sm font-bold">Caja · Paris Rolly Pizza</p>
                        <p className="text-gray-500 text-xs">{usuario.nombre_completo}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Estado caja */}
                    <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border ${
                        cajaAbierta
                            ? 'text-green-400 bg-green-500/10 border-green-500/20'
                            : cajaCerrada
                                ? 'text-red-400 bg-red-500/10 border-red-500/20'
                                : 'text-gray-400 bg-white/5 border-white/10'
                    }`}>
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cajaAbierta ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}/>
                        <span className="hidden sm:inline">{cajaAbierta ? 'Abierta' : cajaCerrada ? 'Cerrada' : 'Sin caja'}</span>
                    </div>

                    {/* Ventas del día */}
                    <div className="hidden md:flex items-center gap-1.5 text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-lg font-semibold">
                        ${totalVentas.toFixed(2)} hoy
                    </div>

                    {/* Pendientes */}
                    {porCobrar.length > 0 && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-2.5 py-1.5 rounded-lg">
                            <span className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse flex-shrink-0"/>
                            <span>{porCobrar.length}</span>
                            <span className="hidden sm:inline">por cobrar</span>
                        </div>
                    )}

                    <button onClick={cerrarSesion}
                        className="text-xs text-gray-500 hover:text-red-400 border border-white/8 hover:border-red-500/30 px-2.5 py-1.5 rounded-lg transition">
                        <span className="hidden sm:inline">Cerrar sesión</span>
                        <span className="sm:hidden">✕</span>
                    </button>
                </div>
            </div>

            {/* MENSAJE GLOBAL */}
            {msg.texto && (
                <div className={`mx-4 md:mx-6 mt-4 text-sm px-4 py-3 rounded-xl border ${
                    msg.tipo === 'ok'
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                }`}>
                    {msg.tipo === 'ok' ? '✅ ' : '❌ '}{msg.texto}
                </div>
            )}

            <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5">

                {/* ── CUENTAS PENDIENTES ── */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-white text-sm font-bold uppercase tracking-wide">Cuentas por cobrar</h2>
                        <span className="text-gray-500 text-xs">Actualización automática cada 15 seg</span>
                    </div>

                    {porCobrar.length === 0 ? (
                        <div className="bg-[#111318] border border-white/8 rounded-2xl p-8 flex flex-col items-center text-center">
                            <div className="w-14 h-14 bg-green-500/10 border border-green-500/20 rounded-2xl flex items-center justify-center text-3xl mb-3">
                                ✅
                            </div>
                            <p className="text-white font-semibold mb-1">Sin cuentas pendientes</p>
                            <p className="text-gray-500 text-xs">Cuando un mesero envíe una cuenta a cobro aparecerá aquí</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {porCobrar.map(o => (
                                <div key={o.orden_id}
                                    className="bg-[#111318] border-2 border-yellow-500/35 rounded-2xl overflow-hidden flex flex-col">
                                    <div className="bg-yellow-500/8 px-4 py-3 border-b border-white/8 flex justify-between items-center">
                                        <div>
                                            <p className="text-white font-bold text-lg">Mesa {o.nro_mesa}</p>
                                            <p className="text-gray-500 text-xs">{o.mesero} · Orden #{o.orden_id}</p>
                                        </div>
                                        <span className="text-yellow-400 text-xs font-semibold bg-yellow-500/15 border border-yellow-500/30 px-2 py-1 rounded-lg">
                                            Por cobrar
                                        </span>
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col justify-between gap-3">
                                        <p className="text-yellow-400 text-3xl font-bold">${Number(o.total).toFixed(2)}</p>
                                        <button
                                            onClick={() => abrirPagoModal(o)}
                                            disabled={cargando}
                                            className="w-full bg-green-500 hover:bg-green-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition text-sm tracking-wide">
                                            💰 Cobrar y generar factura
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* ── RESUMEN + CONTROLES ── */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-4">

                    {/* Ventas del día */}
                    <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Ventas del día</p>
                        <p className="text-green-400 text-3xl font-bold">${totalVentas.toFixed(2)}</p>
                        <p className="text-gray-500 text-xs mt-1">{ventas.total_ordenes || 0} órdenes cerradas</p>
                        {ventas.total_ordenes > 0 && (
                            <p className="text-blue-400 text-xs mt-1">
                                Ticket promedio: ${(totalVentas / ventas.total_ordenes).toFixed(2)}
                            </p>
                        )}
                    </div>

                    {/* Apertura / estado caja */}
                    <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Caja</p>
                        {!caja && (
                            <div>
                                <p className="text-gray-400 text-sm mb-3">No hay caja abierta hoy</p>
                                <div className="flex gap-2">
                                    <input type="number" placeholder="Monto inicial..." value={montoApertura}
                                        onChange={e => setMontoApertura(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && abrirCaja()}
                                        className="flex-1 bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-green-500"/>
                                    <button onClick={abrirCaja} disabled={cargando || !montoApertura}
                                        className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
                                        Abrir
                                    </button>
                                </div>
                            </div>
                        )}
                        {cajaAbierta && (
                            <div>
                                <p className="text-blue-400 text-2xl font-bold mb-0.5">
                                    ${Number(caja.monto_apertura).toFixed(2)}
                                </p>
                                <p className="text-gray-500 text-xs">
                                    Apertura · {new Date(caja.hora_apertura).toLocaleTimeString('es-SV', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>
                        )}
                        {cajaCerrada && (
                            <div>
                                <p className="text-gray-400 text-sm mb-3">Caja cerrada hoy</p>
                                {!mostrarReabrir ? (
                                    <button onClick={() => setMostrarReabrir(true)}
                                        className="w-full border border-dashed border-white/15 text-gray-500 hover:text-yellow-400 hover:border-yellow-500/30 text-xs py-2 rounded-xl transition">
                                        Reabrir caja
                                    </button>
                                ) : (
                                    <div className="space-y-2">
                                        <input type="password" placeholder="PIN de autorización..."
                                            value={pinReabrir} onChange={e => setPinReabrir(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && reabrirCaja()}
                                            className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-yellow-500"/>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setMostrarReabrir(false); setPinReabrir('') }}
                                                className="flex-1 text-gray-400 border border-white/8 rounded-xl text-xs py-2 hover:text-white transition">
                                                Cancelar
                                            </button>
                                            <button onClick={reabrirCaja} disabled={cargando}
                                                className="flex-1 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs py-2 rounded-xl font-semibold hover:bg-yellow-500/20 transition">
                                                Confirmar
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Cierre de caja */}
                    <div className="bg-[#111318] border border-white/8 rounded-2xl p-5">
                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-3">Cierre de caja</p>
                        {cajaAbierta ? (
                            <div className="space-y-2">
                                <input type="number" placeholder="Efectivo contado..." value={montoCierre}
                                    onChange={e => setMontoCierre(e.target.value)}
                                    className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
                                {diferencia !== null && (
                                    <p className={`text-xs font-semibold px-2 py-1.5 rounded-lg ${diferencia >= 0 ? 'text-green-400 bg-green-500/10' : 'text-red-400 bg-red-500/10'}`}>
                                        {diferencia >= 0 ? `Sobrante: +$${diferencia.toFixed(2)}` : `Faltante: -$${Math.abs(diferencia).toFixed(2)}`}
                                    </p>
                                )}
                                <input placeholder="Observaciones (opcional)" value={observaciones}
                                    onChange={e => setObservaciones(e.target.value)}
                                    className="w-full bg-[#1a1d24] border border-white/8 rounded-xl px-3 py-2 text-white text-sm outline-none focus:border-blue-500"/>
                                <button onClick={cerrarCaja} disabled={cargando || !montoCierre}
                                    className="w-full bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white text-sm font-semibold py-2.5 rounded-xl transition">
                                    Cerrar caja del día
                                </button>
                            </div>
                        ) : (
                            <p className="text-gray-600 text-sm">
                                {cajaCerrada ? 'Caja ya cerrada hoy' : 'Abre la caja primero'}
                            </p>
                        )}
                    </div>
                </section>

                {/* ── ÓRDENES CERRADAS HOY ── */}
                <section>
                    <h2 className="text-white text-sm font-bold uppercase tracking-wide mb-3">Órdenes cerradas hoy</h2>
                    <div className="bg-[#111318] border border-white/8 rounded-2xl overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide">#</th>
                                        <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide">Mesa</th>
                                        <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide hidden md:table-cell">Mesero</th>
                                        <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide">Hora</th>
                                        <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide">Total</th>
                                        <th className="text-left text-xs text-gray-500 font-medium px-5 py-3 uppercase tracking-wide">Factura</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {historial.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="text-center text-gray-500 text-sm py-10">
                                                No hay órdenes cerradas hoy
                                            </td>
                                        </tr>
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
                        {historial.length > 0 && (
                            <div className="px-5 py-3 border-t border-white/5 flex justify-between items-center">
                                <span className="text-gray-500 text-xs">{historial.length} órdenes</span>
                                <span className="text-green-400 font-bold text-sm">
                                    Total: ${historial.reduce((a, o) => a + Number(o.total), 0).toFixed(2)}
                                </span>
                            </div>
                        )}
                    </div>
                </section>
            </div>

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
