// Reportes.tsx
import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { fetchReporteData, ReporteFiltros, ReporteDashboard } from '../../api/reportes.api';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b'];

export default function Reportes() {
  const [data, setData] = useState<ReporteDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'ACADEMICO' | 'PAGOS'>('GENERAL');

  const [filtros, setFiltros] = useState<ReporteFiltros>({
    modulo: 'GENERAL',
    fechaInicio: '',
    fechaFin: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const resultado = await fetchReporteData(filtros);
      setData(resultado);
    } catch (error) {
      console.error('Error cargando reportes', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportarPDF = () => {
    if (!data) return;
    const doc = new jsPDF();

    // Título y Cabecera
    doc.setFontSize(18);
    doc.text('Reporte Gerencial - EduMóvil', 14, 22);
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Fecha de emisión: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Módulo: ${activeTab}`, 14, 36);

    let startY = 45;

    // Tabla 1: Resumen
    autoTable(doc, {
      startY,
      head: [['Indicador', 'Valor']],
      body: [
        ['Total Estudiantes', data.resumen.totalEstudiantes],
        ['Instituciones Activas', data.resumen.institucionesActivas],
        ['Ingresos Totales (Bs)', data.resumen.ingresosPagos.toFixed(2)],
      ],
      theme: 'grid',
      headStyles: { fillColor: [37, 99, 235] }
    });

    // Tabla 2: Detalle (Previsualización)
    doc.text('Detalle Analítico', 14, (doc as any).lastAutoTable.finalY + 15);
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 20,
      head: [['Colegio', 'Entidad / Materia', 'Métrica', 'Estado']],
      body: data.tablaDetalle.map(item => [
        item.colegio, item.entidad, item.metrica, item.estado
      ]),
      theme: 'striped',
    });

    doc.save(`Reporte_EduMovil_${activeTab}_${new Date().getTime()}.pdf`);
  };

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Centro de Reportes</h1>
          <p className="text-slate-500 text-sm">Análisis y exportación de datos en tiempo real</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => window.print()} className="px-4 py-2 bg-slate-200 text-slate-700 rounded-md font-medium hover:bg-slate-300 transition">
            Imprimir
          </button>
          <button onClick={handleExportarPDF} className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition shadow-sm flex items-center gap-2">
            📄 Descargar PDF Formal
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6 flex gap-4 items-end">
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Desde</label>
          <input type="date" className="w-full border rounded-md p-2 text-sm"
            value={filtros.fechaInicio} onChange={e => setFiltros({ ...filtros, fechaInicio: e.target.value })} />
        </div>
        <div className="flex-1">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Hasta</label>
          <input type="date" className="w-full border rounded-md p-2 text-sm"
            value={filtros.fechaFin} onChange={e => setFiltros({ ...filtros, fechaFin: e.target.value })} />
        </div>
        <button onClick={cargarDatos} className="px-6 py-2 bg-slate-800 text-white rounded-md text-sm font-bold hover:bg-slate-900 transition">
          Aplicar Filtros
        </button>
      </div>

      {/* Pestañas de Navegación */}
      <div className="flex border-b border-slate-200 mb-6 gap-6">
        {['GENERAL', 'ACADEMICO', 'PAGOS'].map(tab => (
          <button key={tab} onClick={() => { setActiveTab(tab as any); setFiltros({ ...filtros, modulo: tab as any }); }}
            className={`pb-3 font-semibold text-sm transition-colors ${activeTab === tab ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
            {tab === 'GENERAL' ? 'Dashboard Global' : tab === 'ACADEMICO' ? 'Rendimiento Académico' : 'Estado de Pagos'}
          </button>
        ))}
      </div>

      {loading || !data ? (
        <div className="flex justify-center items-center py-20 text-slate-400 font-medium">Procesando millones de registros...</div>
      ) : (
        <div className="space-y-6">

          {/* Tarjetas KPI */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-blue-500">
              <p className="text-xs text-slate-500 font-bold uppercase">Total Estudiantes</p>
              <p className="text-2xl font-black text-slate-800">{data.resumen.totalEstudiantes}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-emerald-500">
              <p className="text-xs text-slate-500 font-bold uppercase">Instituciones Activas</p>
              <p className="text-2xl font-black text-slate-800">{data.resumen.institucionesActivas}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-purple-500">
              <p className="text-xs text-slate-500 font-bold uppercase">Total Docentes</p>
              <p className="text-2xl font-black text-slate-800">{data.resumen.totalDocentes}</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-amber-500">
              <p className="text-xs text-slate-500 font-bold uppercase">Ingresos Recaudados</p>
              <p className="text-2xl font-black text-slate-800">Bs. {data.resumen.ingresosPagos.toLocaleString()}</p>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Rendimiento por Materia (Aprobados vs Reprobados)</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.rendimientoAcademico}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="materia" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="aprobados" name="Aprobados" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="reprobados" name="Reprobados" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-700 mb-4">Mora de Pagos por Mes</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.estadoPagos}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="mes" fontSize={12} />
                    <YAxis fontSize={12} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="pagados" name="Pagado al día" fill="#3b82f6" stackId="a" />
                    <Bar dataKey="pendientes" name="En Mora" fill="#f59e0b" stackId="a" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Tabla de Previsualización */}
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h3 className="text-sm font-bold text-slate-700">Previsualización de Datos Crudos (Para PDF)</h3>
            </div>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider border-b">
                  <th className="p-3 font-semibold">Colegio</th>
                  <th className="p-3 font-semibold">Entidad / Rubro</th>
                  <th className="p-3 font-semibold">Métrica</th>
                  <th className="p-3 font-semibold">Estado</th>
                </tr>
              </thead>
              <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
                {data.tablaDetalle.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-medium">{row.colegio}</td>
                    <td className="p-3">{row.entidad}</td>
                    <td className="p-3 font-mono text-xs">{row.metrica}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${row.estado === 'Óptimo' ? 'bg-green-100 text-green-700' :
                          row.estado === 'Alerta' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'
                        }`}>{row.estado}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}
    </div>
  );
}