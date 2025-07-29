import React, { useState } from 'react';
import { 
  TagIcon, 
  PlusIcon,
  EyeIcon, 
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

const DiscountsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Datos de ejemplo
  const discounts = [
    {
      id: 'DISC-001',
      name: 'Descuento de Verano',
      code: 'SUMMER20',
      type: 'Porcentaje',
      value: '20%',
      status: 'Activo',
      validFrom: '2024-01-01',
      validTo: '2024-03-31',
      usage: 45,
      maxUsage: 100
    },
    {
      id: 'DISC-002',
      name: 'Descuento Fijo',
      code: 'SAVE10',
      type: 'Fijo',
      value: '$10',
      status: 'Activo',
      validFrom: '2024-01-15',
      validTo: '2024-02-15',
      usage: 12,
      maxUsage: 50
    },
    {
      id: 'DISC-003',
      name: 'Descuento Expirado',
      code: 'OLD15',
      type: 'Porcentaje',
      value: '15%',
      status: 'Expirado',
      validFrom: '2023-12-01',
      validTo: '2023-12-31',
      usage: 30,
      maxUsage: 100
    }
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'Activo':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Expirado':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Inactivo':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const filteredDiscounts = discounts.filter(discount => 
    discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gestión de Descuentos
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Administra cupones y descuentos
          </p>
        </div>
        <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center">
          <PlusIcon className="h-5 w-5 mr-2" />
          Crear Descuento
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar
            </label>
            <input
              type="text"
              placeholder="Buscar descuentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
          <div className="flex items-end">
            <button className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
              Filtrar por Estado
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de descuentos */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Descuentos ({filteredDiscounts.length})
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descuento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Código
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Vigencia
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Uso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDiscounts.map((discount) => (
                <tr key={discount.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <TagIcon className="h-5 w-5 text-gray-400 mr-2" />
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {discount.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {discount.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded">
                      {discount.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    {discount.value}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Desde</div>
                      <div>{discount.validFrom}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Hasta</div>
                      <div>{discount.validTo}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {discount.usage} / {discount.maxUsage}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(discount.status)}`}>
                      {discount.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      <button className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300">
                        <PencilIcon className="h-4 w-4" />
                      </button>
                      <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300">
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DiscountsManagement; 