import React, { useState, useCallback } from 'react';
import { Contract, Payment, ContractStatus, PaymentStatus } from '../types';
import {
  ContractStatusManager,
  PaymentStatusManager,
} from '../lib/statusManager';
import { toast } from 'react-toastify';

// Status Badge Component (Reutilizable)
interface StatusBadgeProps {
  status: string;
  colorClass: string;
}

const StatusBadge = React.memo(({ status, colorClass }: StatusBadgeProps) => {
  const statusDescription = getStatusDescription(status);
  return (
    <span
      title={statusDescription}
      aria-label={statusDescription}
      className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${colorClass}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
});

function getStatusDescription(status) {
  return (
    ContractStatusManager.getStatusDescription(status) ||
    PaymentStatusManager.getStatusDescription(status) ||
    'Unknown Status'
  );
}

// Status Action Button (Reutilizable con feedback visual)
const StatusActionButton = React.memo(
  ({ onClick, label, colorClass = 'bg-blue-600', disabled = false }) => {
    const [loading, setLoading] = useState(false);

    const handleClick = async () => {
      setLoading(true);
      await onClick();
      setLoading(false);
    };

    return (
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        aria-label={`Change status to ${label}`}
        className={`inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-white ${colorClass} ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
        }`}
      >
        {loading ? 'Updating...' : label}
      </button>
    );
  }
);

// Generic Status Actions Component
function StatusActions({
  entity,
  userRole,
  currentStatus,
  statusManager,
  canUpdateStatus,
  onStatusUpdate,
  getButtonColor,
}: {
  entity: Contract | Payment;
  userRole: string;
  currentStatus: ContractStatus | PaymentStatus;
  statusManager: typeof ContractStatusManager | typeof PaymentStatusManager;
  canUpdateStatus: (entity: Contract | Payment, newStatus: string, userRole: string) => boolean;
  onStatusUpdate: (newStatus: string) => Promise<void>;
  getButtonColor: (status: string) => string;
}) {
  const availableTransitions =
    statusManager.getAvailableTransitions(currentStatus as any);

  const handleStatusUpdate = useCallback(
    async (newStatus) => {
      if (!canUpdateStatus(entity, newStatus, userRole)) return;
      if (['cancelled', 'failed'].includes(newStatus)) {
        const confirmed = window.confirm(
          `¿Estás seguro de cambiar el estado a ${newStatus}?`
        );
        if (!confirmed) return;
      }
      try {
        await onStatusUpdate(newStatus);
        toast.success(`Estado actualizado a ${newStatus}`);
      } catch (error) {
        console.error('Error updating status:', error);
        toast.error('Error al actualizar el estado');
      }
    },
    [entity, userRole, canUpdateStatus, onStatusUpdate]
  );

  return (
    <div className="flex space-x-2">
      <StatusBadge
        status={currentStatus}
        colorClass={statusManager.getStatusColor(currentStatus)}
      />
      <div className="flex space-x-2">
        {availableTransitions.map((newStatus) => (
          <StatusActionButton
            key={newStatus}
            onClick={() => handleStatusUpdate(newStatus)}
            label={newStatus.charAt(0).toUpperCase() + newStatus.slice(1)}
            disabled={!canUpdateStatus(entity, newStatus, userRole)}
            colorClass={getButtonColor(newStatus)}
          />
        ))}
      </div>
    </div>
  );
}

// Specific Rules for Contracts & Payments
const canUpdateContractStatus = (contract, newStatus, userRole) => {
  const rules = {
    draft: { employer: ['pending'] },
    pending: { employer: ['cancelled'], worker: ['active'] },
    active: { employer: ['completed', 'cancelled'] },
  };
  return rules[contract.status]?.[userRole]?.includes(newStatus) || false;
};

const canUpdatePaymentStatus = (payment, newStatus, userRole) => {
  if (userRole !== 'employer') return false;
  const rules = {
    pending: ['processing', 'failed'],
    processing: ['completed', 'failed'],
    failed: ['pending'],
  };
  return rules[payment.status]?.includes(newStatus) || false;
};

// Specific Components for Contracts & Payments
export function ContractStatusActions({ contract, userRole, onStatusUpdate }) {
  return (
    <StatusActions
      entity={contract}
      userRole={userRole}
      currentStatus={contract.status}
      statusManager={ContractStatusManager}
      canUpdateStatus={canUpdateContractStatus}
      onStatusUpdate={onStatusUpdate}
      getButtonColor={(status) =>
        status === 'cancelled' ? 'bg-red-600' : 'bg-blue-600'
      }
    />
  );
}

export function PaymentStatusActions({ payment, userRole, onStatusUpdate }) {
  return (
    <StatusActions
      entity={payment}
      userRole={userRole}
      currentStatus={payment.status}
      statusManager={PaymentStatusManager}
      canUpdateStatus={canUpdatePaymentStatus}
      onStatusUpdate={onStatusUpdate}
      getButtonColor={(status) =>
        status === 'failed' ? 'bg-red-600' : 'bg-green-600'
      }
    />
  );
}
