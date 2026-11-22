// reportes.api.ts
export interface ReporteFiltros {
  unidadEducativaId?: string;
  gestionId?: string;
  fechaInicio?: string;
  fechaFin?: string;
  modulo?: 'ACADEMICO' | 'PAGOS' | 'GENERAL';
}

export interface ReporteDashboard {
  resumen: {
    totalEstudiantes: number;
    totalDocentes: number;
    institucionesActivas: number;
    ingresosPagos: number; // Preparado para el módulo de pagos
  };
  rendimientoAcademico: {
    materia: string;
    aprobados: number;
    reprobados: number;
    porcentajeAprobacion: number;
  }[];
  estadoPagos: {
    mes: string;
    pagados: number;
    pendientes: number;
  }[];
  tablaDetalle: any[]; // Datos crudos para la previsualización en tabla
}

// ESTA FUNCIÓN SE CONECTARÁ A NESTJS EN EL FUTURO
export async function fetchReporteData(filtros: ReporteFiltros): Promise<ReporteDashboard> {
  console.log('Filtros aplicados (enviando al backend):', filtros);

  // SIMULACIÓN: Esto es exactamente lo que el backend de NestJS te devolverá en formato JSON.
  // Al simularlo aquí, tu UI es 100% funcional hoy.
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        resumen: {
          totalEstudiantes: Math.floor(Math.random() * 500) + 100,
          totalDocentes: 45,
          institucionesActivas: 12,
          ingresosPagos: 15400.50,
        },
        rendimientoAcademico: [
          { materia: 'Matemáticas', aprobados: 120, reprobados: 30, porcentajeAprobacion: 80 },
          { materia: 'Física', aprobados: 90, reprobados: 60, porcentajeAprobacion: 60 },
          { materia: 'Literatura', aprobados: 140, reprobados: 10, porcentajeAprobacion: 93 },
        ],
        estadoPagos: [
          { mes: 'Agosto', pagados: 120, pendientes: 30 },
          { mes: 'Septiembre', pagados: 140, pendientes: 10 },
          { mes: 'Octubre', pagados: 85, pendientes: 65 },
        ],
        tablaDetalle: [
          { id: 1, colegio: 'San Calixto', entidad: 'Matemáticas', metrica: '80% Aprobación', estado: 'Óptimo' },
          { id: 2, colegio: 'Don Bosco', entidad: 'Física', metrica: '60% Aprobación', estado: 'Alerta' },
          { id: 3, colegio: 'San Ignacio', entidad: 'Pagos Octubre', metrica: '65 Pendientes', estado: 'Mora' },
        ]
      });
    }, 800);
  });
}