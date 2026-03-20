import React, { useEffect } from 'react'
import Navbar from '../../components/hotelOwner/Navbar'
import Sidebar from '../../components/hotelOwner/Sidebar'
import { Outlet } from 'react-router-dom'
import { useAppContext } from '../../context/appContextCore'


const Layout = () => {
    const { isOwner, isOwnerResolved, navigate } = useAppContext()

    useEffect(() => {
        if (isOwnerResolved && !isOwner) {
            navigate('/', { replace: true })
        }
    }, [isOwner, isOwnerResolved, navigate])

    if (!isOwnerResolved || !isOwner) return null

    return (
        <div className="flex h-screen flex-col overflow-hidden">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-4 pt-10 md:px-10"
                    style={{ willChange: 'scroll-position' }}>
                    <Outlet />
                </main>
            </div>
        </div>
    )
}

export default Layout
