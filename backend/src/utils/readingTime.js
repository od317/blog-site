/**
 * Calculate estimated reading time for content
 * @param {string} content - The post content
 * @returns {string} - Formatted reading time (e.g., "3 min read")
 */
const calculateReadingTime = (content) => {
  const wordsPerMinute = 200;
  const wordCount = content.trim().split(/\s+/).length;
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  if (minutes === 1) return "1 min read";
  return `${minutes} min read`;
};

module.exports = { calculateReadingTime };
