import React, { useState } from 'react';

interface Patrocinador {
  id: number;
  nombreEncargado: string;
  telefonoEncargado: string;
  imagenUrl: string;
}

export default function PatrocinadoresPage() {
  const [patrocinadores, setPatrocinadores] = useState<Patrocinador[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [nombreEncargado, setNombreEncargado] = useState('');
  const [telefonoEncargado, setTelefonoEncargado] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nuevoPatrocinador: Patrocinador = {
      id: Date.now(),
      nombreEncargado,
      telefonoEncargado,
      imagenUrl: imagen ? URL.createObjectURL(imagen) : '',
    };

    setPatrocinadores([nuevoPatrocinador, ...patrocinadores]);
    setIsModalOpen(false);
    setNombreEncargado('');
    setTelefonoEncargado('');
    setImagen(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Patrocinadores</h1>
          <p className="text-sm text-gray-500">Gestión de patrocinadores oficiales</p>
        </div>
        
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center shadow-md transition"
        >
          + Nuevo patrocinador
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Imagen</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Nombre del Encargado</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase">Teléfono / Número</th>
              <th className="p-4 text-xs font-semibold text-gray-600 uppercase text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {patrocinadores.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-gray-400 italic">
                  No hay patrocinadores registrados.
                </td>
              </tr>
            ) : (
              patrocinadores.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    {item.imagenUrl ? (
                      <img src={item.imagenUrl} alt="Logo" className="w-10 h-10 object-cover rounded-full" />
                    ) : (
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-xs text-gray-500">Sin img</div>
                    )}
                  </td>
                  <td className="p-4 font-medium text-gray-800">{item.nombreEncargado}</td>
                  <td className="p-4 text-gray-600">{item.telefonoEncargado}</td>
                  <td className="p-4 text-right text-gray-400">...</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="text-lg font-bold text-gray-800">Nuevo patrocinador</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGuardar} className="space-y-4 pt-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del encargado *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan Pérez"
                  value={nombreEncargado}
                  onChange={(e) => setNombreEncargado(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número del encargado *</label>
                <input
                  type="tel"
                  required
                  placeholder="Ej. +591 70000000"
                  value={telefonoEncargado}
                  onChange={(e) => setTelefonoEncargado(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagen / Logotipo *</label>
                <input
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setImagen(e.target.files[0]);
                    }
                  }}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium shadow transition"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}