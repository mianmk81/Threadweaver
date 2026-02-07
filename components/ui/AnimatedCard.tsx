'use client';

/**
 * AnimatedCard - Wrapper component for smooth card animations
 * Uses Framer Motion for enter/exit animations
 */

import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface AnimatedCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  delay?: number;
}

export default function AnimatedCard({
  children,
  delay = 0,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        delay,
        ease: [0.4, 0, 0.2, 1],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Fade in animation variant
 */
export function FadeIn({
  children,
  delay = 0,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Scale up animation variant
 */
export function ScaleUp({
  children,
  delay = 0,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Slide in from right
 */
export function SlideInRight({
  children,
  delay = 0,
  ...props
}: AnimatedCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      transition={{ duration: 0.3, delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

/**
 * Stagger children animations
 */
export function StaggerContainer({
  children,
  staggerDelay = 0.05,
  ...props
}: AnimatedCardProps & { staggerDelay?: number }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay,
          },
        },
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
