import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = React.forwardRef<
 React.ElementRef<typeof SliderPrimitive.Root>,
 React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, orientation = 'horizontal', value, onValueChange, ...props }, ref) => {
  const isVertical = orientation === 'vertical';
  const [localValue, setLocalValue] = React.useState<number[]>(Array.isArray(value) ? value : [0]);
  const [dragging, setDragging] = React.useState(false);

  React.useEffect(() => {
    if (Array.isArray(value)) setLocalValue(value);
  }, [value]);

  const handleChange = (v: number[]) => {
    setLocalValue(v);
    onValueChange && onValueChange(v as any);
  };

  return (
    <SliderPrimitive.Root
      ref={ref}
      className={cn(
        'relative touch-none select-none',
        isVertical ? 'flex h-36 w-6 items-center' : 'w-full h-6 flex items-center',
        className
      )}
      value={localValue}
      onValueChange={handleChange}
      onValueCommit={() => setDragging(false)}
      onPointerDown={() => setDragging(true)}
      {...props}
    >
      <SliderPrimitive.Track className={cn(
        'relative flex-1 rounded-full bg-gray-600/30',
        isVertical ? 'w-2 h-full mx-auto' : 'h-2 w-full'
      )}>
        <SliderPrimitive.Range
          className={cn(
            'absolute rounded-full bg-gradient-to-r from-purple-500 to-blue-400',
            isVertical ? 'w-full bottom-0' : 'h-full left-0'
          )}
        />
      </SliderPrimitive.Track>

      <SliderPrimitive.Thumb
        className={cn(
          'block bg-white rounded-full shadow-lg border-2 border-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400',
          isVertical ? 'h-5 w-5' : 'h-5 w-5'
        )}
      >
        <div className={cn('pointer-events-none -mt-9 absolute left-1/2 transform -translate-x-1/2', isVertical ? 'hidden' : '')}>
          <div className="px-2 py-1 bg-black/80 text-white text-xs rounded">{Math.round((localValue?.[0] ?? 0) * ((props.max as number) || 100))}</div>
        </div>
      </SliderPrimitive.Thumb>
    </SliderPrimitive.Root>
  );
} );
Slider.displayName = 'Slider';

export { Slider };
