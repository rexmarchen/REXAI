import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import styles from './ImageCropModal.module.css'

/**
 * Interactive Image Crop & Pan Modal
 * Supports fluid pan, zoom, grid guidelines, and high-res canvas exports.
 */
const ImageCropModal = ({
  isOpen,
  imageSrc,
  type = 'banner',
  aspectRatio = 3.2,
  title = 'Cover Photo Studio',
  targetWidth = 1440,
  targetHeight = 450,
  onClose,
  onCropComplete,
  onRemove
}) => {
  const [activeSrc, setActiveSrc] = useState(imageSrc || '')
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [frameDimensions, setFrameDimensions] = useState({ width: 680, height: 212 })
  const [processing, setProcessing] = useState(false)

  const frameRef = useRef(null)
  const imageElementRef = useRef(null)
  const filePickerRef = useRef(null)
  const selectedRawFileRef = useRef(null)

  // 1. Sync active image source when modal opens or prop changes
  useEffect(() => {
    if (!isOpen) return
    setActiveSrc(imageSrc || '')
    setZoom(1)
    setOffset({ x: 0, y: 0 })
    selectedRawFileRef.current = null
  }, [isOpen, imageSrc])

  // 2. Measure frame & load image whenever activeSrc changes
  useEffect(() => {
    if (!isOpen || !activeSrc) return

    setZoom(1)
    setOffset({ x: 0, y: 0 })

    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight })
    }
    img.onerror = () => {
      const fallback = new Image()
      fallback.onload = () => {
        setNaturalSize({ width: fallback.naturalWidth, height: fallback.naturalHeight })
      }
      fallback.src = activeSrc
    }
    img.src = activeSrc
  }, [isOpen, activeSrc])

  // 2. Measure viewport frame width and height according to aspect ratio
  useEffect(() => {
    if (!frameRef.current) return
    const updateSize = () => {
      const isSquare = aspectRatio <= 1.2
      const containerWidth = frameRef.current?.offsetWidth || (isSquare ? 360 : 620)
      if (isSquare) {
        // Compact square avatar / DP: never exceed 280px or 35% of viewport height
        const maxAllowed = Math.min(280, Math.floor(window.innerHeight * 0.35))
        const size = Math.min(containerWidth, maxAllowed)
        setFrameDimensions({ width: size, height: size })
      } else {
        // Wide cover photo banner
        const maxH = Math.min(240, Math.floor(window.innerHeight * 0.32))
        const calculatedHeight = Math.min(Math.round(containerWidth / aspectRatio), maxH)
        setFrameDimensions({ width: containerWidth, height: calculatedHeight })
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [isOpen, aspectRatio])

  // 3. Compute base scale so image always fully covers viewport
  const baseScale = naturalSize.width && naturalSize.height
    ? Math.max(
        frameDimensions.width / naturalSize.width,
        frameDimensions.height / naturalSize.height
      )
    : 1

  const currentScale = baseScale * zoom
  const displayedWidth = naturalSize.width * currentScale
  const displayedHeight = naturalSize.height * currentScale

  // Clamping offsets so image never shows whitespace outside the viewport
  const maxOffsetX = Math.max(0, (displayedWidth - frameDimensions.width) / 2)
  const maxOffsetY = Math.max(0, (displayedHeight - frameDimensions.height) / 2)

  const clampOffset = useCallback(
    (newX, newY) => {
      return {
        x: Math.max(-maxOffsetX, Math.min(maxOffsetX, newX)),
        y: Math.max(-maxOffsetY, Math.min(maxOffsetY, newY))
      }
    },
    [maxOffsetX, maxOffsetY]
  )

  // 4. Mouse / Touch Drag handlers
  const handlePointerDown = (e) => {
    setIsDragging(true)
    const clientX = e.clientX ?? e.touches?.[0]?.clientX
    const clientY = e.clientY ?? e.touches?.[0]?.clientY
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y })
  }

  const handlePointerMove = (e) => {
    if (!isDragging) return
    const clientX = e.clientX ?? e.touches?.[0]?.clientX
    const clientY = e.clientY ?? e.touches?.[0]?.clientY
    const newX = clientX - dragStart.x
    const newY = clientY - dragStart.y
    setOffset(clampOffset(newX, newY))
  }

  const handlePointerUp = () => {
    setIsDragging(false)
  }

  // 5. Presets
  const handlePreset = (preset) => {
    if (preset === 'top') {
      setOffset((prev) => clampOffset(prev.x, maxOffsetY))
    } else if (preset === 'center') {
      setOffset({ x: 0, y: 0 })
    } else if (preset === 'bottom') {
      setOffset((prev) => clampOffset(prev.x, -maxOffsetY))
    }
  }

  // 6. Generate high-res cropped output canvas
  const handleApplyCrop = async () => {
    const imgEl = imageElementRef.current
    const nw = naturalSize.width || imgEl?.naturalWidth || 0
    const nh = naturalSize.height || imgEl?.naturalHeight || 0
    if (!imgEl || !nw || !nh) {
      if (selectedRawFileRef.current && onCropComplete) {
        setProcessing(true)
        try {
          const resolvedType = type || (isSquare ? 'avatar' : 'banner')
          await onCropComplete(null, selectedRawFileRef.current, resolvedType)
          onClose()
        } catch (e) {
          console.error('[CROPPER] Fallback direct upload failed:', e)
        } finally {
          setProcessing(false)
        }
        return
      }
      alert('Image is still loading, please wait a moment.')
      return
    }

    try {
      setProcessing(true)

      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // Calculate rendered scale and source crop box
      const effectiveScale = currentScale || 1
      const renderedW = nw * effectiveScale
      const renderedH = nh * effectiveScale

      const renderedRatio = nw / (renderedW || 1)
      const frameWidthInSource = frameDimensions.width * renderedRatio
      const frameHeightInSource = frameDimensions.height * renderedRatio

      const sourceCenterX = nw / 2 - offset.x * renderedRatio
      const sourceCenterY = nh / 2 - offset.y * renderedRatio

      const sourceX = Math.max(0, sourceCenterX - frameWidthInSource / 2)
      const sourceY = Math.max(0, sourceCenterY - frameHeightInSource / 2)
      const sw = Math.min(nw - sourceX, frameWidthInSource)
      const sh = Math.min(nh - sourceY, frameHeightInSource)

      ctx.drawImage(
        imgEl,
        sourceX,
        sourceY,
        sw,
        sh,
        0,
        0,
        targetWidth,
        targetHeight
      )

      canvas.toBlob(
        async (blob) => {
          try {
            const resolvedType = type || (isSquare ? 'avatar' : 'banner')
            if (!blob) {
              if (selectedRawFileRef.current && onCropComplete) {
                await onCropComplete(null, selectedRawFileRef.current, resolvedType)
              }
              return
            }
            const filename = `${resolvedType}-${Date.now()}.jpg`
            const file = new File([blob], filename, { type: 'image/jpeg' })
            if (onCropComplete) {
              await onCropComplete(blob, file, resolvedType)
            }
          } catch (uploadErr) {
            console.error('[CROPPER] Upload save error:', uploadErr)
            if (selectedRawFileRef.current && onCropComplete) {
              await onCropComplete(null, selectedRawFileRef.current, type)
            }
          } finally {
            setProcessing(false)
            onClose()
          }
        },
        'image/jpeg',
        0.95
      )
    } catch (err) {
      console.error('[CROPPER] Crop canvas failed:', err)
      if (selectedRawFileRef.current && onCropComplete) {
        try {
          const resolvedType = type || (isSquare ? 'avatar' : 'banner')
          await onCropComplete(null, selectedRawFileRef.current, resolvedType)
          setProcessing(false)
          onClose()
          return
        } catch (e2) {
          console.error('[CROPPER] Fallback upload also failed:', e2)
        }
      }
      setProcessing(false)
      alert('Could not export cropped image. Please try picking a JPG/PNG from your computer.')
    }
  }

  const isSquare = aspectRatio <= 1.2

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className={styles.cropModalOverlay} onClick={onClose}>
        <motion.div
          className={`${styles.cropModalContent} ${isSquare ? styles.cropModalContentSquare : ''}`}
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.2 }}
        >
          {/* Hidden File Picker Input */}
          <input
            type="file"
            ref={filePickerRef}
            style={{ display: 'none' }}
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (!file) return
              selectedRawFileRef.current = file
              const objectUrl = URL.createObjectURL(file)
              setActiveSrc(objectUrl)
              if (e.target) e.target.value = ''
            }}
          />

          {/* Header */}
          <div className={styles.cropHeader}>
            <div className={styles.cropTitleRow}>
              <h3 className={styles.cropTitle}>{title}</h3>
              <span className={styles.cropBadge}>{isSquare ? 'Profile DP' : 'Cover Banner'}</span>
            </div>
            <button type="button" className={styles.closeBtn} onClick={onClose}>
              ✕
            </button>
          </div>

          {!activeSrc ? (
            /* Upload Dropzone when no photo is selected yet */
            <div className={styles.dropzoneBox} onClick={() => filePickerRef.current?.click()}>
              <div className={styles.dropzoneIcon}>{isSquare ? '👤' : '🖼️'}</div>
              <div className={styles.dropzoneTitle}>
                {isSquare ? 'Choose Profile Photo / Logo' : 'Choose Cover Photo'}
              </div>
              <div className={styles.dropzoneSubtitle}>
                {isSquare
                  ? 'Select an image from your device to center and crop your profile avatar'
                  : 'Select an image from your device to fit and frame your profile panel'}
              </div>
              <button type="button" className={styles.dropzoneBtn}>
                📁 Browse & Select Photo
              </button>
            </div>
          ) : (
            <>
              {/* Instructions Bar & Change Photo Button */}
              <div className={styles.cropInstructionsRow}>
                <p className={styles.cropInstructions}>
                  ✋ Drag to reposition. Zoom to frame your {isSquare ? 'profile photo' : 'cover'}.
                </p>
                <button
                  type="button"
                  className={styles.changePhotoBtn}
                  onClick={() => filePickerRef.current?.click()}
                  title="Choose a different image from your device"
                >
                  📁 Choose Another Photo
                </button>
              </div>

              {/* Interactive Viewport Frame */}
              <div
                className={styles.viewportContainer}
                style={{ minHeight: `${frameDimensions.height}px` }}
                ref={frameRef}
              >
                <div
                  className={`${styles.viewportFrame} ${isDragging ? styles.isDragging : ''}`}
                  style={{ width: `${frameDimensions.width}px`, height: `${frameDimensions.height}px` }}
                  onMouseDown={handlePointerDown}
                  onMouseMove={handlePointerMove}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={handlePointerDown}
                  onTouchMove={handlePointerMove}
                  onTouchEnd={handlePointerUp}
                >
                  {activeSrc && (
                    <img
                      ref={imageElementRef}
                      crossOrigin="anonymous"
                      src={activeSrc}
                      alt="Crop Target"
                      className={styles.cropImage}
                      onLoad={(e) => {
                        const nw = e.target.naturalWidth
                        const nh = e.target.naturalHeight
                        if (nw && nh) {
                          setNaturalSize({ width: nw, height: nh })
                        }
                      }}
                      style={{
                        width: naturalSize.width ? `${naturalSize.width}px` : 'auto',
                        height: naturalSize.height ? `${naturalSize.height}px` : 'auto',
                        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${currentScale})`
                      }}
                      draggable={false}
                    />
                  )}

                  {/* Composition Grid Guidelines */}
                  <div className={styles.gridOverlay} />

                  {/* Circular Avatar Guide for DP */}
                  {isSquare && <div className={styles.circleGuide} />}
                </div>
              </div>

              {/* Controls Bar: Zoom & Alignment Presets */}
              <div className={styles.controlsBar}>
                <div className={styles.zoomSection}>
                  <span className={styles.zoomLabel}>🔍 Zoom</span>
                  <button
                    type="button"
                    className={styles.zoomBtn}
                    onClick={() => setZoom((z) => Math.max(1, +(z - 0.1).toFixed(2)))}
                    disabled={zoom <= 1}
                  >
                    −
                  </button>
                  <input
                    type="range"
                    className={styles.sliderInput}
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    onChange={(e) => {
                      const newZoom = parseFloat(e.target.value)
                      setZoom(newZoom)
                      setOffset((prev) => clampOffset(prev.x, prev.y))
                    }}
                  />
                  <button
                    type="button"
                    className={styles.zoomBtn}
                    onClick={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
                    disabled={zoom >= 3}
                  >
                    +
                  </button>
                </div>

                <div className={styles.presetSection}>
                  <span className={styles.presetLabel}>Align:</span>
                  <button type="button" className={styles.presetBtn} onClick={() => handlePreset('top')}>
                    Top
                  </button>
                  <button type="button" className={styles.presetBtn} onClick={() => handlePreset('center')}>
                    Center
                  </button>
                  <button type="button" className={styles.presetBtn} onClick={() => handlePreset('bottom')}>
                    Bottom
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Modal Actions */}
          <div className={styles.modalActions}>
            {onRemove && (
              <button
                type="button"
                className={styles.removeActionBtn}
                onClick={() => {
                  onRemove()
                  onClose()
                }}
              >
                ✕ Remove {isSquare ? 'Photo' : 'Cover'}
              </button>
            )}
            <button type="button" className={styles.cancelBtn} onClick={onClose} disabled={processing}>
              Cancel
            </button>
            {activeSrc && (
              <button
                type="button"
                className={styles.applyBtn}
                onClick={handleApplyCrop}
                disabled={processing || !naturalSize.width}
              >
                {processing
                  ? 'Saving...'
                  : (isSquare ? '✓ Save Profile Photo' : '✓ Save Cover Photo')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default ImageCropModal
