/**
 * Utilities for calculating Revenue Management KPIs.
 * 
 * ADR (Average Daily Rate) = Total Revenue / Total Nights Sold
 * RevPAR (Revenue Per Available Room) = ADR * Occupancy Rate
 * or RevPAR = Total Revenue / Total Available Rooms
 */

/**
 * Calculates Average Daily Rate (ADR)
 * @param {number} totalRevenue - Thường chỉ tính trên những booking đã thanh toán và hoàn thành
 * @param {number} totalNightsSold - Tổng số đêm của các booking đã hoàn thành
 * @returns {number} ADR value
 */
export const calculateADR = (totalRevenue, totalNightsSold) => {
    if (!totalNightsSold || totalNightsSold <= 0) return 0;
    return Math.round(totalRevenue / totalNightsSold);
};

/**
 * Calculates Revenue Per Available Room (RevPAR)
 * @param {number} adr - Average Daily Rate
 * @param {number} totalNightsSold - Tổng số đêm đã bán
 * @param {number} totalRoomsCapacity - Tổng số phòng có sẵn của khách sạn * Số ngày trong kỳ (ví dụ: tháng/năm)
 *                                      Tuy nhiên để đơn giản theo realtime, ta tính RevPAR dựa trên công suất phòng 1 đêm hoặc 1 khoảng tgian.
 *                                      Cách tính phổ biến: Total Revenue / Total Rooms Available (Capacity).
 *                                      Hoặc: ADR * Occupancy (Nights Sold / Total Nights Available).
 * @returns {number} RevPAR value
 */
export const calculateRevPAR = (totalRevenue, totalAvailableNights) => {
    if (!totalAvailableNights || totalAvailableNights <= 0) return 0;
    return Math.round(totalRevenue / totalAvailableNights);
};

/**
 * Calculates Occupancy Rate (%)
 * @param {number} nightsSold - Tổng số đêm đã bán
 * @param {number} totalAvailableNights - Tổng số đêm có thể bán
 * @returns {number} Occupancy rate as percentage (0-100)
 */
export const calculateOccupancyRate = (nightsSold, totalAvailableNights) => {
    if (!totalAvailableNights || totalAvailableNights <= 0) return 0;
    return Math.min(100, Math.round((nightsSold / totalAvailableNights) * 100));
};

/**
 * Calculates Cancellation Rate (%)
 * @param {number} cancelledCount - Số booking đã hủy
 * @param {number} totalCount - Tổng số booking
 * @returns {number} Cancellation rate as percentage (0-100)
 */
export const calculateCancellationRate = (cancelledCount, totalCount) => {
    if (!totalCount || totalCount <= 0) return 0;
    return Math.round((cancelledCount / totalCount) * 100);
};
