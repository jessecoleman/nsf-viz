import { useState, useEffect, useRef, RefObject, useMemo } from 'react';
import { useQuery } from './query';

export const useMeasure = <T extends HTMLElement>(): [ RefObject<T>, number ] => {
  
  const ref = useRef<T>(null);
  const padding = useRef<number>(0);

  useEffect(() => {
    if (ref.current) {
      const bbox = ref.current.getBoundingClientRect();
      const parent = ref.current.parentElement?.getBoundingClientRect();
      if (parent && bbox.width) {
        padding.current = parent.width - bbox.width;
      }
    }
  }, [ref.current?.getBoundingClientRect().width]);
 
  return [ ref, padding.current ];
};

type Dims = {
  width: number
  height: number
}

export const useMeasureChart = <T extends HTMLElement>(): [ RefObject<T>, RefObject<T>, Dims ] => {
  
  const topRef = useRef<T>(null);
  const bottomRef = useRef<T>(null);
  const [ dims, setBox ] = useState({ width: 0, height: 0 });
  const [ windowWidth, windowHeight ] = useWindowDimensions();
  // resize when terms change since they change height of toolbar
  const [{ terms }] = useQuery();
  const [ prevTerms, setPrevTerms ] = useState(terms);

  useEffect(() => {
    if (topRef.current && bottomRef.current) {
      const bbox = topRef.current.getBoundingClientRect();
      const bottom = topRef.current.getBoundingClientRect();
      if (parent && bbox.height && bottom.height) {
        setBox({
          width: bbox.width,
          height: windowHeight - bbox.height - bottom.height,
        });
      }
    }
  }, [topRef.current, windowWidth, windowHeight, JSON.stringify(terms)]);
 
  return [ topRef, bottomRef, dims ];
};

type ResultBox<T> = { v: T }

export const useConstant = <T extends unknown>(fn: () => T): T => {
  const ref = useRef<ResultBox<T>>();

  if (!ref.current) {
    ref.current = { v: fn() };
  }

  return ref.current.v;
};

const getWindowDimensions = () => {
  return [ window.innerWidth, window.innerHeight ];
};

export const useWindowDimensions = () => {
  const [windowDimensions, setWindowDimensions] = useState(getWindowDimensions());

  useEffect(() => {
    const handleResize = () => {
      setWindowDimensions(getWindowDimensions());
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowDimensions;
};

export const useDebounce = <T>(value: T, delay?: number): T => {

  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
};
