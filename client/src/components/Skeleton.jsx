import React from 'react'

export const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200 rounded ${className}`} />
)

export const RoomCardSkeleton = () => (
    <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 md:flex-row">
        <div className="md:w-2/5">
            <Skeleton className="h-52 w-full rounded-2xl" />
        </div>
        <div className="flex flex-1 flex-col justify-between gap-3">
            <div>
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-3/4 mb-3" />
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-3" />
                <div className="flex gap-2">
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                </div>
            </div>
            <div className="flex justify-between items-end">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-10 w-28 rounded-full" />
            </div>
        </div>
    </div>
)

export const BookingCardSkeleton = () => (
    <div className="grid grid-cols-1 gap-5 px-5 py-6 md:grid-cols-[minmax(0,1.7fr)_minmax(0,1.1fr)_minmax(0,0.7fr)] md:gap-6 md:px-6 border-b border-slate-100">
        <div className="flex gap-4">
            <Skeleton className="h-20 w-32 rounded-xl" />
            <div className="flex-1">
                <Skeleton className="h-5 w-3/4 mb-2" />
                <Skeleton className="h-3 w-1/2 mb-2" />
                <Skeleton className="h-3 w-2/3" />
            </div>
        </div>
        <div className="space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
        </div>
        <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-32 rounded-full" />
        </div>
    </div>
)

export const DashboardSkeleton = () => (
    <div className="space-y-6">
        <div className="flex flex-wrap gap-4">
            {[1, 2, 3].map((i) => (
                <div key={i} className="inline-flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-sm ring-1 ring-slate-100">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div>
                        <Skeleton className="h-3 w-24 mb-2" />
                        <Skeleton className="h-6 w-16" />
                    </div>
                </div>
            ))}
        </div>
        <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-7 w-28 rounded-full" />
            ))}
        </div>
    </div>
)

export const TableRowSkeleton = ({ cols = 4 }) => (
    <div className={`grid gap-4 px-5 py-4 border-t border-slate-100`} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
        ))}
    </div>
)

export default Skeleton
