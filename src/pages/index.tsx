import { useRouter } from 'next/router'
import Head from 'next/head'
import { useEffect, useState } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'

export default function Home() {
  const router = useRouter()
  const supabase = useSupabaseClient()
  const [currentDate, setCurrentDate] = useState('')

  useEffect(() => {
    // Verificar si el usuario está autenticado
    const checkUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) {
        console.error('Error getting user:', error.message)
        return
      }
      
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.error('Error getting profile:', profileError.message)
          return
        }

        if (profile?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/employee')
        }
      }
    }

    // Obtener la fecha actual en formato español
    const today = new Date()
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }
    setCurrentDate(today.toLocaleDateString('es-ES', options))

    checkUser()
  }, [router, supabase])

  const handleAttendanceClick = () => {
    router.push('/login')  // Redirige al login si no está autenticado
  }

  return (
    <>
      <Head>
        <title>Sistema de Asistencia</title>
        <meta name="description" content="Sistema de control de asistencia" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-amber-50 to-amber-100 p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Espacio para la imagen */}
          <div className="w-full h-64 bg-amber-200 flex items-center justify-center">
            <img 
              src="alenort.png" 
              alt="Control de Asistencia" 
              className="max-h-full object-cover"
            />
          </div>
          
          {/* Fecha actual */}
          <div className="p-6 text-center">
            <h2 className="text-2xl font-semibold text-amber-900 mb-4">
              {currentDate}
            </h2>
            
            {/* Botón de registro de asistencia */}
            <button
              onClick={handleAttendanceClick}
              className="w-full py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg 
                       font-semibold text-lg transition-all duration-200 transform hover:scale-105
                       shadow-md hover:shadow-lg"
            >
              Registrar mi asistencia del día de hoy
            </button>
          </div>
        </div>
      </main>
    </>
  )
}