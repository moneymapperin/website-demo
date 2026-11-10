import React, { useRef, useEffect, useState, ReactNode, ElementType } from 'react';

export interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: string;
}

export const Reveal: React.FC<RevealProps> = ({
  children,
  className = '',
  delay = 0,
  as: Component = 'div',
}) => {
  const ref = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    if (typeof window.IntersectionObserver === 'undefined') return true;
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return true;
    }
    return false;
  });

  useEffect(() => {
    if (isVisible) return;
    if (typeof window === 'undefined' || typeof window.IntersectionObserver === 'undefined') {
      setIsVisible(true);
      return;
    }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIsVisible(true);
            if (node) {
              node.classList.add('reveal-visible');
            }
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, [isVisible]);

  const Tag = (Component || 'div') as ElementType;
  const combinedClass = `${isVisible ? 'reveal reveal-visible' : 'reveal'} ${className}`.trim();

  return (
    <Tag
      ref={ref}
      className={combinedClass}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
};

export default Reveal;

