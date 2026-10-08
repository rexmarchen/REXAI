import apiClient from './apiClient'

const profileApi = {
  /**
   * Fetch the current user's profile from MongoDB.
   */
  get(options = {}) {
    return apiClient.get('/profile', options)
  },

  /**
   * Save / update profile fields in MongoDB.
   * @param {object} data - Profile fields to persist.
   */
  save(data, options = {}) {
    return apiClient.put('/profile', data, { __skipUnauthorizedRedirect: true, ...options })
  },

  /**
   * Update profile fields (alias for PUT).
   */
  update(data, options = {}) {
    return apiClient.put('/profile', data, { __skipUnauthorizedRedirect: true, ...options })
  },

  /**
   * Upload a resume PDF/DOCX to MongoDB and server storage.
   * @param {File} file - The file to upload.
   * @param {function} [onProgress] - Optional progress callback.
   */
  uploadResume(file, onProgress) {
    const form = new FormData()
    form.append('resume', file)
    return apiClient.post('/profile/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress
        ? (event) => {
            const percent = Math.round((event.loaded * 100) / (event.total || 1))
            onProgress(percent)
          }
        : undefined,
    })
  },

  /**
   * Upload an avatar photo, logo, or banner image.
   * @param {File} file - The image file to upload.
   */
  uploadImage(file) {
    const form = new FormData()
    form.append('image', file)
    return apiClient.post('/profile/image', form, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

export default profileApi
