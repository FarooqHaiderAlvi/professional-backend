import { getVideoDurationInSeconds } from 'get-video-duration'
/**
 * Retrieve video duration from a local or remote video file.
 * @param {string} filePath - URL or path to the video file.
 * @returns {number} Duration in seconds.
 */
export const getVideoMD = async (filePath) => {
  const duration = await getVideoDurationInSeconds(filePath);
  return Math.floor(duration);
};