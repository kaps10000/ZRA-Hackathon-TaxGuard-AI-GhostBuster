"use client";

import Image from "next/image";
import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

const SlideShow = () => {
  const images = ["/slide1.png", "/slide2.png", "/slide3.png"];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance every 4s
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 10000);
    return () => clearInterval(interval);
  }, [currentIndex]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="relative w-full max-w-5xl mx-auto mt-6 sm:mt-10">
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden rounded-lg sm:rounded-2xl shadow-lg">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0"
          >
            <Image
              src={`/images${images[currentIndex]}`}
              alt={`Slide ${currentIndex + 1}`}
              fill
              className="object-contain sm:object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 80vw"
              priority={currentIndex === 0}
            />
          </motion.div>
        </AnimatePresence>

        {/* Left Arrow */}
        <button
          title="Previous Slide"
          onClick={prevSlide}
          className="absolute top-1/2 left-2 sm:left-4 -translate-y-1/2 bg-black/50 p-1.5 sm:p-2 rounded-full text-white hover:bg-black/70 transition z-10"
        >
          <ChevronLeft size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Right Arrow */}
        <button
          title="Next Slide"
          onClick={nextSlide}
          className="absolute top-1/2 right-2 sm:right-4 -translate-y-1/2 bg-black/50 p-1.5 sm:p-2 rounded-full text-white hover:bg-black/70 transition z-10"
        >
          <ChevronRight size={20} className="sm:w-6 sm:h-6" />
        </button>

        {/* Dots */}
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
          {images.map((_, index) => (
            <button
              title="Select Slide"
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-3 h-3 rounded-full transition ${
                index === currentIndex
                  ? "bg-white"
                  : "bg-gray-400/60 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlideShow;
