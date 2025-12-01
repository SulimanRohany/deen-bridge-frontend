// Image upload utility with compression
import axios from 'axios'
import { config, getMediaUrl } from './config'

/**
 * Compress image file before upload
 * @param {File} file - Image file to compress
 * @param {number} maxWidth - Maximum width (default: 1920)
 * @param {number} maxHeight - Maximum height (default: 1080)
 * @param {number} quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<File>} - Compressed image file
 */
export const compressImage = (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        // Calculate new dimensions
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height
            height = maxHeight
          }
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          file.type,
          quality
        )
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = e.target.result
    }
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}

/**
 * Get authentication token from localStorage
 * @returns {string|null} - Access token or null
 */
const getAccessToken = () => {
  if (typeof window === 'undefined') return null
  const authTokens = localStorage.getItem('authTokens')
  if (!authTokens) return null
  try {
    const parsedTokens = JSON.parse(authTokens)
    return parsedTokens.access
  } catch (error) {
    return null
  }
}

/**
 * Upload image to server
 * @param {File} file - Image file to upload
 * @param {Function} onProgress - Progress callback (progress: number) => void
 * @returns {Promise<string>} - URL of uploaded image
 */
export const uploadImage = async (file, onProgress = null) => {
  try {
    // Compress image before upload
    const compressedFile = await compressImage(file)
    
    const formData = new FormData()
    formData.append('image', compressedFile)
    
    const token = getAccessToken()
    if (!token) {
      throw new Error('Authentication required')
    }

    const response = await axios.post(
      config.API_BASE_URL + 'blog/upload-image/',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            )
            onProgress(percentCompleted)
          }
        },
      }
    )

    // Return the image URL
    if (response.data && response.data.url) {
      return getMediaUrl(response.data.url)
    } else if (response.data && response.data.image) {
      return getMediaUrl(response.data.image)
    } else {
      throw new Error('Invalid response from server')
    }
  } catch (error) {
    if (error.response?.status === 404) {
      // If upload endpoint doesn't exist, fall back to base64
      console.warn('Image upload endpoint not found, using base64 encoding')
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsDataURL(file)
      })
    }
    throw error
  }
}

