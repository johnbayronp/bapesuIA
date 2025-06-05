import { toast } from 'react-toastify';

const useToast = () => {
  const showSuccess = (message) => {
    toast.success(message, { position: 'top-center' });
  };

  const showError = (message) => {
    toast.error(message, { position: 'top-center' });
  };

  const showPromise = (promise, messages) => {
    toast.promise(promise, messages, { position: 'top-center' });
  };

  return { showSuccess, showError, showPromise };
};

export default useToast; 