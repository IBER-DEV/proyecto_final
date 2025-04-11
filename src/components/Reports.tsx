import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase'; // Asegúrate de que esta ruta sea correcta
import { useAuthStore } from '../store/authStore';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Reports() {
  const { user } = useAuthStore();
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
      if (!user) return;

      // Obtener el ID del perfil del usuario autenticado
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      // Obtener contratos del empleador o trabajador
      const { data: contracts } = await supabase
        .from('contracts')
        .select('id')
        .eq(user.role === 'employer' ? 'employer_id' : 'worker_id', profile.id);

      const contractIds = contracts?.map(c => c.id) || [];

      // Obtener datos del reporte
      const { data, error } = await supabase
        .from('monthly_payment_report')
        .select('*')
        .in('contract_id', contractIds);

      if (error) {
        console.error('Error fetching report:', error);
      } else {
        const formattedData = data.map(d => ({
          month: new Date(d.month).toLocaleString('es-CO', { month: 'short', year: 'numeric' }),
          base_salary: d.total_base_salary,
          overtime: d.total_overtime,
          net_amount: d.total_net,
        }));
        setReportData(formattedData);
      }
      setLoading(false);
    };

    fetchReport();
  }, [user]);

  const exportToCSV = () => {
    const csv = [
      ['Mes', 'Salario Base', 'Horas Extra', 'Neto'],
      ...reportData.map(d => [d.month, d.base_salary, d.overtime, d.net_amount]),
    ]
      .map(row => row.join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'reporte_pagos.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="text-center py-12">Cargando reportes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Reportes de Pagos</h2>
        <button
          onClick={exportToCSV}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Descargar CSV
        </button>
      </div>

      {reportData.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay datos disponibles para mostrar.</p>
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium mb-4">Resumen Mensual</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString('es-CO')}`} />
              <Legend />
              <Bar dataKey="base_salary" fill="#8884d8" name="Salario Base" />
              <Bar dataKey="overtime" fill="#82ca9d" name="Horas Extra" />
              <Bar dataKey="net_amount" fill="#ffc658" name="Neto" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}