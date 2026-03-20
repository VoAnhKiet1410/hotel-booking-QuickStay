/**
 * Revenue Management Controller
 * 
 * Provides analytics endpoints for hotel owners
 * to track revenue KPIs, trends, and room performance.
 */
import Booking from '../models/Booking.js';
import Hotel from '../models/Hotel.js';
import Room from '../models/Room.js';
import {
    calculateADR,
    calculateRevPAR,
    calculateOccupancyRate,
    calculateCancellationRate
} from '../utils/revenueUtils.js';


/**
 * GET /api/revenue/owner/analytics
 * Query: ?year=2026&month=3 (optional)
 * 
 * Returns comprehensive revenue analytics for all owner's hotels.
 */
export const getOwnerRevenueAnalytics = async (req, res) => {
    try {
        const user = req.user;
        const requestedYear = parseInt(req.query.year) || new Date().getFullYear();
        const requestedMonth = req.query.month ? parseInt(req.query.month) : null;

        // Get all hotels owned by user
        const ownerHotels = await Hotel.find({ owner: user._id })
            .select('_id name')
            .lean();
        const hotelIds = ownerHotels.map(h => h._id);

        if (hotelIds.length === 0) {
            return res.json({
                success: true,
                data: _emptyAnalytics(requestedYear, requestedMonth)
            });
        }

        // Build date range for the requested period
        let periodStart, periodEnd;
        if (requestedMonth) {
            // Specific month
            periodStart = new Date(requestedYear, requestedMonth - 1, 1);
            periodEnd = new Date(requestedYear, requestedMonth, 0, 23, 59, 59);
        } else {
            // Full year
            periodStart = new Date(requestedYear, 0, 1);
            periodEnd = new Date(requestedYear, 11, 31, 23, 59, 59);
        }

        // --- Aggregation Pipeline ---
        const aggregated = await Booking.aggregate([
            { $match: { hotel: { $in: hotelIds } } },
            {
                $facet: {
                    // 1. Period totals (filtered by date)
                    periodTotals: [
                        {
                            $match: {
                                createdAt: { $gte: periodStart, $lte: periodEnd }
                            }
                        },
                        {
                            $group: {
                                _id: null,
                                totalBookings: { $sum: 1 },
                                totalRevenue: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ['$isPaid', true] },
                                                    { $ne: ['$status', 'cancelled'] }
                                                ]
                                            },
                                            '$totalPrice', 0
                                        ]
                                    }
                                },
                                totalNightsSold: {
                                    $sum: {
                                        $cond: [
                                            {
                                                $and: [
                                                    { $eq: ['$isPaid', true] },
                                                    {
                                                        $in: [
                                                            '$status',
                                                            ['completed', 'checked_in', 'confirmed']
                                                        ]
                                                    }
                                                ]
                                            },
                                            {
                                                $divide: [
                                                    { $subtract: ['$checkOutDate', '$checkInDate'] },
                                                    86400000
                                                ]
                                            },
                                            0
                                        ]
                                    }
                                },
                                cancelledCount: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ['$status', 'cancelled'] },
                                            1, 0
                                        ]
                                    }
                                },
                                totalRefundAmount: {
                                    $sum: {
                                        $cond: [
                                            { $eq: ['$isRefunded', true] },
                                            '$refundAmount', 0
                                        ]
                                    }
                                }
                            }
                        }
                    ],

                    // 2. Monthly revenue for the year (always 12 months)
                    monthlyRevenue: [
                        {
                            $match: {
                                createdAt: {
                                    $gte: new Date(requestedYear, 0, 1),
                                    $lte: new Date(requestedYear, 11, 31, 23, 59, 59)
                                },
                                isPaid: true,
                                status: { $ne: 'cancelled' }
                            }
                        },
                        {
                            $group: {
                                _id: { $month: '$createdAt' },
                                revenue: { $sum: '$totalPrice' },
                                bookings: { $sum: 1 },
                                nightsSold: {
                                    $sum: {
                                        $divide: [
                                            { $subtract: ['$checkOutDate', '$checkInDate'] },
                                            86400000
                                        ]
                                    }
                                }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],

                    // 3. Revenue by room type
                    byRoomType: [
                        {
                            $match: {
                                createdAt: { $gte: periodStart, $lte: periodEnd },
                                isPaid: true,
                                status: { $ne: 'cancelled' }
                            }
                        },
                        {
                            $lookup: {
                                from: 'rooms',
                                localField: 'room',
                                foreignField: '_id',
                                as: 'roomInfo'
                            }
                        },
                        { $unwind: { path: '$roomInfo', preserveNullAndEmptyArrays: true } },
                        {
                            $group: {
                                _id: '$roomInfo.roomType',
                                revenue: { $sum: '$totalPrice' },
                                bookings: { $sum: 1 },
                                nightsSold: {
                                    $sum: {
                                        $divide: [
                                            { $subtract: ['$checkOutDate', '$checkInDate'] },
                                            86400000
                                        ]
                                    }
                                }
                            }
                        },
                        { $sort: { revenue: -1 } }
                    ],

                    // 4. Revenue by payment method
                    byPaymentMethod: [
                        {
                            $match: {
                                createdAt: { $gte: periodStart, $lte: periodEnd },
                                isPaid: true,
                                status: { $ne: 'cancelled' }
                            }
                        },
                        {
                            $group: {
                                _id: '$paymentMethod',
                                revenue: { $sum: '$totalPrice' },
                                count: { $sum: 1 }
                            }
                        }
                    ],

                    // 5. Daily revenue trend (last 30 days from period end)
                    dailyRevenue: [
                        {
                            $match: {
                                createdAt: {
                                    $gte: new Date(
                                        periodEnd.getTime() - 30 * 86400000
                                    ),
                                    $lte: periodEnd
                                },
                                isPaid: true,
                                status: { $ne: 'cancelled' }
                            }
                        },
                        {
                            $group: {
                                _id: {
                                    $dateToString: {
                                        format: '%Y-%m-%d',
                                        date: '$createdAt'
                                    }
                                },
                                revenue: { $sum: '$totalPrice' },
                                bookings: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);

        // --- Process Results ---
        const periodTotals = aggregated?.[0]?.periodTotals?.[0] || {
            totalBookings: 0,
            totalRevenue: 0,
            totalNightsSold: 0,
            cancelledCount: 0,
            totalRefundAmount: 0
        };

        // Room capacity for occupancy calculation
        const roomsAgg = await Room.aggregate([
            { $match: { hotel: { $in: hotelIds } } },
            {
                $group: {
                    _id: '$roomType',
                    totalRooms: { $sum: '$totalRooms' },
                    avgPrice: { $avg: '$pricePerNight' }
                }
            }
        ]);
        const totalRoomsCapacity = roomsAgg.reduce((sum, r) => sum + r.totalRooms, 0);

        // Days in period
        const daysInPeriod = requestedMonth
            ? new Date(requestedYear, requestedMonth, 0).getDate()
            : (
                // For current year, use days elapsed; for past years, use 365
                requestedYear === new Date().getFullYear()
                    ? Math.ceil(
                        (Math.min(Date.now(), periodEnd.getTime()) - periodStart.getTime())
                        / 86400000
                    ) || 1
                    : 365
            );

        const totalAvailableNights = totalRoomsCapacity * daysInPeriod;

        // KPIs
        const adr = calculateADR(periodTotals.totalRevenue, periodTotals.totalNightsSold);
        const revpar = calculateRevPAR(periodTotals.totalRevenue, totalAvailableNights);
        const occupancyRate = calculateOccupancyRate(
            periodTotals.totalNightsSold,
            totalAvailableNights
        );
        const cancellationRate = calculateCancellationRate(
            periodTotals.cancelledCount,
            periodTotals.totalBookings
        );

        // Monthly revenue (fill all 12 months)
        const monthNames = [
            'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
            'T7', 'T8', 'T9', 'T10', 'T11', 'T12'
        ];
        const monthlyRevenueRaw = aggregated?.[0]?.monthlyRevenue || [];
        const monthlyRevenue = monthNames.map((name, idx) => {
            const data = monthlyRevenueRaw.find(m => m._id === idx + 1);
            return {
                month: name,
                revenue: data?.revenue || 0,
                bookings: data?.bookings || 0,
                nightsSold: data?.nightsSold || 0
            };
        });

        // Revenue by room type
        const byRoomTypeRaw = aggregated?.[0]?.byRoomType || [];
        const revenueByRoomType = byRoomTypeRaw.map(rt => {
            const roomCap = roomsAgg.find(r => r._id === rt._id);
            const roomAvailNights = (roomCap?.totalRooms || 0) * daysInPeriod;
            return {
                roomType: rt._id || 'Không xác định',
                revenue: rt.revenue,
                bookings: rt.bookings,
                nightsSold: Math.round(rt.nightsSold),
                adr: rt.nightsSold > 0
                    ? Math.round(rt.revenue / rt.nightsSold)
                    : 0,
                occupancy: roomAvailNights > 0
                    ? Math.min(100, Math.round((rt.nightsSold / roomAvailNights) * 100))
                    : 0,
                totalRooms: roomCap?.totalRooms || 0
            };
        });

        // Payment method breakdown
        const paymentMethodRaw = aggregated?.[0]?.byPaymentMethod || [];
        const paymentBreakdown = paymentMethodRaw.map(pm => ({
            method: pm._id === 'stripe' ? 'Stripe' : 'Tại khách sạn',
            key: pm._id,
            revenue: pm.revenue,
            count: pm.count
        }));

        // Daily revenue trend
        const dailyRevenueRaw = aggregated?.[0]?.dailyRevenue || [];
        const dailyRevenue = _fillDailyGaps(dailyRevenueRaw, periodEnd);

        return res.json({
            success: true,
            data: {
                period: {
                    year: requestedYear,
                    month: requestedMonth,
                    daysInPeriod,
                    totalRoomsCapacity,
                    totalAvailableNights
                },
                kpis: {
                    totalRevenue: periodTotals.totalRevenue,
                    totalBookings: periodTotals.totalBookings,
                    totalNightsSold: Math.round(periodTotals.totalNightsSold),
                    cancelledCount: periodTotals.cancelledCount,
                    totalRefundAmount: periodTotals.totalRefundAmount,
                    adr,
                    revpar,
                    occupancyRate,
                    cancellationRate
                },
                monthlyRevenue,
                revenueByRoomType,
                paymentBreakdown,
                dailyRevenue
            }
        });
    } catch (error) {
        console.error('getOwnerRevenueAnalytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi server khi tải dữ liệu doanh thu.'
        });
    }
};


/**
 * Fill daily gaps in revenue data for a 30-day window.
 */
function _fillDailyGaps(rawData, endDate) {
    const result = [];
    const dataMap = {};
    rawData.forEach(d => { dataMap[d._id] = d; });

    for (let i = 29; i >= 0; i--) {
        const date = new Date(endDate.getTime() - i * 86400000);
        const key = date.toISOString().split('T')[0];
        const dayLabel = `${date.getDate()}/${date.getMonth() + 1}`;
        result.push({
            date: key,
            label: dayLabel,
            revenue: dataMap[key]?.revenue || 0,
            bookings: dataMap[key]?.bookings || 0
        });
    }
    return result;
}

/**
 * Return empty analytics structure for owners with no hotels.
 */
function _emptyAnalytics(year, month) {
    const monthNames = [
        'T1', 'T2', 'T3', 'T4', 'T5', 'T6',
        'T7', 'T8', 'T9', 'T10', 'T11', 'T12'
    ];
    return {
        period: { year, month, daysInPeriod: 0, totalRoomsCapacity: 0, totalAvailableNights: 0 },
        kpis: {
            totalRevenue: 0, totalBookings: 0, totalNightsSold: 0,
            cancelledCount: 0, totalRefundAmount: 0,
            adr: 0, revpar: 0, occupancyRate: 0, cancellationRate: 0
        },
        monthlyRevenue: monthNames.map(m => ({
            month: m, revenue: 0, bookings: 0, nightsSold: 0
        })),
        revenueByRoomType: [],
        paymentBreakdown: [],
        dailyRevenue: []
    };
}
