import React, { useEffect } from 'react';
import LocomotiveScroll from 'locomotive-scroll';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Component hỗ trợ Smooth Scrolling mang cảm giác cao cấp từ Locomotive Scroll v5.
 * Tự động tạo hiệu ứng "giảm tốc" (easing) mượt mà cho trải nghiệm duyệt web.
 * Locomotive Scroll v5 hoạt động tối ưu hiệu suất cuộn rất tốt.
 */
export default function SmoothScroll({ children }) {
    const { pathname } = useLocation();

    useEffect(() => {
        // Khởi tạo Locomotive Scroll instance v5
        const locomotiveScroll = new LocomotiveScroll({
            // Các tuỳ chọn lenisOptions để tinh chỉnh cảm giác mượt (locomotive v5 mixin)
            lenisOptions: {
                wrapper: window,
                content: document.documentElement,
                lerp: 0.05, // Độ trễ siêu mượt (thấp hơn = mượt chậm, cảm giác cao cấp)
                duration: 1.5, // Kéo dài thời gian cuộn, tạo độ "giảm tốc" tinh tế
                orientation: 'vertical',
                gestureOrientation: 'vertical',
                smoothWheel: true,
                smoothTouch: false,
                touchMultiplier: 2,
                wheelMultiplier: 1,
                normalizeWheel: true,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Easing custom mang cảm giác "premium"
            }
        });

        // Mỗi khi đổi trang, luôn đưa chuột lên trên cùng ngay lập tức để tránh lỗi vị trí
        window.scrollTo(0, 0);

        // Cách đồng bộ GSAP ScrollTrigger với cấu trúc Lenis (Locomotive v5)
        // để hoạt ảnh "scrub" mượt mà theo framerate của scroll
        gsap.ticker.lagSmoothing(0);

        const raf = (time) => {
            // Lấy instance lenis bên trong Locomotive v5 để đồng bộ vòng lặp (nếu khả dụng)
            if (locomotiveScroll.lenis) {
                locomotiveScroll.lenis.raf(time * 1000);
            }
        };

        gsap.ticker.add(raf);

        if (locomotiveScroll.lenis) {
            locomotiveScroll.lenis.on('scroll', ScrollTrigger.update);
            // Expose lenis instance toàn cục để các component khác có thể stop/start
            window.__lenis = locomotiveScroll.lenis;
        }

        // Làm mới ScrollTrigger để tính toán lại layout sau khi mount
        setTimeout(() => ScrollTrigger.refresh(), 100);

        return () => {
            if (locomotiveScroll.lenis) {
                locomotiveScroll.lenis.off('scroll', ScrollTrigger.update);
            }
            window.__lenis = null;
            gsap.ticker.remove(raf);
            locomotiveScroll.destroy();
        };
    }, [pathname]);

    return <>{children}</>;
}
