import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import { Printer, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx';
import "@/styles/globals.css"

interface AttendanceRecord {
  fecha: string
  nombre: string
  usuario_id: string
  turno_mañana?: {
    ingreso: string | null
    egreso: string | null
  }
  turno_tarde?: {
    ingreso: string | null
    egreso: string | null
  }
}

interface MonthlyAttendanceRecord extends AttendanceRecord {
  day: number
}

const AttendanceTable = ({ records, formatDateTime }: { 
  records: AttendanceRecord[], 
  formatDateTime: (timestamp: string | null) => string 
}) => {
  const getStatusColor = (time: string | null | undefined) => {
    if (!time) return 'bg-gray-100'
    return 'bg-green-100'
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Empleado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={2}>
              Turno Mañana
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" colSpan={2}>
              Turno Tarde
            </th>
          </tr>
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            {['Ingreso', 'Egreso', 'Ingreso', 'Egreso'].map((header, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {records.map((record) => (
            <tr key={record.usuario_id}>
              <td className="px-6 py-4 whitespace-nowrap font-medium">
                {record.nombre}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${getStatusColor(record.turno_mañana?.ingreso)}`}>
                {formatDateTime(record.turno_mañana?.ingreso || null)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${getStatusColor(record.turno_mañana?.egreso)}`}>
                {formatDateTime(record.turno_mañana?.egreso || null)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${getStatusColor(record.turno_tarde?.ingreso)}`}>
                {formatDateTime(record.turno_tarde?.ingreso || null)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${getStatusColor(record.turno_tarde?.egreso)}`}>
                {formatDateTime(record.turno_tarde?.egreso || null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const AttendanceStats = ({ records }: { records: AttendanceRecord[] }) => {
  const stats = {
    total: records.length,
    morning: records.filter(r => r.turno_mañana?.ingreso).length,
    afternoon: records.filter(r => r.turno_tarde?.ingreso).length
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[ 
        { label: 'Total Empleados', value: stats.total },
        { label: 'Asistencia Mañana', value: `${stats.morning} (${Math.round(stats.morning/stats.total * 100)}%)` },
        { label: 'Asistencia Tarde', value: `${stats.afternoon} (${Math.round(stats.afternoon/stats.total * 100)}%)` }
      ].map((stat, index) => (
        <div key={index} className="bg-white p-6 rounded-lg shadow">
          <div className="text-2xl font-bold">{stat.value}</div>
          <div className="text-sm text-gray-500">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

export default function Admin() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyAttendanceRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const router = useRouter()

  useEffect(() => {
    const checkAdmin = async () => {
      const userId = sessionStorage.getItem('userId')
      const nombre = sessionStorage.getItem('nombre')
      const userType = sessionStorage.getItem('userType')

      if (!userId || !nombre || userType !== 'admin') {
        router.push('/login')
        return
      }

      fetchAttendanceRecords(selectedDate)
      fetchMonthlyRecords(selectedDate)
    }

    checkAdmin()
  }, [selectedDate])

  const fetchMonthlyRecords = async (date: string) => {
    try {
      const startDate = new Date(date);
      startDate.setDate(1); // Primer día del mes
      const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Último día del mes
  
      console.log("Fecha de inicio:", startDate);
      console.log("Fecha de fin:", endDate);
  
      // Obtener todos los usuarios
      const { data: usuarios, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .order('nombre');
  
      if (userError) throw userError;
      console.log("Usuarios obtenidos:", usuarios);
  
      // Generar un array con todas las fechas del mes
      const monthDates = Array.from(
        { length: endDate.getDate() }, 
        (_, i) => new Date(startDate.getFullYear(), startDate.getMonth(), i + 1)
      );
  
      console.log("Fechas del mes:", monthDates);
  
      const monthlyData: MonthlyAttendanceRecord[] = [];
  
      // Consultar la asistencia para cada día del mes
      for (const currentDate of monthDates) {
        const dateStr = currentDate.toISOString().split('T')[0]; // Formato YYYY-MM-DD
  
        console.log("Consultando fecha:", dateStr);
  
        // Consultar asistencia de la mañana y tarde para la fecha actual
        const [mañanaResult, tardeResult] = await Promise.all([
          supabase.from('asistencia_mañana').select('*').eq('fecha', dateStr),
          supabase.from('asistencia_tarde').select('*').eq('fecha', dateStr)
        ]);
  
        if (mañanaResult.error) throw mañanaResult.error;
        if (tardeResult.error) throw tardeResult.error;
  
        console.log(`Resultados para ${dateStr}:`, {
          mañana: mañanaResult.data,
          tarde: tardeResult.data
        });
  
        // Para cada usuario, buscar sus registros de asistencia
        usuarios.forEach(usuario => {
          const mañana = mañanaResult.data?.find(r => r.usuario_id === usuario.id);
          const tarde = tardeResult.data?.find(r => r.usuario_id === usuario.id);
  
          // Agregar los datos al array mensual
          monthlyData.push({
            fecha: dateStr,
            nombre: usuario.nombre,
            usuario_id: usuario.id,
            day: currentDate.getDate(),
            turno_mañana: mañana ? {
              ingreso: mañana.ingreso,
              egreso: mañana.egreso
            } : undefined,
            turno_tarde: tarde ? {
              ingreso: tarde.ingreso,
              egreso: tarde.egreso
            } : undefined
          });
        });
      }
  
      console.log('Registros mensuales obtenidos:', monthlyData);
      setMonthlyRecords(monthlyData);
  
    } catch (error) {
      console.error('Error al cargar los registros mensuales:', error);
      setError('Error al cargar los registros mensuales.');
    }
  };

  const fetchAttendanceRecords = async (date: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data: usuarios, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .order('nombre')

      if (userError) throw userError

      const [mañanaResult, tardeResult] = await Promise.all([
        supabase.from('asistencia_mañana').select('*').eq('fecha', date),
        supabase.from('asistencia_tarde').select('*').eq('fecha', date)
      ])

      if (mañanaResult.error) throw mañanaResult.error
      if (tardeResult.error) throw tardeResult.error

      const registrosCombinados = usuarios?.map(usuario => ({
        fecha: date,
        nombre: usuario.nombre,
        usuario_id: usuario.id,
        turno_mañana: mañanaResult.data?.find(r => r.usuario_id === usuario.id),
        turno_tarde: tardeResult.data?.find(r => r.usuario_id === usuario.id)
      }))

      setAttendanceRecords(registrosCombinados || [])
    } catch (error) {
      console.error('Error al cargar los registros:', error)
      setError('Error al cargar los registros de asistencia.')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (timestamp: string | null) => {
    if (!timestamp) return 'No registrado'
    return new Date(timestamp).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }
  

const isLate = (time: string | null, limitTime: string): boolean => {
  if (!time || time === "No registrado") return false;

  const [hours, minutes] = time.split(":").map(Number);
  const timeInMinutes = hours * 60 + minutes;

  const [limitHours, limitMinutes] = limitTime.split(":").map(Number);
  const limitTimeInMinutes = limitHours * 60 + limitMinutes;

  return timeInMinutes > limitTimeInMinutes;
};

const exportToExcel = (
  monthlyRecords: MonthlyAttendanceRecord[],
  selectedDate: string,
  formatDateTime: (date: string | null) => string
) => {
  const date = new Date(selectedDate);
  const monthName = date.toLocaleString('es-AR', { month: 'long', year: 'numeric', timeZone: 'America/Argentina/Buenos_Aires' });

  const filteredRecords = monthlyRecords.filter(record => {
    return (
      (record.turno_mañana?.ingreso || record.turno_mañana?.egreso) ||
      (record.turno_tarde?.ingreso || record.turno_tarde?.egreso)
    );
  });

  const formattedRecords = filteredRecords.map((record) => {
    const ingresoMañana = record.turno_mañana?.ingreso ? formatDateTime(record.turno_mañana.ingreso) : "No registrado";
    const egresoMañana = record.turno_mañana?.egreso ? formatDateTime(record.turno_mañana.egreso) : "No registrado";
    const ingresoTarde = record.turno_tarde?.ingreso ? formatDateTime(record.turno_tarde.ingreso) : "No registrado";
    const egresoTarde = record.turno_tarde?.egreso ? formatDateTime(record.turno_tarde.egreso) : "No registrado";

    return {
      Empleado: record.nombre,
      Día: record.day,
      "Ingreso Mañana": ingresoMañana,
      "Egreso Mañana": egresoMañana,
      "Ingreso Tarde": ingresoTarde,
      "Egreso Tarde": egresoTarde
    };
  });

  formattedRecords.sort((a, b) => a.Día - b.Día);

  const workbook = XLSX.utils.book_new();
  const worksheet = XLSX.utils.json_to_sheet(formattedRecords);

  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

  // Lógica de resaltado en celdas
  for (let row = range.s.r + 1; row <= range.e.r; row++) {
    const ingresoMañanaCell = XLSX.utils.encode_cell({ r: row, c: 2 });
    const ingresoTardeCell = XLSX.utils.encode_cell({ r: row, c: 4 });

    const ingresoMañanaValue = worksheet[ingresoMañanaCell]?.v;
    const ingresoTardeValue = worksheet[ingresoTardeCell]?.v;

    // Hora límite en minutos
    const limiteMañana = 8 * 60 + 15; // 08:15 en minutos
    const limiteTarde = 17 * 60 + 15; // 17:15 en minutos

    // Convertimos la hora procesada a minutos
    const getTimeInMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };

    // Resaltado para Ingreso Mañana
    if (ingresoMañanaValue && ingresoMañanaValue !== "No registrado") {
      const horaIngresoMañana = getTimeInMinutes(ingresoMañanaValue);
      if (horaIngresoMañana > limiteMañana) {
        // Verificamos que la celda tenga un objeto de estilo antes de aplicarlo
        if (!worksheet[ingresoMañanaCell].s) worksheet[ingresoMañanaCell].s = {}; // Aseguramos que la celda tenga un objeto de estilo
        worksheet[ingresoMañanaCell].s.fill = { fgColor: { rgb: "FFCCCB" } }; // Color de fondo
        worksheet[ingresoMañanaCell].s.font = { bold: true }; // Texto en negrita
      }
    }

    // Resaltado para Ingreso Tarde
    if (ingresoTardeValue && ingresoTardeValue !== "No registrado") {
      const horaIngresoTarde = getTimeInMinutes(ingresoTardeValue);
      if (horaIngresoTarde > limiteTarde) {
        // Verificamos que la celda tenga un objeto de estilo antes de aplicarlo
        if (!worksheet[ingresoTardeCell].s) worksheet[ingresoTardeCell].s = {}; // Aseguramos que la celda tenga un objeto de estilo
        worksheet[ingresoTardeCell].s.fill = { fgColor: { rgb: "FFCCCB" } }; // Color de fondo
        worksheet[ingresoTardeCell].s.font = { bold: true }; // Texto en negrita
      }
    }
  }

  worksheet["!cols"] = [
    { wch: 20 },
    { wch: 10 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 }
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencia");
  // Exportación al navegador
  XLSX.writeFile(workbook, `Asistencia_${monthName}.xlsx`);
};


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl animate-pulse">Cargando registros...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Panel de Administrador</h1>
            <div className="flex gap-4 items-center print:hidden">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="border rounded-md p-2"
              />
              <button
  onClick={() => {
    const filteredRecords = monthlyRecords.filter(record => {
      return (
        (record.turno_mañana?.ingreso || record.turno_mañana?.egreso) ||
        (record.turno_tarde?.ingreso || record.turno_tarde?.egreso)
      );
    });

    if (filteredRecords.length > 0) {
      exportToExcel(monthlyRecords, selectedDate, formatDateTime);
    } else {
      alert("No hay registros de asistencia para exportar.");
    }
  }}
  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
>
  <FileSpreadsheet className="h-4 w-4" />
  Exportar Mes
</button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Printer className="h-4 w-4" />
                Imprimir
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md mb-6">
              {error}
            </div>
          )}

          <AttendanceStats records={attendanceRecords} />
          <AttendanceTable records={attendanceRecords} formatDateTime={formatDateTime} />
        </div>
      </div>
    </div>
  );
}
