import { useEffect, useRef } from 'react'

/**
 * Custom hook for scroll-triggered reveal animations.
 * Attaches IntersectionObserver to a ref element, adding 'revealed' class when visible.
 *
 * @param {Object} options
 * @param {number} options.threshold - Visibility threshold (0-1), default 0.15
 * @param {string} options.rootMargin - Root margin, default '0px 0px -40px 0px'
 * @returns {React.RefObject}
 */
export default function useScrollReveal({ threshold = 0.15, rootMargin = '0px 0px -40px 0px' } = {}) {
    const ref = useRef(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed')
                        observer.unobserve(entry.target)
                    }
                })
            },
            { threshold, rootMargin }
        )

        // Observe the element and all children with reveal classes
        const targets = el.querySelectorAll('.reveal, .reveal-left, .reveal-scale')
        targets.forEach((t) => observer.observe(t))
        if (el.classList.contains('reveal') || el.classList.contains('reveal-left') || el.classList.contains('reveal-scale')) {
            observer.observe(el)
        }

        return () => observer.disconnect()
    }, [threshold, rootMargin])

    return ref
}
