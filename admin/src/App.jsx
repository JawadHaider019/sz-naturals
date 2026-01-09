import { useEffect } from 'react'
import { Routes, Route } from 'react-router-dom'
import { ToastContainer } from 'react-toastify';
import { useAuth } from './context/AuthContext';

import Navbar from './components/Navbar.jsx'
import Login from './components/Login.jsx'
import Footer from './components/Footer.jsx'

import Add from './pages/Add.jsx'
import List from './pages/List.jsx'
import Orders from './pages/Orders.jsx'
import Dashboard from './pages/Dashboard.jsx';
import Setting from './pages/Setting.jsx';
import ContentManagement from './components/ContentManagement/ContentManagement.jsx';

export const backendUrl = import.meta.env.VITE_BACKEND_URL;
export const currency = 'Rs.'
import Favicon from './components/Favicon.jsx';

const App = () => {
    const { token, loading } = useAuth();

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className='bg-gray-50 min-h-screen'>
              <Favicon />
            <ToastContainer />
            
            {/* Simple conditional rendering - no protected routes */}
            {!token ? (
                // Show only login page if not authenticated
                <Login />
            ) : (
                // Show full app if authenticated
                <>
                    <hr />
                    <Navbar />
                    <div className='p-4 text-gray-600 text-base'>
                        <Routes>
                            <Route path='/' element={<Dashboard />} />
                            <Route path='/content-management' element={<ContentManagement />} />
                            <Route path='/add' element={<Add />} />
                            <Route path='/list' element={<List />} />
                            <Route path='/orders' element={<Orders />} />
                            <Route path='/settings' element={<Setting />} />
                            
                            {/* Redirect any unknown route to home */}
                            <Route path='*' element={<Dashboard />} />
                        </Routes>
                    </div>
                    <Footer />
                </>
            )}
        </div>
    )
}

export default App