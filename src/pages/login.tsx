import { useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import "@/styles/globals.css"

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [contraseña, setContraseña] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Primero intentamos login como usuario (por DNI)
      let { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre, dni')
        .eq('dni', identifier)
        .eq('contraseña', contraseña)
        .single()

      if (userError || !userData) {
        // Si no es usuario, intentamos login como admin (por nombre)
        const { data: adminData, error: adminError } = await supabase
          .from('admin')
          .select('id, nombre')
          .eq('nombre', identifier)
          .eq('contraseña', contraseña)
          .single()

        if (adminError || !adminData) {
          setError('Credenciales incorrectas')
          return
        }

        // Login exitoso como admin
        sessionStorage.setItem('userId', adminData.id)
        sessionStorage.setItem('nombre', adminData.nombre)
        sessionStorage.setItem('userType', 'admin')
        router.push('/admin')
        return
      }

      // Login exitoso como usuario
      sessionStorage.setItem('userId', userData.id)
      sessionStorage.setItem('nombre', userData.nombre)
      sessionStorage.setItem('dni', userData.dni)
      sessionStorage.setItem('userType', 'empleado')
      router.push('/employee')

    } catch (error) {
      console.error('Error de login:', error)
      setError('Error al iniciar sesión')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div className="text-center">
          <h2 className="text-3xl font-bold">Iniciar Sesión</h2>
          <p className="mt-2 text-sm text-gray-600">
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
      </div>
    </div>
  )
}