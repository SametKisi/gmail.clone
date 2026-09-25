import { Navigate } from 'react-router-dom';
import {getAuthToken} from '../lib/authClient';

export const ProtectedRoute = ({children}) =>{
  const hasToken = !!getAuthToken();
  if(!hasToken) return <Navigate to="/login" replace />

  return children;
};

export const PublicRoute = ({children}) => {
  const hasToken = !!getAuthToken();
  if(hasToken) return <Navigate to="/" replace />

  return children;
};