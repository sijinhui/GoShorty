import { useState, useEffect } from 'react';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const MOBILE_MAX = 767;
const TABLET_MAX = 1024;

function getState(): ResponsiveState {
  const w = window.innerWidth;
  return {
    isMobile: w <= MOBILE_MAX,
    isTablet: w > MOBILE_MAX && w <= TABLET_MAX,
    isDesktop: w > TABLET_MAX,
  };
}

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState(getState);

  useEffect(() => {
    const mqlMobile = window.matchMedia(`(max-width: ${MOBILE_MAX}px)`);
    const mqlTablet = window.matchMedia(`(min-width: ${MOBILE_MAX + 1}px) and (max-width: ${TABLET_MAX}px)`);

    const update = () => setState(getState());

    mqlMobile.addEventListener('change', update);
    mqlTablet.addEventListener('change', update);
    return () => {
      mqlMobile.removeEventListener('change', update);
      mqlTablet.removeEventListener('change', update);
    };
  }, []);

  return state;
}
