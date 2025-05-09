import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import { PostgrestError } from '@supabase/supabase-js'

type User = {
  id: string
  nombre: string
  dni?: string
  sucursal?: string
}

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [error, setError] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [showAdminPasswordInput, setShowAdminPasswordInput] = useState(false)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [newEmployeeData, setNewEmployeeData] = useState({
    dni: '',
    contraseña: '',
    nombre: '',
    sucursal: 'jbj' // Valor por defecto
  })

  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      let data: User | null = null
      let error: PostgrestError | null = null

      if (!isNaN(Number(identifier))) {
        const response = await supabase
          .from('usuarios')
          .select('id, nombre, dni, sucursal')
          .eq('dni', identifier)
          .eq('contraseña', contraseña)
          .single()
        data = response.data
        error = response.error
      } else {
        const response = await supabase
          .from('administrador')
          .select('id, nombre')
          .eq('usuario', identifier)
          .eq('password', contraseña)
          .single()
        data = response.data
        error = response.error
      }

      if (error || !data) {
        setError('Credenciales incorrectas')
        return
      }

      if (data.dni) {
        sessionStorage.setItem('userId', data.id)
        sessionStorage.setItem('nombre', data.nombre)
        sessionStorage.setItem('dni', data.dni)
        sessionStorage.setItem('sucursal', data.sucursal || '')
        sessionStorage.setItem('userType', 'empleado')
        router.push('/employee')
      } else {
        sessionStorage.setItem('userId', data.id)
        sessionStorage.setItem('nombre', data.nombre)
        sessionStorage.setItem('userType', 'admin')
        router.push('/admin')
      }
    } catch (error) {
      console.error('Error de login:', error)
      setError('Error al iniciar sesión')
    }
  }

  const handleAdminPasswordCheck = () => {
    if (adminPassword === 'nico44373') {
      setIsAdminMode(true)
      setError('')
    } else {
      setError('Contraseña incorrecta')
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const { dni, contraseña, nombre, sucursal } = newEmployeeData
      const { error } = await supabase
        .from('usuarios')
        .insert([{ dni, contraseña, nombre, sucursal }])

      if (error) {
        setError('Error al agregar el empleado')
        return
      }

      alert('Empleado agregado correctamente')
      setNewEmployeeData({ dni: '', contraseña: '', nombre: '', sucursal: 'jbj' })
      setAdminPassword('')
      setIsAdminMode(false)
      setShowAdminPasswordInput(false)
      router.push('/login')
    } catch {
      setError('Error al agregar el empleado')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 relative">
      {/* Configuración arriba a la derecha */}
      <div className="absolute top-4 right-4">
        <button
          onClick={() => setShowAdminPasswordInput(!showAdminPasswordInput)}
          className="text-gray-600 text-2xl hover:text-gray-800"
          title="Configuración"
        >
          ⚙️
        </button>

        {showAdminPasswordInput && !isAdminMode && (
          <div className="mt-2 bg-white border rounded shadow p-4 w-64">
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md p-2 mb-2"
              placeholder="Contraseña admin"
            />
            <button
              onClick={handleAdminPasswordCheck}
              className="w-full bg-green-600 text-white py-1 rounded hover:bg-green-700"
            >
              Acceder
            </button>
          </div>
        )}

        {isAdminMode && (
          <form onSubmit={handleAddEmployee} className="mt-2 bg-white border rounded shadow p-4 w-64 space-y-3">
            <h3 className="text-md font-semibold text-gray-700">Agregar Empleado</h3>
            <input
              type="text"
              placeholder="DNI"
              required
              value={newEmployeeData.dni}
              onChange={(e) => setNewEmployeeData({ ...newEmployeeData, dni: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2"
            />
            <input
              type="password"
              placeholder="Contraseña"
              required
              value={newEmployeeData.contraseña}
              onChange={(e) => setNewEmployeeData({ ...newEmployeeData, contraseña: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2"
            />
            <input
              type="text"
              placeholder="Nombre"
              required
              value={newEmployeeData.nombre}
              onChange={(e) => setNewEmployeeData({ ...newEmployeeData, nombre: e.target.value })}
              className="w-full border border-gray-300 rounded-md p-2"
            />
            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 mb-1">Sucursal</label>
              <select
                value={newEmployeeData.sucursal}
                onChange={(e) => setNewEmployeeData({ ...newEmployeeData, sucursal: e.target.value })}
                className="w-full border border-gray-300 rounded-md p-2"
              >
                <option value="jbj">JBJ</option>
                <option value="juramento">Juramento</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
            >
              Agregar
            </button>
          </form>
        )}
      </div>

      {/* Formulario principal de login */}
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl text-gray-700 font-bold">Iniciar Sesión</h2>
          <p className="mt-2 text-sm text-gray-700">
            Empleados: usar DNI | Administradores: usar nombre
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-500 p-3 rounded-md text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">DNI o Nombre</label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Ingrese DNI (empleado) o nombre (admin)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Contraseña</label>
            <input
              type="password"
              required
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              placeholder="Ingrese su contraseña"
            />
          </div>
          <button
            type="submit"
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Iniciar Sesión
          </button>
        </form>
      </div>
    </div>
  )
}