import { usePrivateAccessContext } from '../context/PrivateAccessContext';

export const usePrivateAccess = () => {
  return usePrivateAccessContext();
};
