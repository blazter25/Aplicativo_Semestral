'use client'

import { useState, useMemo } from 'react'

interface Column {
    header: string
    accessor: string
    render?: (value: any, row: any) => React.ReactNode
    sortable?: boolean
}

interface DataTableProps {
    columns: Column[]
    data: any[]
    onRowClick?: (row: any) => void
    currentPage: number
    itemsPerPage: number
    totalItems: number
    onPageChange: (page: number) => void
    onItemsPerPageChange: (items: number) => void
    isLoading?: boolean
}

export default function DataTable({
                                      columns,
                                      data,
                                      onRowClick,
                                      currentPage,
                                      itemsPerPage,
                                      totalItems,
                                      onPageChange,
                                      onItemsPerPageChange,
                                      isLoading = false
                                  }: DataTableProps) {
    const [sortColumn, setSortColumn] = useState<string | null>(null)
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

    const isCompact = itemsPerPage < 15 // activa modo compacto por cantidad
    const compactClasses = isCompact ? 'text-xs' : 'text-sm'

    const sortedData = useMemo(() => {
        if (!sortColumn) return data
        const sorted = [...data].sort((a, b) => {
            const valA = a[sortColumn]
            const valB = b[sortColumn]
            if (typeof valA === 'number' && typeof valB === 'number') {
                return sortDirection === 'asc' ? valA - valB : valB - valA
            }
            return sortDirection === 'asc'
                ? String(valA).localeCompare(String(valB))
                : String(valB).localeCompare(String(valA))
        })
        return sorted
    }, [data, sortColumn, sortDirection])

    const handleHeaderClick = (accessor: string) => {
        if (sortColumn === accessor) {
            setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortColumn(accessor)
            setSortDirection('asc')
        }
    }

    const totalPages = Math.ceil(totalItems / itemsPerPage)

    const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onItemsPerPageChange(Number(e.target.value))
    }

    return (
        <div className={`overflow-x-auto ${compactClasses} sm:text-sm`}>
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                <tr>
                    {columns.map((column, index) => (
                        <th
                            key={index}
                            scope="col"
                            onClick={() => column.sortable && handleHeaderClick(column.accessor)}
                            className={`${isCompact ? 'px-2 py-1' : 'px-4 py-2'} text-left font-medium text-gray-500 uppercase tracking-wider ${
                                column.sortable ? 'cursor-pointer hover:text-gray-700' : ''
                            }`}
                        >
                <span className="flex items-center gap-1">
                  {column.header}
                    {sortColumn === column.accessor && (
                        <span>{sortDirection === 'asc' ? '⬆️' : '⬇️'}</span>
                    )}
                </span>
                        </th>
                    ))}
                </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                    <tr>
                        <td colSpan={columns.length} className={`${isCompact ? 'px-2 py-2' : 'px-4 py-4'} text-center`}>
                            <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500"></div>
                            </div>
                        </td>
                    </tr>
                ) : sortedData.length === 0 ? (
                    <tr>
                        <td colSpan={columns.length} className={`${isCompact ? 'px-2 py-2' : 'px-4 py-4'} text-center`}>
                            No se encontraron registros
                        </td>
                    </tr>
                ) : (
                    sortedData.map((row, rowIndex) => (
                        <tr
                            key={rowIndex}
                            onClick={() => onRowClick && onRowClick(row)}
                            className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                        >
                            {columns.map((column, colIndex) => (
                                <td key={colIndex} className={`${isCompact ? 'px-2 py-1' : 'px-4 py-2'} whitespace-nowrap`}>
                                    {column.render ? column.render(row[column.accessor], row) : row[column.accessor]}
                                </td>
                            ))}
                        </tr>
                    ))
                )}
                </tbody>
            </table>

            {/* Paginación */}
            <div className="flex flex-col items-center mt-4 space-y-3">
                <div>
    <span className="text-sm text-gray-700">
      Mostrando {Math.min(itemsPerPage * (currentPage - 1) + 1, totalItems)}-
        {Math.min(itemsPerPage * currentPage, totalItems)} de {totalItems} registros
    </span>
                </div>

                <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">Filas por página:</span>
                    <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="border rounded px-2 py-1 text-sm"
                        disabled={isLoading}
                    >
                        {[5, 10, 25, 50].map(size => (
                            <option key={size} value={size}>{size}</option>
                        ))}
                    </select>
                </div>

                {/* Botones centrados */}
                <div className="flex items-center justify-center space-x-1 text-sm">
                    <button
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                        className={`px-3 py-1 rounded-l border ${
                            currentPage === 1 || isLoading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-100'
                        }`}
                    >
                        Anterior
                    </button>

                    <span className="px-3 py-1 border-t border-b">
      {currentPage} / {totalPages}
    </span>

                    <button
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                        className={`px-3 py-1 rounded-r border ${
                            currentPage === totalPages || isLoading
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-white hover:bg-gray-100'
                        }`}
                    >
                        Siguiente
                    </button>
                </div>
            </div>

        </div>
    )
}
