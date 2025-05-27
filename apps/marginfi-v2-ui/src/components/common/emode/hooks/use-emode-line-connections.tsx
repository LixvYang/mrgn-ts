"use client";

import { useRef, useState, useEffect, useCallback, type RefObject } from "react";
import { useDebounce } from "@uidotdev/usehooks";

// Types for the hook
type ElementRef = RefObject<HTMLElement>;
type RefPair = [ElementRef, ElementRef];
type LineCoordinates = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  // Add a type to determine the path style
  pathType: "straight" | "down" | "up";
  // Add path length for animation calculations
  pathLength: number;
  // Add index for offset calculations
  index: number;
};

// Define a type for line colors
type LineColor = {
  base: string;
  pulse: string;
};

type LineConnectionOptions = {
  color?: string;
  pulseColor?: string;
  pulseSpeed?: number;
  strokeWidth?: number;
  pulseWidth?: number;
  cornerRadius?: number;
  lineSpacing?: number;
  // New option for line colors
  colors?: LineColor[];
  // Option to use different colors for each line
  useUniqueColors?: boolean;
};

// Default options
const defaultOptions: LineConnectionOptions = {
  color: "rgba(147, 51, 234, 0.3)", // Light purple
  pulseColor: "rgba(147, 51, 234, 0.8)", // Deeper purple
  pulseSpeed: 3, // seconds
  strokeWidth: 2,
  pulseWidth: 3,
  cornerRadius: 10,
  lineSpacing: 30, // Spacing between parallel lines
  useUniqueColors: true, // Default to using unique colors
};

/**
 * A hook that creates animated connecting lines between pairs of elements
 * @param refPairs Array of ref pairs to connect with lines
 * @param options Customization options for the lines
 * @param highlightedIndices Array of indices of the highlighted lines (or undefined/null)
 * @returns JSX element with SVG lines
 */
export function useEmodeLineConnections(
  refPairs: RefPair[],
  options: LineConnectionOptions = {},
  highlightedIndices?: number[]
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lineCoordinates, setLineCoordinates] = useState<LineCoordinates[]>([]);

  // Store previous coordinates to compare
  const prevCoordinatesRef = useRef<LineCoordinates[]>([]);

  // Calculate the approximate path length
  const calculatePathLength = (
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    pathType: "straight" | "down" | "up"
  ): number => {
    if (pathType === "straight") {
      // For straight lines, it's just the horizontal distance
      return Math.abs(x2 - x1);
    } else {
      // For curved paths, we approximate the length
      // Horizontal segments + vertical segment + a bit extra for the curves
      const horizontalDistance = Math.abs(x2 - x1);
      const verticalDistance = Math.abs(y2 - y1);
      return horizontalDistance + verticalDistance;
    }
  };

  // Memoize the calculation function to prevent recreation on each render
  const calculateLineCoordinates = useCallback(() => {
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();

    const newCoordinates = refPairs.map(([startRef, endRef], index) => {
      // Skip if either ref is null or doesn't have a current element
      if (!startRef?.current || !endRef?.current) {
        return { x1: 0, y1: 0, x2: 0, y2: 0, pathType: "straight" as const, pathLength: 0, index };
      }

      const startRect = startRef.current.getBoundingClientRect();
      const endRect = endRef.current.getBoundingClientRect();

      // Calculate positions relative to the container
      const x1 = startRect.right - containerRect.left;
      const y1 = startRect.top + startRect.height / 2 - containerRect.top;
      const x2 = endRect.left - containerRect.left;
      const y2 = endRect.top + endRect.height / 2 - containerRect.top;

      // Determine the path type based on the relative positions
      let pathType: "straight" | "down" | "up" = "down";

      // If the elements are roughly on the same row (within a small threshold)
      const sameRowThreshold = 20; // pixels
      if (Math.abs(y1 - y2) < sameRowThreshold) {
        pathType = "straight";
      } else if (y2 < y1) {
        // If the end element is above the start element
        pathType = "up";
      }

      // Calculate the approximate path length
      const pathLength = calculatePathLength(x1, y1, x2, y2, pathType);

      return { x1, y1, x2, y2, pathType, pathLength, index };
    });

    // Only update state if coordinates have changed
    if (JSON.stringify(newCoordinates) !== JSON.stringify(prevCoordinatesRef.current)) {
      prevCoordinatesRef.current = newCoordinates;
      setLineCoordinates(newCoordinates);
    }
  }, [refPairs]);

  // Create debounced version of the calculation function
  const debouncedCalculate = useDebounce(calculateLineCoordinates, 100);

  useEffect(() => {
    // Initial calculation
    calculateLineCoordinates();

    // Add resize listener
    window.addEventListener("resize", debouncedCalculate);

    // Set up a mutation observer to detect DOM changes
    const observer = new MutationObserver(calculateLineCoordinates);
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["style", "class"],
      });
    }

    // Clean up
    return () => {
      window.removeEventListener("resize", debouncedCalculate);
      observer.disconnect();
    };
  }, [calculateLineCoordinates, debouncedCalculate]);

  // Generate path string for a line based on the path type
  const getPathString = useCallback(
    (
      coords: LineCoordinates,
      cornerRadius: number,
      lineSpacing: number,
      totalConnections: number,
      numCurvedConnections?: number
    ) => {
      const { x1, y1, x2, y2, pathType, index } = coords;
      const radius = cornerRadius || 10;

      // For straight lines (elements on the same row)
      if (pathType === "straight") {
        // Keep horizontal lines perfectly straight
        return `M ${x1},${y1} H ${x2}`;
      }

      // Calculate the horizontal distance
      const horizontalDistance = x2 - x1;

      // If there's only one curve, always center it (even if there are other straight lines)
      if (numCurvedConnections === 1) {
        const midX = x1 + horizontalDistance / 2;

        // For lines going down (start element is above end element)
        if (pathType === "down") {
          return `M ${x1},${y1} 
                H ${midX - radius} 
                Q ${midX},${y1} ${midX},${y1 + radius}
                V ${y2 - radius} 
                Q ${midX},${y2} ${midX + radius},${y2}
                H ${x2}`;
        }

        // For lines going up (start element is below end element)
        if (pathType === "up") {
          return `M ${x1},${y1} 
                H ${midX - radius} 
                Q ${midX},${y1} ${midX},${y1 - radius}
                V ${y2 + radius} 
                Q ${midX},${y2} ${midX + radius},${y2}
                H ${x2}`;
        }
      }

      // Calculate the base position (0 to 1) for this connection
      // This implements the "always take the half point" approach
      let position = 0.5; // Default to center for the first connection

      if (totalConnections > 1) {
        // This implements the "always take the half point" logic
        // by using the binary representation of the index to determine position
        const binaryPos = (index + 1).toString(2).substring(1);
        let currentLeft = 0;
        let currentRight = 1;

        for (let i = 0; i < binaryPos.length; i++) {
          const mid = (currentLeft + currentRight) / 2;
          if (binaryPos[i] === "1") {
            currentLeft = mid;
          } else {
            currentRight = mid;
          }
        }
        position = (currentLeft + currentRight) / 2;
      }

      // Apply some spacing between lines
      const spacing = 0.1; // Adjust this value to control spacing between lines
      const effectiveSpacing = spacing / Math.max(1, totalConnections - 1);
      position = position * (1 - effectiveSpacing * 2) + effectiveSpacing;

      // Calculate the midpoint
      const midX = x1 + horizontalDistance * position;

      // For lines going down (start element is above end element)
      if (pathType === "down") {
        return `M ${x1},${y1} 
              H ${midX - radius} 
              Q ${midX},${y1} ${midX},${y1 + radius}
              V ${y2 - radius} 
              Q ${midX},${y2} ${midX + radius},${y2}
              H ${x2}`;
      }

      // For lines going up (start element is below end element)
      if (pathType === "up") {
        return `M ${x1},${y1} 
              H ${midX - radius} 
              Q ${midX},${y1} ${midX},${y1 - radius}
              V ${y2 + radius} 
              Q ${midX},${y2} ${midX + radius},${y2}
              H ${x2}`;
      }

      // Default fallback
      return `M ${x1},${y1} H ${x2}`;
    },
    []
  );

  // Get color for a specific line
  const getLineColor = useCallback((index: number, mergedOptions: LineConnectionOptions): LineColor => {
    // If unique colors are disabled, use the default color
    if (mergedOptions.useUniqueColors === false) {
      return {
        base: mergedOptions.color || defaultOptions.color || "",
        pulse: mergedOptions.pulseColor || defaultOptions.pulseColor || "",
      };
    }

    // Use provided colors array if available
    const colorPalette = mergedOptions.colors || [
      { base: "hsl(273.6 65.6% 32%)", pulse: "hsl(273.6 65.6% 42%)" },
      { base: "hsl(263.5 67.4% 34.9%)", pulse: "hsl(263.5 67.4% 44.9%)" },
      { base: "hsl(242.2 47.4% 34.3%)", pulse: "hsl(242.2 47.4% 44.3%)" },
      { base: "hsl(224.4 64.3% 32.9%)", pulse: "hsl(224.4 64.3% 42.9%)" },
      { base: "hsl(202 80.3% 23.9%)", pulse: "hsl(202 80.3% 23.9%)" },
    ];

    // Get color based on index, wrapping around if needed
    const colorIndex = index % colorPalette.length;
    return colorPalette[colorIndex];
  }, []);

  // Component to render the SVG lines
  const LineConnectionSvg = useCallback(() => {
    const mergedOptions = { ...defaultOptions, ...options };
    const { lineSpacing = defaultOptions.lineSpacing } = mergedOptions;
    const totalConnections = lineCoordinates.length;
    const numCurvedConnections = lineCoordinates.filter((l) => l.pathType !== "straight").length;
    // Expanded color palette for better readability
    const colorPalette = mergedOptions.colors || [
      { base: "hsl(273.6 65.6% 32%)", pulse: "hsl(273.6 65.6% 42%)" },
      { base: "hsl(263.5 67.4% 34.9%)", pulse: "hsl(263.5 67.4% 44.9%)" },
      { base: "hsl(242.2 47.4% 34.3%)", pulse: "hsl(242.2 47.4% 44.3%)" },
      { base: "hsl(224.4 64.3% 32.9%)", pulse: "hsl(224.4 64.3% 42.9%)" },
      { base: "hsl(202 80.3% 23.9%)", pulse: "hsl(202 80.3% 23.9%)" },
    ];

    // Helper: is this line highlighted?
    const isLineHighlighted = (idx: number) => {
      if (!highlightedIndices || highlightedIndices.length === 0) return null;
      return highlightedIndices.includes(idx);
    };

    return (
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none z-10" style={{ overflow: "visible" }}>
        <defs>
          {colorPalette.map((color, i) => (
            <filter key={i} id={`glow-${i}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          ))}
        </defs>
        {lineCoordinates.map((coords, idx) => {
          // Get color for this line
          const lineColor = colorPalette[idx % colorPalette.length];
          const highlighted = isLineHighlighted(idx);
          const fadedOpacity = highlightedIndices == null ? 1 : highlighted ? 1 : 0.12;
          const pulseOpacity = highlightedIndices == null ? 1 : highlighted ? 1 : 0.18;
          return (
            <g key={coords.index} style={{ zIndex: highlighted ? 2 : 1 }}>
              <path
                d={getPathString(
                  coords,
                  mergedOptions.cornerRadius || 10,
                  lineSpacing || 30,
                  totalConnections,
                  numCurvedConnections
                )}
                stroke={lineColor.base}
                strokeWidth={highlighted ? (mergedOptions.strokeWidth || 2) * 1.8 : mergedOptions.strokeWidth}
                fill="none"
                opacity={fadedOpacity}
                style={{
                  transition: "opacity 0.5s cubic-bezier(0.4,0,0.2,1), stroke-width 0.3s cubic-bezier(0.4,0,0.2,1)",
                }}
              />
              {/* Animated pulse - always show, but faded if not highlighted */}
              <circle
                r="4"
                fill={lineColor.pulse}
                filter={`url(#glow-${coords.index % colorPalette.length})`}
                opacity={pulseOpacity}
                style={{ transition: "opacity 0.5s cubic-bezier(0.4,0,0.2,1)" }}
              >
                <animateMotion
                  path={getPathString(
                    coords,
                    mergedOptions.cornerRadius || 10,
                    lineSpacing || 30,
                    totalConnections,
                    numCurvedConnections
                  )}
                  dur={`${mergedOptions.pulseSpeed}s`}
                  repeatCount="indefinite"
                  rotate="auto"
                />
              </circle>
            </g>
          );
        })}
      </svg>
    );
  }, [lineCoordinates, getPathString, options, highlightedIndices]);

  // Recalculate when refPairs change
  useEffect(() => {
    calculateLineCoordinates();
  }, [refPairs, calculateLineCoordinates]);

  return {
    containerRef,
    LineConnectionSvg,
  };
}
