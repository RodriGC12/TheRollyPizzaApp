import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Mesas from './pages/Mesas'
import Cocina from './pages/Cocina'

function rolNorm(rol) { return (rol || '').toLowerCase() }

function PrivateRoute({ children, roles }) {
    const token   = localStorage.getItem('token')
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

    if (!token) return <Navigate to="/login" />
    if (roles && !roles.some(r => rolNorm(r) === rolNorm(usuario.rol)))
        return <Navigate to="/sin-acceso" />
    return children
}

function RutaInicio() {
    const token   = localStorage.getItem('token')
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

    if (!token) return <Navigate to="/login" />

    const rol = rolNorm(usuario.rol)
    if (rol === 'administrador' || rol === 'cajero') return <Navigate to="/dashboard" />
    if (rol === 'cocina')                            return <Navigate to="/cocina" />
    return <Navigate to="/mesas" />
}

function SinAcceso() {
    const navigate = useNavigate()
    const usuario  = JSON.parse(localStorage.getItem('usuario') || '{}')
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-center">
                <p className="text-4xl mb-4">🚫</p>
                <p className="text-white text-lg font-semibold mb-2">Sin acceso</p>
                <p className="text-gray-500 text-sm mb-2">No tenés permisos para ver esta página</p>
                {usuario.rol && (
                    <p className="text-gray-600 text-xs mb-4">Tu rol actual: <span className="text-orange-400 font-mono">{usuario.rol}</span></p>
                )}
                <div className="flex gap-3 justify-center">
                    <button onClick={() => navigate(-1)}
                        className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm">
                        Volver
                    </button>
                    <button onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('usuario'); navigate('/login') }}
                        className="bg-gray-700 text-white px-4 py-2 rounded-xl text-sm">
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </div>
    )
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/"            element={<RutaInicio />} />
                <Route path="/login"       element={<Login />} />
                <Route path="/sin-acceso"  element={<SinAcceso />} />
                <Route path="/dashboard"   element={
                    <PrivateRoute roles={['Administrador', 'Cajero']}>
                        <Dashboard />
                    </PrivateRoute>
                } />
                <Route path="/mesas"       element={
                    <PrivateRoute roles={['Administrador', 'Mesero']}>
                        <Mesas />
                    </PrivateRoute>
                } />
                <Route path="/cocina"      element={
                    <PrivateRoute roles={['Administrador', 'Cocina']}>
                        <Cocina />
                    </PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}

export default App