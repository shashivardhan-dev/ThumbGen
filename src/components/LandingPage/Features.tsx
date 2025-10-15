import React from 'react'
import { useToggle } from '../../contexts/toggle';

const cards = [
  { title: 'AI-Powered Enhancements', desc: 'Let our AI suggest improvements and optimize your thumbnails for maximum impact.' },
  { title: 'Customizable Templates', desc: 'Choose from a wide range of professionally designed templates and tailor them to your brand.' },
  { title: 'Vibrant Color Palettes', desc: 'Explore a rich selection of color palettes to create visually appealing and consistent thumbnails.' },
  { title: 'Stylish Text Options', desc: 'Add text with various fonts, styles, and effects to make your message stand out.' },
  { title: 'Image Library', desc: 'Access a vast library of high-quality images or upload your own to personalize your designs.' },
  { title: 'One-Click Publishing', desc: 'Easily publish your thumbnails directly to your platform with a single click.' },
]

export default function Features() {
  const { isToggled } = useToggle();

  const sectionClasses = `py-16 sm:py-20 transition-colors duration-200 ${
    isToggled ? 'bg-gray-900' : 'bg-white'
  }`;

  const titleClasses = `text-3xl font-bold tracking-tight ${
    isToggled ? 'text-white' : 'text-slate-900'
  }`;

  const descriptionClasses = `mt-4 text-lg max-w-3xl mx-auto ${
    isToggled ? 'text-gray-300' : 'text-slate-600'
  }`;

  const cardClasses = `flex flex-col rounded-lg border p-8 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 ${
    isToggled
      ? 'border-gray-700 bg-gray-800 hover:bg-gray-750'
      : 'border-slate-200 bg-white hover:bg-gray-50'
  }`;

  const iconBgClasses = `flex items-center justify-center h-12 w-12 rounded-md mb-6 ${
    isToggled ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white'
  }`;

  const cardTitleClasses = `text-xl font-semibold mb-4 ${
    isToggled ? 'text-white' : 'text-slate-900'
  }`;

  const cardDescClasses = `text-base leading-relaxed ${
    isToggled ? 'text-gray-300' : 'text-slate-600'
  }`;

  return (
    <section id="features" className={sectionClasses}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className={titleClasses}>
            Powerful Features to Enhance Your Thumbnails
          </h2>
          <p className={descriptionClasses}>
            Our thumbnail creation tool is packed with features to help you create stunning visuals that capture attention and drive engagement.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className={cardClasses}>
              <div className={iconBgClasses}>
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path 
                    d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth="2"
                  />
                </svg>
              </div>
              <h3 className={cardTitleClasses}>{card.title}</h3>
              <p className={cardDescClasses}>{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}