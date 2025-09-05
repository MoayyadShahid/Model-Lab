import { useEffect, useRef } from 'react';

export function useAutoResizeTextarea(value: string) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate the new height based on scrollHeight
    const newHeight = Math.min(textarea.scrollHeight, 200); // Max height of 200px
    textarea.style.height = `${newHeight}px`;
  }, [value]);
  
  return textareaRef;
}

