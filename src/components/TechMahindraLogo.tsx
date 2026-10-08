import React from 'react';

interface TechMahindraLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export const TechMahindraLogo: React.FC<TechMahindraLogoProps> = ({
  className = 'h-10 w-auto',
  ...props
}) => {
  return (
    <svg
      viewBox="0 0 252 74"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="Tech Mahindra"
      {...props}
    >
      {/* 
        Tech Mahindra Signature Slanted Red Quadrilateral / Parallelogram Glyph
        Matches the updated corporate brand logo (images.jfif):
        - Left edge is vertical
        - Top edge slopes upwards to the right
        - Right edge is vertical
        - Bottom edge slopes upwards to the right parallel to top
      */}
      <polygon
        points="10,34 66,20 66,52 10,66"
        fill="#E31837"
      />

      {/* TECH Wordmark in Charcoal Slate */}
      <text
        x="80"
        y="37"
        fill="#373A3C"
        fontFamily="'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="900"
        fontSize="21"
        letterSpacing="2.2"
      >
        TECH
      </text>

      {/* 
        mahindra Wordmark in TechM Crimson Red (#E31837)
        Single-story modern geometric typography
      */}
      <text
        x="80"
        y="65"
        fill="#E31837"
        fontFamily="'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontWeight="800"
        fontSize="27"
        letterSpacing="-0.3"
      >
        mahindra
      </text>
    </svg>
  );
};