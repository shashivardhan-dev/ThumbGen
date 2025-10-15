import Image from 'next/image'
import React from 'react'
import { useToggle } from '../../contexts/toggle';
import  after from '../../../public/after.png'
import before from '../../../public/before.png'



export default function BeforeAfter() {
  const { isToggled } = useToggle();

  const sectionClasses = `py-16 sm:py-20 transition-colors duration-200 ${
    isToggled ? 'bg-gray-900' : 'bg-white'
  }`;

  const titleClasses = `text-3xl font-bold tracking-tight sm:text-4xl ${
    isToggled ? 'text-white' : 'text-slate-900'
  }`;

  const descriptionClasses = `mt-4 text-lg leading-8 ${
    isToggled ? 'text-gray-300' : 'text-slate-600'
  }`;

  const headingClasses = `text-2xl font-semibold mb-4 ${
    isToggled ? 'text-gray-200' : 'text-slate-800'
  }`;

  const sections = [
    {
      title: 'Before',
      image: before,
      alt: 'Before using ThumbGen'
    },
    {
      title: 'After', 
      image: after,
      alt: 'After using ThumbGen'
    }
  ];

  return (
    <section className={sectionClasses}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className={titleClasses}>
            From Bland to Brilliant
          </h2>
          <p className={descriptionClasses}>
            See how ThumbGen transforms a basic thumbnail into a clickable masterpiece.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 items-center">
          {sections.map(({ title, image, alt }) => (
            <div key={title} className="flex flex-col items-center">
              <h3 className={headingClasses}>{title}</h3>
              <div className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 shadow-xl ${
                isToggled ? 'border-gray-600 shadow-gray-800/50' : 'border-slate-300 shadow-slate-400/30'
              }`}>
                <Image 
                  alt={alt}
                  className="w-full h-full object-cover" 
                  src={image}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}