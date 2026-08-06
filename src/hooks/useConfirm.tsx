import { useCallback, useState } from 'react';
import { Modal } from '../components/Modal';

interface ConfirmState {
  open: boolean;
  message: string;
  confirmLabel?: string;
  resolve?: (value: boolean) => void;
}

export const useConfirm = () => {
  const [state, setState] = useState<ConfirmState>({ open: false, message: '' });

  const confirm = useCallback((message: string, confirmLabel = 'Delete') => {
    return new Promise<boolean>(resolve => {
      setState({ open: true, message, confirmLabel, resolve });
    });
  }, []);

  const close = useCallback((result: boolean) => {
    setState(s => {
      s.resolve?.(result);
      return { ...s, open: false };
    });
  }, []);

  const dialog = (
    <Modal isOpen={state.open} onClose={() => close(false)} title="Are you sure?">
      <p className="muted confirm-message">{state.message}</p>
      <div className="form-actions">
        <button type="button" className="btn btn-secondary" onClick={() => close(false)}>Cancel</button>
        <button type="button" className="btn btn-danger" onClick={() => close(true)}>
          {state.confirmLabel || 'Delete'}
        </button>
      </div>
    </Modal>
  );

  return [dialog, confirm] as const;
};
