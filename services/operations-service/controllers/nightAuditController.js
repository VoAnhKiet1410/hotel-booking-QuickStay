/**
 * nightAuditController.js — API endpoints cho Night Audit
 *
 * Owner có thể:
 * 1. Trigger Night Audit thủ công (POST)
 * 2. Xem lịch sử audit logs (GET)
 * 3. Xem chi tiết 1 audit log (GET /:id)
 */
import NightAuditLog from '../models/NightAuditLog.js';
import { runNightAudit } from '../jobs/nightAuditJob.js';
import ExcelJS from 'exceljs';


/**
 * POST /api/night-audit/owner/trigger
 * Owner trigger Night Audit thủ công cho khách sạn của mình
 */
export const triggerNightAudit = async (req, res) => {
    try {
        const hotelId = req.hotel._id;
        const userId = req.auth?.userId;

        // Kiểm tra xem có đang chạy không
        const running = await NightAuditLog.findOne({
            hotel: hotelId,
            status: 'running',
        });

        if (running) {
            return res.status(409).json({
                success: false,
                message: 'Night Audit đang chạy, vui lòng đợi hoàn tất.',
            });
        }

        // Chạy audit (async nhưng chờ kết quả)
        const auditLog = await runNightAudit({
            hotelId,
            triggeredBy: 'manual',
            userId,
        });

        return res.json({
            success: true,
            message: 'Night Audit hoàn tất.',
            data: auditLog,
        });
    } catch (error) {
        console.error('[NightAuditController] triggerNightAudit error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi chạy Night Audit.',
        });
    }
};


/**
 * GET /api/night-audit/owner/logs?page=1&limit=10
 * Lấy lịch sử audit logs cho hotel của owner
 */
export const getAuditLogs = async (req, res) => {
    try {
        const hotelId = req.hotel._id;
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 10));
        const skip = (page - 1) * limit;

        const [logs, total] = await Promise.all([
            NightAuditLog.find({
                $or: [{ hotel: hotelId }, { hotel: null }],
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            NightAuditLog.countDocuments({
                $or: [{ hotel: hotelId }, { hotel: null }],
            }),
        ]);

        return res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
        });
    } catch (error) {
        console.error('[NightAuditController] getAuditLogs error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy lịch sử Night Audit.',
        });
    }
};


/**
 * GET /api/night-audit/owner/logs/:id
 * Xem chi tiết 1 audit log
 */
export const getAuditLogDetail = async (req, res) => {
    try {
        const hotelId = req.hotel._id;
        const { id } = req.params;

        const log = await NightAuditLog.findOne({
            _id: id,
            $or: [{ hotel: hotelId }, { hotel: null }],
        })
            .populate('noShow.bookingIds', 'user room totalPrice checkInDate')
            .populate('autoCheckout.bookingIds', 'user room totalPrice checkOutDate')
            .lean();

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy audit log.',
            });
        }

        return res.json({
            success: true,
            data: log,
        });
    } catch (error) {
        console.error('[NightAuditController] getAuditLogDetail error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi lấy chi tiết audit log.',
        });
    }
};


/**
 * GET /api/night-audit/owner/logs/:id/export?format=csv
 * Xuất báo cáo Night Audit dạng CSV
 */
export const exportAuditLog = async (req, res) => {
    try {
        const hotelId = req.hotel._id;
        const { id } = req.params;

        const log = await NightAuditLog.findOne({
            _id: id,
            $or: [{ hotel: hotelId }, { hotel: null }],
        })
            .populate('noShow.bookingIds', 'user room totalPrice checkInDate checkOutDate')
            .populate('autoCheckout.bookingIds', 'user room totalPrice checkInDate checkOutDate')
            .populate({
                path: 'noShow.bookingIds',
                populate: [
                    { path: 'user', select: 'username email' },
                    { path: 'room', select: 'roomType' },
                ],
            })
            .populate({
                path: 'autoCheckout.bookingIds',
                populate: [
                    { path: 'user', select: 'username email' },
                    { path: 'room', select: 'roomType' },
                ],
            })
            .lean();

        if (!log) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy audit log.',
            });
        }

        // ── Helper format ──
        const fmtDateVN = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : '—';
        const fmtDateTimeVN = (d) => d ? new Date(d).toLocaleString('vi-VN') : '—';

        // ── Build Excel bằng exceljs ──
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'QuickStay System';
        workbook.created = new Date();

        const sheet = workbook.addWorksheet('Night Audit', {
            views: [{ showGridLines: false }] // Ẩn grid lines mặc định cho đẹp
        });

        // Định nghĩa độ rộng cột
        sheet.columns = [
            { key: 'A', width: 28 },
            { key: 'B', width: 22 },
            { key: 'C', width: 28 },
            { key: 'D', width: 20 },
            { key: 'E', width: 20 },
            { key: 'F', width: 20 },
        ];

        // ── Custom Formats ──
        const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } }; // Indigo 600
        const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 };
        const subHeaderFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } }; // Slate 100
        const subHeaderFont = { bold: true, color: { argb: 'FF334155' } }; // Slate 700
        const currencyFmt = '#,##0 "₫"';

        const addSectionHeader = (title) => {
            const row = sheet.addRow([title]);
            row.font = headerFont;
            sheet.mergeCells(`A${row.number}:F${row.number}`);
            row.getCell(1).fill = headerFill;
            row.getCell(1).alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
            row.height = 25;
            return row;
        };

        const addColHeaders = (values) => {
            const row = sheet.addRow(values);
            row.font = subHeaderFont;
            row.eachCell(cell => {
                cell.fill = subHeaderFill;
                cell.border = {
                    top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
                    bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } }
                };
                cell.alignment = { vertical: 'middle' };
            });
            row.height = 20;
            return row;
        };

        // ════════ TITLE ════════
        const titleRow = sheet.addRow(['BÁO CÁO NIGHT AUDIT']);
        titleRow.font = { bold: true, size: 18, color: { argb: 'FF1E293B' } };
        sheet.mergeCells(`A${titleRow.number}:F${titleRow.number}`);
        titleRow.alignment = { vertical: 'middle', horizontal: 'center' };
        titleRow.height = 35;
        
        const subTitleRow = sheet.addRow(['Khách sạn: QuickStay']);
        subTitleRow.font = { italic: true, size: 11, color: { argb: 'FF64748B' } };
        sheet.mergeCells(`A${subTitleRow.number}:F${subTitleRow.number}`);
        subTitleRow.alignment = { horizontal: 'center' };
        sheet.addRow([]);

        // ════════ THÔNG TIN CHUNG ════════
        addSectionHeader('THÔNG TIN CHUNG');
        addColHeaders(['Mục', 'Giá trị', '', 'Mục', 'Giá trị']);
        sheet.addRow([
            'Ngày audit', fmtDateVN(log.auditDate), '',
            'Trạng thái', log.status === 'completed' ? 'Hoàn tất' : log.status === 'failed' ? 'Thất bại' : 'Đang chạy'
        ]);
        sheet.addRow([
            'Bắt đầu', fmtDateTimeVN(log.startedAt), '',
            'Trigger', log.triggeredBy === 'manual' ? 'Thủ công' : 'Tự động (cron)'
        ]);
        sheet.addRow([
            'Kết thúc', fmtDateTimeVN(log.completedAt), '',
            'Thời gian xử lý', `${log.durationMs || 0}ms`
        ]);
        sheet.addRow([]);

        // ════════ KẾT QUẢ XỬ LÝ ════════
        addSectionHeader('KẾT QUẢ XỬ LÝ');
        addColHeaders(['Loại', 'Tổng', 'Thành công', 'Thất bại']);
        sheet.addRow([
            'No-Show (không đến)', log.noShow?.total ?? 0, log.noShow?.succeeded ?? 0, log.noShow?.failed ?? 0
        ]);
        sheet.addRow([
            'Auto-Checkout (trả phòng tự động)', log.autoCheckout?.total ?? 0, log.autoCheckout?.succeeded ?? 0, log.autoCheckout?.failed ?? 0
        ]);
        sheet.addRow([]);

        // ════════ DOANH THU NGÀY ════════
        addSectionHeader('DOANH THU NGÀY');
        addColHeaders(['Chỉ số', 'Giá trị']);
        
        const revRow = sheet.addRow(['Tổng doanh thu', log.dailyRevenue?.totalRevenue || 0]);
        revRow.getCell(2).numFmt = currencyFmt;
        revRow.getCell(2).font = { bold: true, color: { argb: 'FF059669' } }; // Emerald 600

        sheet.addRow(['Tổng số booking', log.dailyRevenue?.totalBookings ?? 0]);
        sheet.addRow(['Đã thanh toán', log.dailyRevenue?.paidBookings ?? 0]);
        sheet.addRow(['Chưa thanh toán', log.dailyRevenue?.unpaidBookings ?? 0]);
        sheet.addRow([]);

        // ════════ TRẠNG THÁI PHÒNG ════════
        addSectionHeader('TRẠNG THÁI PHÒNG');
        addColHeaders(['Trạng thái', 'Số lượng']);
        sheet.addRow(['Tổng phòng', log.roomStatus?.totalRooms ?? 0]);
        sheet.addRow(['Đang có khách', log.roomStatus?.occupied ?? 0]);
        sheet.addRow(['Sẵn sàng (sạch)', log.roomStatus?.available ?? 0]);
        sheet.addRow(['Cần dọn (bẩn)', log.roomStatus?.dirty ?? 0]);
        sheet.addRow(['Hỏng/Bảo trì', log.roomStatus?.outOfOrder ?? 0]);
        sheet.addRow([]);

        // ════════ CHI TIẾT NO-SHOW ════════
        if (log.noShow?.bookingIds?.length > 0) {
            addSectionHeader('CHI TIẾT NO-SHOW');
            addColHeaders(['STT', 'Khách hàng', 'Email', 'Loại phòng', 'Tổng tiền', 'Ngày check-in']);
            log.noShow.bookingIds.forEach((b, i) => {
                const r = sheet.addRow([
                    i + 1,
                    b.user?.username || '—',
                    b.user?.email || '—',
                    b.room?.roomType || '—',
                    b.totalPrice || 0,
                    fmtDateVN(b.checkInDate)
                ]);
                r.getCell(5).numFmt = currencyFmt;
            });
            sheet.addRow([]);
        }

        // ════════ CHI TIẾT AUTO-CHECKOUT ════════
        if (log.autoCheckout?.bookingIds?.length > 0) {
            addSectionHeader('CHI TIẾT AUTO-CHECKOUT');
            addColHeaders(['STT', 'Khách hàng', 'Email', 'Loại phòng', 'Tổng tiền', 'Ngày check-out']);
            log.autoCheckout.bookingIds.forEach((b, i) => {
                const r = sheet.addRow([
                    i + 1,
                    b.user?.username || '—',
                    b.user?.email || '—',
                    b.room?.roomType || '—',
                    b.totalPrice || 0,
                    fmtDateVN(b.checkOutDate)
                ]);
                r.getCell(5).numFmt = currencyFmt;
            });
            sheet.addRow([]);
        }

        // ════════ LỖI HỆ THỐNG ════════
        if (log.error) {
            const errHeader = addSectionHeader('LỖI HỆ THỐNG');
            errHeader.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDC2626' } }; // Red 600
            
            const errRow = sheet.addRow([log.error]);
            errRow.font = { color: { argb: 'FFDC2626' } };
            sheet.mergeCells(`A${errRow.number}:F${errRow.number}`);
            errRow.height = 40;
            errRow.alignment = { wrapText: true, vertical: 'top' };
            sheet.addRow([]);
        }

        // ════════ FOOTER ════════
        const footerRow = sheet.addRow([`Xuất ngày: ${new Date().toLocaleString('vi-VN')}`]);
        footerRow.font = { italic: true, color: { argb: 'FF94A3B8' }, size: 9 };
        
        // Căn thêm indent nhẹ cho các ô thông thường cho đẹp mắt
        sheet.eachRow((row, rowNumber) => {
            if (rowNumber > subTitleRow.number && row.values.length > 0) {
                const cellA = row.getCell(1);
                if (cellA.fill?.type !== 'pattern' && !cellA.font?.italic) {
                    cellA.alignment = { ...cellA.alignment, indent: 1 };
                }
            }
        });

        // ── Output buffer ──
        const buffer = await workbook.xlsx.writeBuffer();
        const auditDate = fmtDateVN(log.auditDate).replace(/\//g, '-');
        const filename = `Bao-Cao-Night-Audit-${auditDate}.xlsx`;

        // Cho phép frontend lấy filename từ header
        res.setHeader('Access-Control-Expose-Headers', 'Content-Disposition');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        return res.send(buffer);
    } catch (error) {
        console.error('[NightAuditController] exportAuditLog error:', error);
        return res.status(500).json({
            success: false,
            message: 'Lỗi khi xuất báo cáo.',
        });
    }
};
