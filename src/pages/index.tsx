import { useRouter } from 'next/router'
import Head from 'next/head'
import { useEffect } from 'react'
import { useSupabaseClient } from '@supabase/auth-helpers-react'
import { Clock, Users, Shield } from 'lucide-react'


export default function Home() {
  const router = useRouter()
  const supabase = useSupabaseClient()

  useEffect(() => {
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

    checkUser()
  }, [router, supabase])

  return (
    <>
      <Head>
        <title>Sistema de Asistencia</title>
        <meta name="description" content="Sistema de control de asistencia" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
        {/* Hero Section */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center opacity-5" />
          
          <div className="relative max-w-7xl mx-auto py-24 px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-5xl font-bold text-amber-900 sm:text-6xl md:text-7xl mb-8">
                Control de Asistencia
                <span className="block text-amber-600 mt-2">Simplificado</span>
              </h1>
              <p className="mt-3 max-w-md mx-auto text-lg text-amber-700 sm:text-xl md:mt-5 md:max-w-3xl">
                Bienvenido a tu nuevo sistema de control de asistencia. 
                Gestión eficiente y moderna para tu empresa.
              </p>
              
              <div className="mt-10">
                <button
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-white rounded-full 
                           font-semibold text-lg transition-all duration-200 transform hover:scale-105
                           shadow-lg hover:shadow-xl"
                >
                  Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="group">
              <div className="h-full bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-200
                            border border-amber-100 hover:border-amber-200">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center
                              group-hover:bg-amber-200 transition-colors duration-200">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-amber-900">
                  Registro Instantáneo
                </h3>
                <p className="mt-4 text-amber-700">
                  Marca tu entrada y salida con un solo clic. Sistema intuitivo diseñado 
                  para la máxima eficiencia.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="h-full bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-200
                            border border-amber-100 hover:border-amber-200">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center
                              group-hover:bg-amber-200 transition-colors duration-200">
                  <Users className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-amber-900">
                  Gestión Avanzada
                </h3>
                <p className="mt-4 text-amber-700">
                  Panel administrativo completo con reportes detallados y seguimiento 
                  en tiempo real.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="h-full bg-white rounded-2xl p-8 shadow-sm hover:shadow-xl transition-all duration-200
                            border border-amber-100 hover:border-amber-200">
                <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center
                              group-hover:bg-amber-200 transition-colors duration-200">
                  <Shield className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="mt-6 text-xl font-semibold text-amber-900">
                  Seguridad Garantizada
                </h3>
                <p className="mt-4 text-amber-700">
                  Acceso protegido y encriptado para cada usuario. Tus datos 
                  siempre seguros.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
