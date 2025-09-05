/**
 * Formats a message string into readable paragraphs
 * - Preserves existing paragraph breaks
 * - Adds line breaks for long paragraphs
 * - Handles markdown formatting
 * - Works for both user and assistant messages
 */
export function formatMessage(text: string): string {
  // Handle long strings without spaces by inserting breaks
  if (text.length > 50 && !text.includes(' ') && !text.includes('\n')) {
    // Insert a zero-width space every 20 characters to allow breaking
    return text.replace(/(.{20})/g, '$1\u200B');
  }
  
  // If text is very short (like a simple user query), return as is
  if (text.length < 80 && !text.includes('\n')) {
    return text;
  }
  
  // If text already has paragraphs (double line breaks), preserve them
  if (text.includes('\n\n')) {
    return text;
  }

  // Split by single line breaks first
  const lines = text.split('\n');
  
  // Process each line and add paragraph breaks for long text
  const formattedLines = lines.map(line => {
    // Skip processing for code blocks, lists, and other markdown elements
    if (line.startsWith('```') || 
        line.startsWith('- ') || 
        line.startsWith('* ') || 
        line.startsWith('1. ') ||
        line.startsWith('#')) {
      return line;
    }
    
    // For regular text, add paragraph breaks for long content
    if (line.length > 100) {
      // Find natural break points (periods, question marks, etc.) 
      // and add line breaks after them
      return line.replace(/([.?!])\s+(?=[A-Z])/g, '$1\n\n');
    }
    
    return line;
  });
  
  return formattedLines.join('\n');
}
