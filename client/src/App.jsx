import React, { Suspense, lazy } from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Footer from './components/Footer'
import Layout from './pages/hotelOwner/Layout'
import Dashboard from './pages/hotelOwner/Dashboard'
import AddRoom from './pages/hotelOwner/AddRoom'
import ListRooms from './pages/hotelOwner/ListRoom'
import Bookings from './pages/hotelOwner/Bookings'
import EditRoom from './pages/hotelOwner/EditRoom'
import HotelInfo from './pages/hotelOwner/HotelInfo'
import ManagePromotions from './pages/hotelOwner/ManagePromotions'
import OwnerInbox from './pages/hotelOwner/OwnerInbox'
import OccupancyCalendar from './pages/hotelOwner/OccupancyCalendar'
import RefundRequests from './pages/hotelOwner/RefundRequests'
import CheckInOut from './pages/hotelOwner/CheckInOut'
import RevenueManagement from './pages/hotelOwner/RevenueManagement'
import HousekeepingBoard from './pages/hotelOwner/HousekeepingBoard'
import NightAudit from './pages/hotelOwner/NightAudit'
import { Toaster } from 'react-hot-toast'
import { useAppContext } from './context/appContextCore'



const Home = lazy(() => import('./pages/Home'))
const AllRooms = lazy(() => import('./pages/AllRooms'))
const RoomDetails = lazy(() => import('./pages/RoomDetails'))
const MyBookings = lazy(() => import('./pages/MyBookings'))
const HotelReg = lazy(() => import('./components/HotelReg'))
const BookingDetail = lazy(() => import('./pages/BookingDetail'))
const BookingSuccess = lazy(() => import('./pages/BookingSuccess'))
const EmailPreview = lazy(() => import('./pages/EmailPreview/EmailPreview'))
const PromotionDetails = lazy(() => import('./pages/PromotionDetails'))
const AllPromotions = lazy(() => import('./pages/AllPromotions'))
const Experiences = lazy(() => import('./pages/Experiences'))
const AboutUs = lazy(() => import('./pages/AboutUs'))
const HotelDetails = lazy(() => import('./pages/HotelDetails'))
import SmoothScroll from './components/SmoothScroll'

const PageLoader = () => (
  <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/80 backdrop-blur-sm">
    <div className="flex flex-col items-center gap-3">
      <div className="h-9 w-9 rounded-full border-2 border-slate-300 border-t-gray-900 animate-spin" />
      <p className="text-xs font-medium tracking-[0.2em] text-gray-500">
        ĐANG TẢI
      </p>
    </div>
  </div>
)

export const App = () => {
  const { pathname } = useLocation()
  const isOwnerPath = pathname.includes('owner')
  const { showHotelReg } = useAppContext();


  return (
    <div>
      <Toaster />
      {!isOwnerPath && <Navbar />}
      {showHotelReg && <HotelReg />}
      <div className={isOwnerPath ? '' : 'min-h-[70vh]'}>
        <Suspense fallback={<PageLoader />}>
          <div key={pathname} className={isOwnerPath ? '' : 'route-fade-slide'}>
            {/* SmoothScroll chỉ cho trang public, tắt cho admin */}
            {isOwnerPath ? (
              <Routes>
                <Route path="/owner" element={<Layout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="bookings" element={<Bookings />} />
                  <Route path="check-in-out" element={<CheckInOut />} />
                  <Route path="add-room" element={<AddRoom />} />
                  <Route path="list-rooms" element={<ListRooms />} />
                  <Route path="edit-room/:id" element={<EditRoom />} />
                  <Route path="inbox" element={<OwnerInbox />} />
                  <Route path="hotel-info" element={<HotelInfo />} />
                  <Route path="promotions" element={<ManagePromotions />} />
                  <Route path="calendar" element={<OccupancyCalendar />} />
                  <Route path="refund-requests" element={<RefundRequests />} />
                  <Route path="revenue" element={<RevenueManagement />} />
                  <Route path="housekeeping" element={<HousekeepingBoard />} />
                  <Route path="night-audit" element={<NightAudit />} />
                </Route>
              </Routes>
            ) : (
              <SmoothScroll>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/rooms" element={<AllRooms />} />
                  <Route path="/hotels/:hotelId" element={<HotelDetails />} />
                  <Route path="/rooms/:id" element={<RoomDetails />} />
                  <Route path="/promotions" element={<AllPromotions />} />
                  <Route path="/promotions/:id" element={<PromotionDetails />} />
                  <Route path="/experiences" element={<Experiences />} />
                  <Route path="/about" element={<AboutUs />} />
                  <Route path="/my-bookings" element={<MyBookings />} />
                  <Route path="/booking/:id" element={<BookingDetail />} />
                  <Route path="/booking-success" element={<BookingSuccess />} />
                  <Route path="/email-preview" element={<EmailPreview />} />
                </Routes>
              </SmoothScroll>
            )}
          </div>
        </Suspense>
      </div>
      {!isOwnerPath && <Footer />}
    </div>
  )
}

export default App
