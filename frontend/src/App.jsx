import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Mesas from './pages/Mesas'

function PrivateRoute({ children, roles }) {
    const token   = localStorage.getItem('token')
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

    if (!token) return <Navigate to="/login" />
    if (roles && !roles.includes(usuario.rol)) return <Navigate to="/sin-acceso" />
    return children
}

function RutaInicio() {
    const token   = localStorage.getItem('token')
    const usuario = JSON.parse(localStorage.getItem('usuario') || '{}')

    if (!token) return <Navigate to="/login" />

    if (usuario.rol === 'Administrador' || usuario.rol === 'Cajero')
        return <Navigate to="/dashboard" />

    return <Navigate to="/mesas" />
}

function SinAcceso() {
    const navigate = useNavigate()
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-center">
                <p className="text-4xl mb-4">🚫</p>
                <p className="text-white text-lg font-semibold mb-2">Sin acceso</p>
                <p className="text-gray-500 text-sm mb-6">No tenés permisos para ver esta página</p>
                <button onClick={() => navigate(-1)}
                    className="bg-blue-500 text-white px-4 py-2 rounded-xl text-sm">
                    Volver
                </button>
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
                    <PrivateRoute roles={['Administrador', 'Mesero', 'Cocina']}>
                        <Mesas />
                    </PrivateRoute>
                } />
            </Routes>
        </BrowserRouter>
    )
}

export default App