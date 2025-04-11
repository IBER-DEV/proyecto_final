import { Contract, Payment, ContractStatus, PaymentStatus } from '../types';
import { supabase } from './supabase';

// Definir las transiciones permitidas para contratos
const contractStatusTransitions: Record<ContractStatus, ContractStatus[]> = {
  draft: ['pending', 'cancelled'],
  pending: ['active', 'cancelled'],
  active: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
};

// Definir las transiciones permitidas para pagos
const paymentStatusTransitions: Record<PaymentStatus, PaymentStatus[]> = {
  pending: ['processing', 'completed'],
  processing: ['completed'],
  completed: [],
  failed: ['pending'],
};

export const ContractStatusManager = {
  canTransition: (from: ContractStatus, to: ContractStatus): boolean => {
    return contractStatusTransitions[from].includes(to);
  },

  getAvailableTransitions: (status: ContractStatus): ContractStatus[] => {
    return contractStatusTransitions[status];
  },

  getStatusColor: (status: ContractStatus): string => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  getStatusDescription: (status: ContractStatus): string => {
    switch (status) {
      case 'draft':
        return 'Contract is being prepared';
      case 'pending':
        return 'Waiting for signatures';
      case 'active':
        return 'Contract is currently active';
      case 'completed':
        return 'Contract has been completed';
      case 'cancelled':
        return 'Contract has been cancelled';
      default:
        return '';
    }
  },

  async updateStatus(contract: Contract, newStatus: ContractStatus) {
    if (!contract.id) {
      throw new Error('El ID del contrato no está definido');
    }

    if (!this.canTransition(contract.status, newStatus)) {
      throw new Error(
        `Transición inválida de ${contract.status} a ${newStatus}`
      );
    }

    // Obtener el usuario autenticado
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      console.error('Error de autenticación:', authError?.message);
      throw new Error('Usuario no autenticado');
    }
    const userId = userData.user.id;
    console.log('User ID:', userId); // Depuración

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      console.error('Error al obtener perfil:', profileError.message);
      throw new Error(
        `No se pudo obtener el perfil del usuario: ${profileError.message}`
      );
    }
    if (!profile) {
      console.error('Perfil no encontrado para user_id:', userId);
      throw new Error('No se encontró un perfil para este usuario');
    }

    // Validaciones según el rol
    if (profile.role === 'employer') {
      if (contract.status === 'pending' && newStatus === 'active') {
        if (!contract.signed_by_worker) {
          throw new Error(
            'El trabajador debe firmar antes de activar el contrato'
          );
        }
      } else if (
        contract.status === 'active' &&
        !['completed', 'cancelled'].includes(newStatus)
      ) {
        throw new Error(
          'Los contratos activos solo pueden completarse o cancelarse'
        );
      }
    } else if (profile.role === 'worker') {
      if (contract.status === 'pending' && newStatus === 'active') {
        if (!contract.signed_by_employer) {
          throw new Error(
            'El empleador debe firmar antes de activar el contrato'
          );
        }
      } else {
        throw new Error(
          'Los trabajadores solo pueden activar contratos pendientes'
        );
      }
    } else {
      throw new Error('Rol de usuario no válido');
    }

    // Actualizar el estado en Supabase
    const { data, error } = await supabase
      .from('contracts')
      .update({ status: newStatus })
      .eq('id', contract.id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar estado:', error.message);
      throw new Error(`Error al actualizar el estado: ${error.message}`);
    }

    return data;
  },
};

export const PaymentStatusManager = {
  canTransition: (from: PaymentStatus, to: PaymentStatus): boolean => {
    return paymentStatusTransitions[from].includes(to);
  },

  getAvailableTransitions: (status: PaymentStatus): PaymentStatus[] => {
    return paymentStatusTransitions[status];
  },
  getStatusColor: (status: PaymentStatus): string => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  },

  getStatusDescription: (status: PaymentStatus): string => {
    switch (status) {
      case 'pending':
        return 'Payment is scheduled';
      case 'processing':
        return 'Payment is being processed';
      case 'completed':
        return 'Payment has been completed';
      case 'failed':
        return 'Payment failed to process';
      default:
        return '';
    }
  },

  async updateStatus(payment: Payment, newStatus: PaymentStatus) {
    if (!payment.id) {
      throw new Error('El ID del pago no está definido');
    }

    if (!this.canTransition(payment.status, newStatus)) {
      console.log('Transición inválida detectada:', {
        currentStatus: payment.status,
        newStatus: newStatus,
        allowedTransitions: this.getAvailableTransitions(payment.status),
      });
      throw new Error(
        `Invalid status transition from ${payment.status} to ${newStatus}`
      );
    }
    // Obtener el usuario autenticado
    const { data: userData, error: authError } = await supabase.auth.getUser();
    if (authError || !userData?.user) {
      throw new Error('Usuario no autenticado');
    }
    const userId = userData.user.id;
    console.log('User ID:', userId);

    // Obtener el perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error al obtener perfil:', profileError?.message);
      throw new Error('No se pudo obtener el perfil del usuario');
    }
    console.log('Profile:', { id: profile.id, role: profile.role });

    // Validar permisos según el rol
    if (profile.role !== 'employer') {
      throw new Error('Solo los empleadores pueden modificar estados de pago');
    }
    // Depuración del pago
    console.log('Payment Details:', {
      id: payment.id,
      contract_id: payment.contract_id,
      status: payment.status,
      newStatus: newStatus,
    });

    // Verificar que el empleador es dueño del contrato asociado al pago
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .select('employer_id')
      .eq('id', payment.contract_id)
      .single();

    if (contractError || !contract) {
      throw new Error('No se pudo verificar el contrato asociado al pago');
    }
    if (contract.employer_id !== profile.id) {
      throw new Error('No tienes permiso para modificar este pago');
    }

    // Actualizar el estado del pago
    const { data, error } = await supabase
      .from('payments')
      .update({ status: newStatus })
      .eq('id', payment.id)
      .select()
      .single();

    if (error) {
      console.error('Error al actualizar estado:', error.message);
      throw new Error(`Error al actualizar el estado: ${error.message}`);
    }
    return data;
  },
};
