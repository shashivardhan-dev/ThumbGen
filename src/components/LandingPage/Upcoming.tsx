import React from 'react'
import { useToggle } from '../../contexts/toggle';

function Item({ title, desc }: { title: string; desc: string }) {
  const { isToggled } = useToggle();

  const cardClasses = `flex flex-col rounded-lg border p-8 transition-colors duration-200 shadow-lg ${
    isToggled
      ? 'border-gray-700 bg-gray-800'
      : 'border-slate-200 bg-white'
  }`;

  const iconBgClasses = `flex items-center justify-center h-12 w-12 rounded-md transition-colors duration-200 mb-6 ${
    isToggled 
      ? 'bg-blue-600 text-white' 
      : 'bg-blue-100 text-blue-600'
  }`;

  const titleClasses = `text-xl font-semibold mb-4 ${
    isToggled ? 'text-white' : 'text-slate-900'
  }`;

  const descClasses = `text-base leading-relaxed ${
    isToggled ? 'text-gray-300' : 'text-slate-600'
  }`;

  return (
    <div className={cardClasses}>
      <div className={iconBgClasses}>
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path 
            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2"
          />
          <path 
            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2"
          />
        </svg>
      </div>
      <h3 className={titleClasses}>{title}</h3>
      <p className={descClasses}>{desc}</p>
    </div>
  );
}

export default function Upcoming() {
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

  const upcomingFeatures = [
    {
      title: "Animated Thumbnails",
      desc: "Bring your thumbnails to life with subtle animations and effects to grab your audience's attention."
    },
    {
      title: "Collaboration Tools", 
      desc: "Work with your team in real-time to create the perfect thumbnail, with shared libraries and comments."
    },
    {
      title: "A/B Testing",
      desc: "Test different thumbnail variations to see which performs best and optimize your click-through rates."
    }
  ];

  return (
    <section className={sectionClasses}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className={titleClasses}>
            Upcoming Features
          </h2>
         <p className={descriptionClasses}>
    We&apos;re always working on new ways to make ThumbGen even better. Here&apos;s a sneak peek at what&apos;s coming soon!
</p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {upcomingFeatures.map((feature) => (
            <Item
              key={feature.title}
              title={feature.title}
              desc={feature.desc}
            />
          ))}
        </div>
      </div>
    </section>
  );
}