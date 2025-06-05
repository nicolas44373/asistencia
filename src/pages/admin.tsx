import { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import { supabase } from '../lib/supabaseClient'
import { Printer, FileSpreadsheet, User, Calendar } from 'lucide-react'
import * as XLSX from 'xlsx';

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

const AttendanceTable = ({
  records,
  formatDateTime,
  filterEmployee,
}: {
  records: AttendanceRecord[],
  formatDateTime: (timestamp: string | null) => string,
  filterEmployee: string,
}) => {

  // Filtramos los registros según el empleado seleccionado
  const filteredRecords = filterEmployee === 'todos' 
    ? records 
    : records.filter(record => record.usuario_id === filterEmployee);

  const getStatusColor = (time: string | null | undefined, isMorning: boolean, isIngreso: boolean) => {
    if (!time) return 'bg-gray-100';
    
    const timeDate = new Date(time);
    const hours = timeDate.getHours();
    const minutes = timeDate.getMinutes();
    const totalMinutes = hours * 60 + minutes;
    
    // Lógica para colorear según horarios
    if (isMorning) {
      // Reglas para el turno mañana
      if (isIngreso) {
        // Para ingreso mañana
        if (totalMinutes > 8 * 60 + 15) return 'bg-red-100'; // Después de 8:15 AM en rojo (tarde)
      } else {
        // Para egreso mañana
        if (totalMinutes < 13 * 60 + 30) return 'bg-yellow-100'; // Antes de 13:30 en amarillo (salida temprana)
        if (totalMinutes > 13 * 60 + 40) return 'bg-blue-100'; // Después de 13:40 en azul (horas extras)
      }
    } else {
      // Reglas para el turno tarde
      if (isIngreso) {
        // Para ingreso tarde
        if (totalMinutes > 17 * 60 + 15) return 'bg-red-100'; // Después de 17:15 PM en rojo (tarde)
      } else {
        // Para egreso tarde
        if (totalMinutes < 21 * 60) return 'bg-yellow-100'; // Antes de 21:00 en amarillo (salida temprana)
        if (totalMinutes > 21 * 60 + 10) return 'bg-blue-100'; // Después de 21:10 en azul (horas extras)
      }
    }
    
    return 'bg-green-100'; // Horario normal en verde
  }

const formatDate = (dateString: string) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day); // ← esto crea la fecha como local, sin UTC
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Empleado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
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
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Día
            </th>
            {['Ingreso', 'Egreso', 'Ingreso', 'Egreso'].map((header, index) => (
              <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {filteredRecords.map((record) => (
            <tr key={`${record.usuario_id}-${record.fecha}`}>
              <td className="px-6 py-4 whitespace-nowrap font-medium">
                {record.nombre}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {formatDate(record.fecha)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${getStatusColor(record.turno_mañana?.ingreso, true, true)}`}>
                {formatDateTime(record.turno_mañana?.ingreso || null)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${getStatusColor(record.turno_mañana?.egreso, true, false)}`}>
                {formatDateTime(record.turno_mañana?.egreso || null)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${getStatusColor(record.turno_tarde?.ingreso, false, true)}`}>
                {formatDateTime(record.turno_tarde?.ingreso || null)}
              </td>
              <td className={`px-6 py-4 whitespace-nowrap ${getStatusColor(record.turno_tarde?.egreso, false, false)}`}>
                {formatDateTime(record.turno_tarde?.egreso || null)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const AttendanceStats = ({ records, filterEmployee }: { records: AttendanceRecord[], filterEmployee: string }) => {
  // Filtramos los registros según el empleado seleccionado
  const filteredRecords = filterEmployee === 'todos' 
    ? records 
    : records.filter(record => record.usuario_id === filterEmployee);

  const stats = {
    total: filteredRecords.length,
    morning: filteredRecords.filter(r => r.turno_mañana?.ingreso).length,
    afternoon: filteredRecords.filter(r => r.turno_tarde?.ingreso).length
  }

  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {[ 
        { label: 'Total Registros', value: stats.total },
        { label: 'Asistencia Mañana', value: `${stats.morning} (${stats.total > 0 ? Math.round(stats.morning/stats.total * 100) : 0}%)` },
        { label: 'Asistencia Tarde', value: `${stats.afternoon} (${stats.total > 0 ? Math.round(stats.afternoon/stats.total * 100) : 0}%)` }
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
  
  // Configuración de fechas
  const today = new Date();
  
  // Ajustar a zona horaria de Argentina (GMT-3)
  const argentinaOffset = -3 * 60;
  const currentOffsetMinutes = today.getTimezoneOffset();
  const offsetDifference = currentOffsetMinutes - argentinaOffset;
  const argentinaDate = new Date(today.getTime() + offsetDifference * 60 * 1000);
  
  const [startDate, setStartDate] = useState(() => {
    // Por defecto, primer día del mes actual
    const firstDay = new Date(argentinaDate.getFullYear(), argentinaDate.getMonth(), 1);
    return firstDay.toISOString().split('T')[0];
  });
  
  const [endDate, setEndDate] = useState(() => {
    // Por defecto, fecha actual de Argentina
    return argentinaDate.toISOString().split('T')[0];
  });

  const [selectedEmployee, setSelectedEmployee] = useState<string>('todos')
  const [tableFilterEmployee, setTableFilterEmployee] = useState<string>('todos')
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

      fetchAttendanceRecordsDateRange(startDate, endDate)
    }

    checkAdmin()
  }, [startDate, endDate, router])

  const getDatesInRange = (start: string, end: string) => {
    const dates = [];
    
    // Crear fechas con zona horaria de Argentina
    // Usar hora 15:00 UTC (12:00 en Argentina) para evitar problemas de zona horaria
    const startDate = new Date(`${start}T15:00:00Z`);
    const endDate = new Date(`${end}T15:00:00Z`);
    
    // Clonar la fecha inicial
    const currentDate = new Date(startDate);
    
    // Iterar mientras la fecha actual sea menor o igual a la fecha final
    while (currentDate <= endDate) {
      // Extraer solo YYYY-MM-DD y agregar a las fechas
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
      
      // Incrementar la fecha actual en 1 día
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dates;
  };

  const fetchAttendanceRecordsDateRange = async (start: string, end: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data: usuarios, error: userError } = await supabase
        .from('usuarios')
        .select('id, nombre')
        .order('nombre');

      if (userError) throw userError;

      // Get all dates in the range
      const dateRange = getDatesInRange(start, end);
      const allRecords: AttendanceRecord[] = [];
      const allMonthlyRecords: MonthlyAttendanceRecord[] = [];

      // Fetch data for each date in the range
      for (const date of dateRange) {
        const [mañanaResult, tardeResult] = await Promise.all([
          supabase.from('asistencia_mañana').select('*').eq('fecha', date),
          supabase.from('asistencia_tarde').select('*').eq('fecha', date)
        ]);

        if (mañanaResult.error) throw mañanaResult.error;
        if (tardeResult.error) throw tardeResult.error;

        // Add all users for this date
        usuarios?.forEach(usuario => {
          const mañana = mañanaResult.data?.find(r => r.usuario_id === usuario.id);
          const tarde = tardeResult.data?.find(r => r.usuario_id === usuario.id);
          
          // Only add records with some attendance data
          if (mañana?.ingreso || mañana?.egreso || tarde?.ingreso || tarde?.egreso) {
            const record = {
              fecha: date,
              nombre: usuario.nombre,
              usuario_id: usuario.id,
              turno_mañana: mañana ? {
                ingreso: mañana.ingreso,
                egreso: mañana.egreso
              } : undefined,
              turno_tarde: tarde ? {
                ingreso: tarde.ingreso,
                egreso: tarde.egreso
              } : undefined
            };
            
            allRecords.push(record);
            
            // Add to monthly records with day info
            // Usar la zona horaria de Argentina para calcular el día
            const dateWithZone = new Date(`${date}T15:00:00Z`); // 15:00 UTC = 12:00 en Argentina GMT-3
            const recordDay = dateWithZone.getDate();
            
            allMonthlyRecords.push({
              ...record,
              day: recordDay
            });
          }
        });
      }

      // Sort records by date and name
      allRecords.sort((a, b) => {
        if (a.fecha === b.fecha) {
          return a.nombre.localeCompare(b.nombre);
        }
        return a.fecha.localeCompare(b.fecha);
      });

      setAttendanceRecords(allRecords);
      setMonthlyRecords(allMonthlyRecords);
    } catch (error) {
      console.error('Error al cargar los registros:', error);
      setError('Error al cargar los registros de asistencia.');
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (timestamp: string | null) => {
    if (!timestamp) return 'No registrado';
    
    // Asegurar que usamos la zona horaria de Argentina
    return new Date(timestamp).toLocaleString('es-AR', {
      timeZone: 'America/Argentina/Buenos_Aires',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Obtener lista única de empleados para el selector
  const uniqueEmployees = Array.from(
    new Map(monthlyRecords.map(r => [r.usuario_id, { id: r.usuario_id, nombre: r.nombre }])).values()
  );

  const exportToExcel = (
    records: MonthlyAttendanceRecord[],
    startDate: string,
    endDate: string,
    formatDateTime: (date: string | null) => string,
    employeeId?: string
  ) => {
    // Usar zona horaria de Argentina para las fechas
    const startDateObj = new Date(`${startDate}T15:00:00Z`); // 15:00 UTC = 12:00 en Argentina GMT-3
    const endDateObj = new Date(`${endDate}T15:00:00Z`);
    
    const dateRange = `${startDateObj.toLocaleDateString('es-AR', {timeZone: 'America/Argentina/Buenos_Aires'})} al ${endDateObj.toLocaleDateString('es-AR', {timeZone: 'America/Argentina/Buenos_Aires'})}`;
  
    const filteredRecords = records.filter(record =>
      (!employeeId || employeeId === 'todos' || record.usuario_id === employeeId)
    );
  
    if (filteredRecords.length === 0) {
      alert("No hay registros de asistencia para exportar.");
      return;
    }
  
    const limiteMañana = 8 * 60 + 15;
    const limiteTarde = 17 * 60 + 15;
  
    const getTimeInMinutes = (time: string) => {
      const [hours, minutes] = time.split(":").map(Number);
      return hours * 60 + minutes;
    };
  
    const formattedRecords = filteredRecords.map(record => {
      let ingresoMañana = record.turno_mañana?.ingreso ? formatDateTime(record.turno_mañana.ingreso) : "No registrado";
      let ingresoTarde = record.turno_tarde?.ingreso ? formatDateTime(record.turno_tarde.ingreso) : "No registrado";
  
      if (ingresoMañana !== "No registrado" && getTimeInMinutes(ingresoMañana) > limiteMañana) {
        ingresoMañana = `Tarde: ${ingresoMañana}`;
      }
      if (ingresoTarde !== "No registrado" && getTimeInMinutes(ingresoTarde) > limiteTarde) {
        ingresoTarde = `Tarde: ${ingresoTarde}`;
      }
  
      // Usar zona horaria de Argentina para formatear la fecha
      const recordDate = new Date(`${record.fecha}T15:00:00Z`); // 15:00 UTC = 12:00 en Argentina GMT-3
      const formattedDate = recordDate.toLocaleDateString('es-AR', {timeZone: 'America/Argentina/Buenos_Aires'});
  
      return {
        Empleado: record.nombre,
        Fecha: formattedDate,
        "Ingreso Mañana": ingresoMañana,
        "Egreso Mañana": record.turno_mañana?.egreso ? formatDateTime(record.turno_mañana.egreso) : "No registrado",
        "Ingreso Tarde": ingresoTarde,
        "Egreso Tarde": record.turno_tarde?.egreso ? formatDateTime(record.turno_tarde.egreso) : "No registrado",
      };
    });
  
    formattedRecords.sort((a, b) => {
      if (a.Empleado === b.Empleado) {
        return a.Fecha.localeCompare(b.Fecha);
      }
      return a.Empleado.localeCompare(b.Empleado);
    });
  
    const nombreEmpleado = employeeId && employeeId !== 'todos'
      ? uniqueEmployees.find(e => e.id === employeeId)?.nombre?.replace(/\s+/g, '_') || "Empleado"
      : "Todos";
  
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(formattedRecords);
    worksheet["!cols"] = [
      { wch: 25 }, // Empleado  
      { wch: 15 }, // Fecha
      { wch: 20 }, // Ingreso Mañana
      { wch: 20 }, // Egreso Mañana
      { wch: 20 }, // Ingreso Tarde
      { wch: 20 }  // Egreso Tarde
    ];
    XLSX.utils.book_append_sheet(workbook, worksheet, "Asistencia");
    XLSX.writeFile(workbook, `Asistencia_${nombreEmpleado}_${dateRange.replace(/\//g, '-')}.xlsx`);
  };

  // Función para exportar todos los empleados individualmente
  const exportAllEmployeesIndividually = () => {
    if (uniqueEmployees.length === 0) {
      alert("No hay empleados para exportar.");
      return;
    }

    let countExported = 0;
    uniqueEmployees.forEach(employee => {
      const filteredRecords = monthlyRecords.filter(
        record => record.usuario_id === employee.id
      );

      if (filteredRecords.length > 0) {
        exportToExcel(monthlyRecords, startDate, endDate, formatDateTime, employee.id);
        countExported++;
      }
    });

    if (countExported === 0) {
      alert("No hay registros de asistencia para exportar.");
    } else {
      alert(`Se han exportado ${countExported} archivos de empleados.`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Panel de Administrador</h1>
            <div className="flex gap-4 items-center print:hidden">
              <button
                onClick={() => exportToExcel(monthlyRecords, startDate, endDate, formatDateTime)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Exportar Todo
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

          {/* Selección de Rango de Fechas */}
          <div className="bg-blue-50 p-4 mb-6 rounded-lg border border-blue-200">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Selección de Rango de Fechas
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm font-medium">Desde:</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border rounded-md p-2"
                  max={endDate} // No permite seleccionar después de la fecha final
                />
              </div>
              <div>
                <label className="block mb-2 text-sm font-medium">Hasta:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border rounded-md p-2"
                  min={startDate} // No permite seleccionar antes de la fecha inicial
                />
              </div>
            </div>
            {loading && (
              <div className="mt-4 text-blue-600">
                Cargando registros...
              </div>
            )}
          </div>

          <AttendanceStats records={attendanceRecords} filterEmployee={tableFilterEmployee} />

          {/* Sección de exportación individual */}
          <div className="bg-gray-50 p-4 mb-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Exportación Individual</h2>
            <div className="flex gap-4 items-center">
              <div className="flex-grow">
                <select
                  value={selectedEmployee}
                  onChange={(e) => setSelectedEmployee(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="todos">Todos los empleados</option>
                  {uniqueEmployees.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  if (selectedEmployee === 'todos') {
                    // Preguntar al usuario si realmente quiere exportar todos individualmente
                    if (confirm("¿Desea exportar un archivo Excel individual para cada empleado?")) {
                      exportAllEmployeesIndividually();
                    } else {
                      // Exportar un solo archivo con todos los empleados
                      exportToExcel(monthlyRecords, startDate, endDate, formatDateTime);
                    }
                  } else {
                    // Exportar solo el empleado seleccionado
                    exportToExcel(monthlyRecords, startDate, endDate, formatDateTime, selectedEmployee);
                  }
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <User className="h-4 w-4" />
                Exportar Seleccionado
              </button>
            </div>
          </div>

          {/* Filtro para la tabla */}
          <div className="bg-gray-50 p-4 mb-6 rounded-lg border">
            <h2 className="text-lg font-semibold mb-4">Filtrar Tabla</h2>
            <div className="flex gap-4 items-center">
              <div className="flex-grow">
                <select
                  value={tableFilterEmployee}
                  onChange={(e) => setTableFilterEmployee(e.target.value)}
                  className="w-full border rounded-md p-2"
                >
                  <option value="todos">Ver todos los empleados</option>
                  {uniqueEmployees.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div className="px-4 py-2 bg-white border rounded-md">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-100"></div>
                  <span>A tiempo</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-100"></div>
                  <span>Ingreso tarde (8:15 / 17:15)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-100"></div>
                  <span>Egreso temprano (13:30 / 21:00)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-100"></div>
                  <span>Horas extras (13:40 / 21:10)</span>
                </div>
              </div>
            </div>
          </div>

          {attendanceRecords.length > 0 ? (
            <AttendanceTable
              records={attendanceRecords}
              formatDateTime={formatDateTime}
              filterEmployee={tableFilterEmployee}
            />
          ) : !loading && (
            <div className="bg-gray-50 p-6 text-center border rounded-lg">
              No hay registros de asistencia en el rango de fechas seleccionado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}