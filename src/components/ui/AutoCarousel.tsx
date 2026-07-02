"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

interface AutoCarouselProps {
  children: React.ReactNode[];
  autoSlideInterval?: number; // default: 5000ms
  desktopGridColsClassName?: string; // default: "md:grid-cols-3"
  gapClassName?: string; // default: "gap-6"
}

export const AutoCarousel: React.FC<AutoCarouselProps> = ({
  children,
  autoSlideInterval = 5000,
  desktopGridColsClassName = "md:grid-cols-3",
  gapClassName = "gap-6",
}) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const totalSlides = children.length;

  // Sync activeIndex with scroll position when user swipes manually
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;
    const { scrollLeft, scrollWidth } = containerRef.current;
    if (scrollWidth === 0) return;
    const index = Math.round(scrollLeft / (scrollWidth / totalSlides));
    if (index >= 0 && index < totalSlides && index !== activeIndex) {
      setActiveIndex(index);
    }
  }, [totalSlides, activeIndex]);

  // Function to programmatically scroll to a specific slide index
  const goToSlide = useCallback((index: number) => {
    if (!containerRef.current) return;
    const targetLeft = index * (containerRef.current.scrollWidth / totalSlides);
    containerRef.current.scrollTo({
      left: targetLeft,
      behavior: "smooth",
    });
    setActiveIndex(index);
  }, [totalSlides]);

  // Advance to next slide
  const nextSlide = useCallback(() => {
    const nextIndex = (activeIndex + 1) % totalSlides;
    goToSlide(nextIndex);
  }, [activeIndex, totalSlides, goToSlide]);

  // Set up auto-slide interval
  useEffect(() => {
    if (isPaused || totalSlides <= 1) return;

    const timer = setInterval(() => {
      nextSlide();
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [isPaused, nextSlide, autoSlideInterval, totalSlides]);

  return (
    <div
      className="flex flex-col w-full relative group"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className={`flex overflow-x-auto md:grid ${desktopGridColsClassName} ${gapClassName} items-stretch snap-x snap-mandatory scrollbar-none pb-4 md:pb-0 -mx-6 px-6 md:mx-0 md:px-0`}
      >
        {children.map((child, index) => (
          <div
            key={index}
            className="w-[85vw] sm:w-[340px] md:w-auto shrink-0 md:shrink snap-center flex flex-col"
          >
            {child}
          </div>
        ))}
      </div>

      {/* Pagination Dots (Mobile Only) */}
      {totalSlides > 1 && (
        <div className="flex justify-center gap-2 mt-4 md:hidden">
          {children.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                activeIndex === index
                  ? "w-6 bg-orange-500 shadow-[0_0_8px_#f97316]"
                  : "w-2 bg-zinc-700 hover:bg-zinc-650"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
