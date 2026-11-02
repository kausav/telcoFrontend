import React from 'react';

/**
 * The label inside a `wb-btn`: the text rolls up on hover and is replaced by a copy underneath,
 * and a small white square turns, like the landing page's buttons. The copy is hidden from screen readers.
 */
export const BtnLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <>
    <span className="wb-btn__sq" aria-hidden="true" />
    <span className="wb-btn__lbl">
      <span>{children}</span>
      <span aria-hidden="true">{children}</span>
    </span>
  </>
);
