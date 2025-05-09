import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '../lib/supabaseClient';

export default function Employee() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [nombre, setNombre] = useState<string>('');
  const [userId, setUserId] = useState<string | null>(null);
  const [sucursal, setSucursal] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [, setAuthError] = useState<string>('');
  const [turno, setTurno] = useState<string>('');
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      setAuthError('');

      const storedUserId = sessionStorage.getItem('userId');
      const storedNombre = sessionStorage.getItem('nombre');
      const storedSucursal = sessionStorage.getItem('sucursal');
      const userType = sessionStorage.getItem('userType');

      if (!storedUserId || !storedNombre || userType !== 'empleado') {
        setAuthError('No se encontró una sesión válida. Redirigiendo a login...');
        router.push('/login');
        return;
      }

      setNombre(storedNombre);
      setUserId(storedUserId);
      setSucursal(storedSucursal || '');
      
      // Si es de Juramento, establecer automáticamente el turno mañana
      if (storedSucursal === 'juramento') {
        setTurno('mañana');
      }
      
      setLoading(false);
    };

    fetchUser();

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const verificarHorarioPermitido = (turnoSeleccionado: string): boolean => {
    const now = new Date();
    const hora = now.getHours();
    const minutos = now.getMinutes();
    
    if (turnoSeleccionado === 'mañana') {
      // Para el turno mañana, sólo permitir hasta las 9:00 AM
      return (hora < 9) || (hora === 9 && minutos === 0);
    } else if (turnoSeleccionado === 'tarde') {
      // Para el turno tarde, sólo permitir hasta las 18:00 (6:00 PM)
      return (hora < 18) || (hora === 18 && minutos === 0);
    }
    
    return false;
  };

  const registrarEvento = async (tipoEvento: string) => {
    if (!userId || !turno) {
      alert('Debe seleccionar un turno antes de registrar el evento.');
      return;
    }

    // Verificar restricciones de horario para el ingreso
    if (tipoEvento === "ingreso" && !verificarHorarioPermitido(turno)) {
      if (turno === 'mañana') {
        alert('No se puede registrar el ingreso después de las 9:00 AM para el turno mañana.');
      } else {
        alert('No se puede registrar el ingreso después de las 18:00 PM para el turno tarde.');
      }
      return;
    }

    try {
      const timestamp = new Date();
      const fechaActual = timestamp.toISOString().split('T')[0];

      const tablaAsistencia = turno === 'mañana' ? 'asistencia_mañana' : 'asistencia_tarde';

      const { data: registroExistente, error: errorSelect } = await supabase
        .from(tablaAsistencia)
        .select('*')
        .eq('usuario_id', userId)
        .eq('fecha', fechaActual)
        .single();

      if (errorSelect && errorSelect.code !== 'PGRST116') {
        throw errorSelect;
      }

      const updateData: { usuario_id: string; fecha: string; ingreso?: Date | null; egreso?: Date | null } = {
        usuario_id: userId,
        fecha: fechaActual
      };

      if (!registroExistente) {
        updateData.ingreso = timestamp;
        updateData.egreso = null;
      } else if (registroExistente.ingreso && !registroExistente.egreso && tipoEvento === "egreso") {
        updateData.egreso = timestamp;
      } else {
        if (registroExistente.egreso) {
          alert('Ya se registraron ingreso y egreso para hoy.');
        } else if (tipoEvento === "ingreso") {
          alert('Ya se registró el ingreso para hoy.');
        }
        return;
      }

      const { error } = await supabase
        .from(tablaAsistencia)
        .upsert([updateData], { onConflict: 'usuario_id,fecha' });

      if (error) throw error;

      alert(`${tipoEvento} registrado con éxito para el turno ${turno}`);
      sessionStorage.clear();
      router.push('/login');
    } catch (error) {
      console.error('Error al registrar asistencia:', error);
      alert('Error al registrar el evento. Por favor, intente nuevamente.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-lg">Cargando...</p>
      </div>
    );
  }

  // Determinar si el registro de ingreso está disponible según el horario
  const puedeRegistrarIngreso = verificarHorarioPermitido(turno);
  const mensajeHorario = turno === 'mañana' 
    ? 'Ingreso disponible hasta las 9:00 AM' 
    : turno === 'tarde' 
      ? 'Ingreso disponible hasta las 18:00 PM'
      : '';

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl text-black font-bold mb-4">Panel de Empleado</h1>
        <div className="mb-6">
          <p className="text-lg text-black">Bienvenido, {nombre}</p>
          <p className="text-sm text-gray-600">Sucursal: {sucursal.toUpperCase()}</p>
          <p className="text-xl text-black font-semibold mt-4">
            {currentTime.toLocaleTimeString('es-AR', { 
              timeZone: 'America/Argentina/Buenos_Aires',
              hour12: false 
            })}
          </p>
          <p className="text-md">
            {currentTime.toLocaleDateString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}
          </p>
        </div>

        {sucursal === 'jbj' ? (
          <select
            className="w-full p-2 border rounded mb-4 text-black"
            value={turno}
            onChange={(e) => setTurno(e.target.value)}
          >
            <option value="">Seleccionar Turno</option>
            <option value="mañana">Turno Mañana</option>
            <option value="tarde">Turno Tarde</option>
          </select>
        ) : (
          <div className="w-full p-2 border rounded mb-4 text-black bg-gray-100">
            <p>Turno: Mañana (único disponible para sucursal Juramento)</p>
          </div>
        )}

        {turno && (
          <p className="text-sm text-gray-600 mb-2">{mensajeHorario}</p>
        )}

        <button
          onClick={() => registrarEvento("ingreso")}
          className={`w-full py-2 px-4 rounded mb-4 ${
            turno && puedeRegistrarIngreso 
              ? 'bg-green-500 text-white hover:bg-green-600' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!turno || !puedeRegistrarIngreso}
        >
          Registrar Ingreso
        </button>

        <button
          onClick={() => registrarEvento("egreso")}
          className={`w-full py-2 px-4 rounded ${
            turno ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          disabled={!turno}
        >
          Registrar Egreso
        </button>
      </div>
    </div>
  );
}