import React from 'react';

/** The landing page's button content: a square, then a label that rolls up on hover (the second copy is for sight only). */
export const BtnLabel: React.FC<{ children: string }> = ({ children }) => (
  <>
    <i className="wb-btn__sq" aria-hidden="true" />
    <span className="wb-btn__lbl">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  </>
);
