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
      // Intentamos login tanto para usuarios como para administradores con un solo query utilizando 'or' en la condición
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nombre, dni')
        .or(`dni.eq.${identifier},nombre.eq.${identifier}`)
        .eq('contraseña', contraseña)
        .single()

      if (error || !data) {
        setError('Credenciales incorrectas')
        return
      }

      // Determinamos el tipo de usuario (empleado o admin) según el campo 'dni'
      if (data.dni) {
        // Login exitoso como usuario (empleado)
        sessionStorage.setItem('userId', data.id)
        sessionStorage.setItem('nombre', data.nombre)
        sessionStorage.setItem('dni', data.dni)
        sessionStorage.setItem('userType', 'empleado')
        router.push('/employee')
      } else {
        // Login exitoso como admin (sin DNI)
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
