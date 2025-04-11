import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { Bell } from 'lucide-react';

interface Notification {
  id: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export function Notifications() {
  const { user } = useAuthStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    console.log('Usuario autenticado:', user);
    if (!user) return;

    const handleContractEvent = (payload: any) => {
      console.log('Evento de contrato detectado:', payload);
      const endDate = payload.new.end_date ? new Date(payload.new.end_date) : null;
      if (endDate) {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Normaliza a medianoche para evitar errores de hora
        const daysDiff = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        console.log('Days diff:', daysDiff);
        if (daysDiff <= 7 && daysDiff > 0) {
          const message = `El contrato ${payload.new.title} vence en ${daysDiff} días`;
          console.log('Notificación generada:', message);
          setNotifications(prev => [
            { id: payload.new.id, message, type: 'contract', is_read: false, created_at: new Date().toISOString() },
            ...prev,
          ]);
        }
      }
    };

    // Suscripción a INSERT y UPDATE para contratos
    const contractChannel = supabase
      .channel('contracts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'contracts' },
        handleContractEvent
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'contracts' },
        handleContractEvent
      )
      .subscribe((status) => console.log('Estado del canal de contratos:', status));

    // Suscripción a pagos (mantenida como estaba)
    const paymentChannel = supabase
      .channel('payments')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'payments', filter: 'status=eq.pending' },
        async (payload) => {
          console.log('Evento de pago detectado:', payload);
          const { data: contract } = await supabase
            .from('contracts')
            .select('title')
            .eq('id', payload.new.contract_id)
            .single();
          const paymentDate = new Date(payload.new.payment_date);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const daysDiff = Math.ceil((paymentDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff <= 3) {
            const message =
              daysDiff >= 0
                ? `Pago pendiente para ${contract?.title || 'Contrato desconocido'} en ${daysDiff} días`
                : `Pago vencido para ${contract?.title || 'Contrato desconocido'} hace ${Math.abs(daysDiff)} días`;
            setNotifications(prev => [
              { id: payload.new.id, message, type: 'payment', is_read: false, created_at: new Date().toISOString() },
              ...prev,
            ]);
          }
        }
      )
      .subscribe((status) => console.log('Estado del canal de pagos:', status));

    return () => {
      supabase.removeChannel(contractChannel);
      supabase.removeChannel(paymentChannel);
    };
  }, [user]);

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="p-2 rounded-full hover:bg-gray-200 focus:outline-none"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-600 text-white text-xs rounded-full flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-10">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500 mt-2">No hay notificaciones nuevas</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className="p-2 bg-gray-50 rounded flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-700">{notification.message}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}