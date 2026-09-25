import { createBrowserRouter } from 'react-router-dom';
import Main from '../pages/Layout';
import Inbox from '../pages/Inbox';
import Deleted from '../pages/deletedMails';
import Starred from '../pages/Starred';
import Mails from '../pages/Mails';
import Sent from '../pages/Sent';
import NotFound from '../pages/NotFound';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import { ProtectedRoute, PublicRoute } from './RouteGuards';

export const router = createBrowserRouter([
    {
        path: '/',
        element: (
            <ProtectedRoute>
                <Main />
            </ProtectedRoute>
        ),
        children: [
            { index: true, element: <Mails /> },
            { path: 'inbox/:id', element: <Inbox /> },
            { path: 'starred', element: <Starred /> },
            { path: 'deleted', element: <Deleted /> },
            { path: 'sent', element: <Sent /> },
            { path: '*', element: <NotFound /> },
        ],
    },
    {
        path: '/login',
        element: (
            <PublicRoute>
                <LoginPage />
            </PublicRoute>
        ),
    },
    {
        path: '/register',
        element: (
            <PublicRoute>
                <RegisterPage />
            </PublicRoute>
        ),
    },
]);