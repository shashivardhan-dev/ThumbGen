import React from 'react'
import Image from 'next/image'
import { useToggle } from '../../contexts/toggle';

function PlanCard({ title, price, features, popular = false }: any) {
  const { isToggled } = useToggle();

  const cardClasses = `flex flex-col rounded-lg border p-8 transition-colors duration-200 ${
    isToggled
      ? `border-gray-700 bg-gray-800 ${popular ? 'shadow-2xl shadow-blue-500/20' : 'shadow-lg'}`
      : `border-slate-200 bg-white ${popular ? 'shadow-2xl' : 'shadow-lg'}`
  }`;

  const titleClasses = `text-2xl font-semibold ${
    popular 
      ? (isToggled ? 'text-blue-400' : 'text-blue-600')
      : (isToggled ? 'text-white' : 'text-slate-900')
  }`;

  const priceClasses = `mt-2 text-4xl font-bold ${
    isToggled ? 'text-white' : 'text-slate-900'
  }`;

  const priceUnitClasses = `text-lg font-medium ${
    isToggled ? 'text-gray-400' : 'text-slate-600'
  }`;

  const descriptionClasses = `mt-4 ${
    isToggled ? 'text-gray-300' : 'text-slate-600'
  }`;

  const featureTextClasses = isToggled ? 'text-gray-300' : 'text-slate-700';

  const buttonClasses = `mt-auto flex w-full min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-6 text-base font-bold leading-normal tracking-[0.015em] transition-all duration-200 mt-8 ${
    popular
      ? (isToggled 
          ? 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg' 
          : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg')
      : (isToggled 
          ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' 
          : 'bg-slate-200 text-slate-900 hover:bg-slate-300')
  }`;

  const getDescription = (title: string) => {
    const descriptions = {
      'Free': 'Perfect for individuals starting out.',
      'Premium': 'Ideal for content creators and professionals.',
      'Business': 'For teams and agencies.'
    };
    return descriptions[title as keyof typeof descriptions] || '';
  };

  const getButtonText = (title: string, popular: boolean) => {
    if (popular) return 'Subscribe Now';
    if (title === 'Free') return 'Get Started';
    return 'Contact Sales';
  };

  return (
    <div className={cardClasses}>
      {popular && (
        <div className={`self-start mb-4 px-2 py-1 rounded-full text-sm font-semibold ${
          isToggled ? 'text-white bg-blue-600' : 'text-white bg-blue-600'
        }`}>
          Most Popular
        </div>
      )}
      <h3 className={titleClasses}>{title}</h3>
      <p className={priceClasses}>
        {price}<span className={priceUnitClasses}>/mo</span>
      </p>
      <p className={descriptionClasses}>
        {getDescription(title)}
      </p>
      <ul className="mt-8 space-y-4">
        {features.map((feature: string) => (
          <li key={feature} className="flex items-center gap-3">
            <svg 
              className="h-6 w-6 flex-shrink-0 text-green-500" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                d="M5 13l4 4L19 7" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth="2"
              />
            </svg>
            <span className={featureTextClasses}>{feature}</span>
          </li>
        ))}
      </ul>
      <button type="button" className={buttonClasses}>
        {getButtonText(title, popular)}
      </button>
    </div>
  );
}

export default function Plans() {
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

  const plansData = [
    {
      title: "Free",
      price: "$0",
      features: ["Basic templates", "Limited image library", "Standard support"]
    },
    {
      title: "Premium",
      price: "$15",
      features: ["All premium templates", "Full image & font library", "AI-powered enhancements", "Priority support"],
      popular: true
    },
    {
      title: "Business",
      price: "$45",
      features: ["All premium features", "Collaboration tools", "A/B testing", "Dedicated account manager"]
    }
  ];

  return (
    <section id="pricing" className={sectionClasses}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className={titleClasses}>
            Find the Perfect Plan
          </h2>
          <p className={descriptionClasses}>
            Choose the plan that's right for you and start creating amazing thumbnails today.
          </p>
        </div>
        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {plansData.map((plan) => (
            <PlanCard
              key={plan.title}
              title={plan.title}
              price={plan.price}
              features={plan.features}
              popular={plan.popular}
            />
          ))}
        </div>
      </div>
    </section>
  );
}