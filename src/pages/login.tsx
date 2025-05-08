import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import { PostgrestError } from '@supabase/supabase-js'

type User = {
  id: string
  nombre: string
  dni?: string
}

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [error, setError] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [newEmployeeData, setNewEmployeeData] = useState({
    dni: '',
    contraseña: '',
    nombre: ''
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
          .select('id, nombre, dni')
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

  const handleAdminPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAdminPassword(e.target.value)
  }

  const handleToggleAdminMode = () => {
    if (adminPassword === 'nico44373') {
      setIsAdminMode(true)
    } else {
      setError('Contraseña incorrecta')
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const { dni, contraseña, nombre } = newEmployeeData
      const { error } = await supabase
        .from('usuarios')
        .insert([{ dni, contraseña, nombre }]) // Supabase generará el UUID automáticamente

      if (error) {
        setError('Error al agregar el empleado')
        return
      }

      setError('')
      alert('Empleado agregado correctamente')

      // Limpiar el formulario
      setNewEmployeeData({ dni: '', contraseña: '', nombre: '',  })

      // Cerrar el formulario y volver al login
      setIsAdminMode(false)
      setAdminPassword('')


      // Redirigir a la página de login
      router.push('/login')
    } catch {
      setError('Error al agregar el empleado')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
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
            <label className="block text-sm font-medium text-gray-700">
              DNI o Nombre
            </label>
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
            <label className="block text-sm font-medium text-gray-700">
              Contraseña
            </label>
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
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Iniciar Sesión
          </button>
        </form>

        {/* Botón para activar el modo de administración */}
        <div className="mt-4">
          <input
            type="password"
            value={adminPassword}
            onChange={handleAdminPasswordChange}
            className="block w-full border border-gray-300 rounded-md shadow-sm p-2"
            placeholder="Ingrese la contraseña de administrador"
          />
          <button
            onClick={handleToggleAdminMode}
            className="mt-2 w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Activar Agregar Empleado
          </button>
        </div>

        {/* Formulario para agregar empleado */}
        {isAdminMode && (
          <form onSubmit={handleAddEmployee} className="mt-6 space-y-6">
            <h3 className="text-lg font-medium text-gray-700">Agregar Empleado</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700">DNI</label>
              <input
                type="text"
                value={newEmployeeData.dni}
                onChange={(e) => setNewEmployeeData({ ...newEmployeeData, dni: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="DNI del empleado"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                value={newEmployeeData.contraseña}
                onChange={(e) => setNewEmployeeData({ ...newEmployeeData, contraseña: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Contraseña del empleado"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                type="text"
                value={newEmployeeData.nombre}
                onChange={(e) => setNewEmployeeData({ ...newEmployeeData, nombre: e.target.value })}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                placeholder="Nombre del empleado"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Agregar Empleado
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
