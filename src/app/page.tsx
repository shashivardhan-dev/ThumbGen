'use client'
// app/page.tsx
import Navbar from '../components/Navbar';
import Hero from '../components/LandingPage/Hero';
import BeforeAfter from '../components/LandingPage/BeforeAfter';
import Testimonials from '../components/LandingPage/Testimonials';
import Features from '../components/LandingPage/Features';
import Upcoming from '../components/LandingPage/Upcoming';
import Plans from '../components/LandingPage/Plans';
import Footer from '../components/Footer';
import { useToggle } from  '../contexts/toggle';

export default function Home() {
 const { isToggled, isLoaded } = useToggle();
  
  // Don't render with theme styles until loaded
  if (!isLoaded) {
    return <div>Loading...</div>; // or a proper loading component
  }
  return (
      <div className={`relative flex size-full min-h-screen flex-col group/design-root  transition-colors duration-300 ${
      isToggled 
        ? 'bg-gray-900 text-white' 
        : 'bg-white text-gray-900'
    }`}>
      <div className="layout-container flex h-full grow flex-col">
        <Navbar />
        <main className="flex-1">
          <Hero />
          <BeforeAfter />
          {/* <Testimonials /> */}
          <Features />
          <Upcoming />
          <Plans />
        </main>
        <Footer />
      </div>
    </div>
  );
}