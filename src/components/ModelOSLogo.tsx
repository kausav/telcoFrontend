import React from 'react';
import modelOsLogo from '../assets/images/modelos_logo.png';

interface ModelOSLogoProps {
  className?: string;
}

/** The ModelOS logo (image). Size it with the height in `className`; the width follows the image's proportions. */
export const ModelOSLogo: React.FC<ModelOSLogoProps> = ({ className = '' }) => (
  <img
    src={modelOsLogo}
    alt="ModelOS"
    draggable={false}
    className={`select-none w-auto ${className}`}
  />
);
