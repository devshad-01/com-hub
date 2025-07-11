// Import the new AuthContext hook instead
import { useAuth as useAuthContext } from '../contexts/AuthContext';

// Re-export the context hook
export const useAuth = useAuthContext;
