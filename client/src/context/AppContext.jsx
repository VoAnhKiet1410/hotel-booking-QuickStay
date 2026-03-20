import axios from 'axios'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser, useAuth } from '@clerk/clerk-react'
import { AppContext } from './appContextCore'
import { toast } from 'react-hot-toast'

axios.defaults.baseURL = import.meta.env.VITE_BACKEND_URL
axios.defaults.withCredentials = true

export const AppProvider = ({ children }) => {
    const currency = import.meta.env.VITE_CURRENCY || 'VND'
    const navigate = useNavigate()
    const { user } = useUser()
    const { getToken, isLoaded, isSignedIn } = useAuth()

    const [isOwner, setIsOwner] = useState(false)
    const [isOwnerResolved, setIsOwnerResolved] = useState(false)
    const [showHotelReg, setShowHotelReg] = useState(false)
    const [searchedCities, setSearchedCities] = useState([])
    const fetchUserTimeoutRef = useRef(null)
    const jwtTemplate = import.meta.env.VITE_CLERK_JWT_TEMPLATE

    useEffect(() => {
        const interceptorId = axios.interceptors.request.use(
            async (config) => {
                if (!getToken || !isLoaded || !isSignedIn) return config
                const token = await getToken(
                    jwtTemplate ? { template: jwtTemplate } : undefined,
                ).catch(() => null)
                if (token) {
                    if (config.headers && typeof config.headers.set === 'function') {
                        config.headers.set('Authorization', `Bearer ${token}`)
                    } else {
                        config.headers = {
                            ...(config.headers || {}),
                            Authorization: `Bearer ${token}`,
                        }
                    }
                }
                return config
            },
            (error) => Promise.reject(error),
        )

        return () => {
            axios.interceptors.request.eject(interceptorId)
        }
    }, [getToken, isLoaded, isSignedIn, jwtTemplate])

    useEffect(() => {
        let cancelled = false

        const userId = user?.id

        const clearPendingFetchUser = () => {
            if (fetchUserTimeoutRef.current) {
                clearTimeout(fetchUserTimeoutRef.current)
                fetchUserTimeoutRef.current = null
            }
        }

        const scheduleFetchUser = (fn, delayMs) => {
            clearPendingFetchUser()
            fetchUserTimeoutRef.current = setTimeout(fn, delayMs)
        }

        const fetchUser = async (attempt = 0) => {
            try {
                if (!isLoaded) return

                if (!isSignedIn || !userId) {
                    setIsOwner(false)
                    setSearchedCities([])
                    setIsOwnerResolved(true)
                    return
                }

                const token = await getToken(
                    jwtTemplate ? { template: jwtTemplate } : undefined,
                ).catch(() => null)

                if (!token) {
                    setIsOwner(false)
                    setSearchedCities([])
                    setIsOwnerResolved(true)
                    return
                }

                const { data } = await axios.get('/api/users', {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                })
                if (data?.success) {
                    setIsOwner(data.role === 'hotelOwner')
                    setSearchedCities(data.recentSearchedCities || [])
                    setIsOwnerResolved(true)
                } else {
                    setIsOwner(false)
                    setSearchedCities([])
                    setIsOwnerResolved(true)
                    toast.error('Không thể lấy thông tin người dùng')
                }
            } catch (error) {
                if (cancelled) return

                setIsOwner(false)
                setSearchedCities([])
                setIsOwnerResolved(true)

                if (error?.response?.status === 401) {
                    const reason = error?.response?.data?.reason

                    if (reason === 'token_not_active_yet' && attempt < 1) {
                        setIsOwnerResolved(false)
                        scheduleFetchUser(() => fetchUser(attempt + 1), 2000)
                        return
                    }
                    return
                }

                if (attempt === 0) {
                    toast.error('Không thể kết nối máy chủ, vui lòng thử lại')
                }
            }
        }

        if (isSignedIn && userId && isLoaded) {
            scheduleFetchUser(() => {
                setIsOwnerResolved(false)
                fetchUser()
            }, 500)
        } else if (isLoaded && !isSignedIn) {
            scheduleFetchUser(() => {
                setIsOwner(false)
                setSearchedCities([])
                setIsOwnerResolved(true)
            }, 0)
        }
        return () => {
            cancelled = true
            clearPendingFetchUser()
        }
    }, [getToken, isLoaded, isSignedIn, jwtTemplate, user?.id])

    const value = {
        currency,
        navigate,
        user,
        getToken,
        isOwner,
        isOwnerResolved,
        setIsOwner,
        showHotelReg,
        setShowHotelReg,
        searchedCities,
        setSearchedCities,
        axios, // Global singleton import — NOT a per-render instance, safe in deps
    }

    return (
        <AppContext.Provider value={value}>
            {children}
        </AppContext.Provider>
    )
}
