import Image from 'next/image'
import React from 'react'

const data = [
  { name: 'Sarah M.', quote: "This tool has completely transformed my channel's performance. My click-through rate has skyrocketed!", img: '/images/user1.svg' },
  { name: 'David L.', quote: "I love how easy it is to create professional-looking thumbnails, even without any design experience.", img: '/images/user2.svg' },
  { name: 'Emily R.', quote: "The variety of templates is amazing, and the customization options are endless. Highly recommend!", img: '/images/user3.svg' },
]

export default function Testimonials() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900 text-center">What Our Users Say</h2>
        <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {data.map((t) => (
            <div key={t.name} className="flex flex-col items-center text-center p-6 bg-white rounded-lg shadow-md">
              <div className="w-24 h-24 rounded-full overflow-hidden mb-4">
                <Image alt={t.name} src={t.img} width={96} height={96} />
              </div>
              <p className="text-slate-600 italic">{t.quote}</p>
              <p className="mt-4 text-slate-900 font-semibold">{t.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
