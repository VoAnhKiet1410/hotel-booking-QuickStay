import React from 'react'

const Title = ({ title, subTitle, align = 'center', font = 'font-playfair' }) => {
  const alignmentClasses =
    align === 'left'
      ? 'items-start text-left'
      : align === 'right'
        ? 'items-end text-right'
        : 'items-center text-center mx-auto'

  return (
    <div className={`flex flex-col justify-center ${alignmentClasses}`}>
      <h2 className={`text-3xl md:text-[32px] font-semibold tracking-tight text-gray-900 ${font}`}>
        {title}
      </h2>
      {subTitle && (
        <p className="mt-2 text-sm md:text-base text-gray-500/90 max-w-2xl">
          {subTitle}
        </p>
      )}
    </div>
  )
}

export default Title
