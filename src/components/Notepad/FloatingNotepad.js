import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit3, Minimize2, Maximize2, Download, Upload, Save, RotateCcw, Plus, Expand, Shrink, ChevronsUpDown } from 'lucide-react';
import AudioPlayer from '../Audio/AudioPlayer';
import NotepadTabBar from './NotepadTabBar';

const FloatingNotepad = ({
  notepadState,
  darkMode,
  onExportTxt,
  onUploadToSongs,
  onSaveChanges,
  onRevertChanges,
  onStartNewContent,
  hasUnsavedChanges,
  // Audio-related props
  currentSongAudio = null,
  onAudioDownload = null,
  onAudioRemove = null,
  onAudioReplace = null,
  // Draft/Tab management props
  openTabs = [],
  activeTabIndex = 0,
  onSwitchTab = null,
  onCloseTab = null,
  getTabDisplayName = () => 'Untitled'
}) => {
  const {
    content,
    title,
    isMinimized,
    dimensions,
    position,
    updateContent,
    updateTitle,
    toggleMinimized,
    setPosition,
    updateDimensions
  } = notepadState;

  const containerRef = useRef(null);
  const dragDataRef = useRef(null);
  const resizeDataRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tempPosition, setTempPosition] = useState(position);
  const [tempDimensions, setTempDimensions] = useState(dimensions);
  const [isMobileResizing, setIsMobileResizing] = useState(false);
  const mobileResizeDataRef = useRef(null);
  
  // Store the current transform for immediate DOM updates
  const currentTransformRef = useRef({ x: 0, y: 0, width: 0, height: 0 });
  
  // Mobile detection - simplified
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Detect keyboard open/close using Visual Viewport API
  useEffect(() => {
    if (!isMobile || !window.visualViewport) return;

    const handleViewportResize = () => {
      // When keyboard opens, visual viewport height decreases significantly
      const viewportHeight = window.visualViewport.height;
      const windowHeight = window.innerHeight;
      const heightDiff = windowHeight - viewportHeight;

      // If viewport is more than 150px smaller than window, keyboard is likely open
      setIsKeyboardOpen(heightDiff > 150);
    };

    window.visualViewport.addEventListener('resize', handleViewportResize);
    return () => window.visualViewport.removeEventListener('resize', handleViewportResize);
  }, [isMobile]);
  
  // Toggle fullscreen
  const toggleFullscreen = () => {
    console.log('🔍 toggleFullscreen called, current state:', { isFullscreen, isMinimized });
    if (!isFullscreen && isMinimized) {
      // When entering fullscreen, ensure notepad is not minimized
      console.log('🔍 Expanding notepad before fullscreen');
      toggleMinimized();
    }
    const newFullscreenState = !isFullscreen;
    console.log('🔍 Setting fullscreen to:', newFullscreenState);
    setIsFullscreen(newFullscreenState);
  };

  useEffect(() => {
    setTempPosition(position);
    currentTransformRef.current = {
      ...currentTransformRef.current,
      right: position.right,
      bottom: position.bottom
    };
  }, [position]);

  useEffect(() => {
    setTempDimensions(dimensions);
    currentTransformRef.current = {
      ...currentTransformRef.current,
      width: dimensions.width,
      height: dimensions.height
    };
  }, [dimensions]);

  const startDrag = (clientX, clientY) => {
    if (isMinimized) return;
    if (dragDataRef.current) return;
    if (isMobile) return; // Disable dragging on mobile
    
    const rect = containerRef.current.getBoundingClientRect();
    dragDataRef.current = {
      startX: clientX,
      startY: clientY,
      rect
    };
    
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'move';
    
    // Initialize current transform with starting position
    currentTransformRef.current = {
      ...currentTransformRef.current,
      right: tempPosition.right,
      bottom: tempPosition.bottom
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', endDrag);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', endDrag);
  };

  const handleMouseDown = (e) => {
    // Don't start drag if clicking on resize handles, inputs, or buttons
    if (e.target.closest('input, button') || 
        e.target.style.cursor.includes('resize') ||
        e.target.title?.includes('Resize')) return;
    if (isMobile) return; // Disable dragging on mobile
    startDrag(e.clientX, e.clientY);
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('input, button')) return;
    if (isMobile) return; // Disable touch dragging on mobile
    const touch = e.touches[0];
    startDrag(touch.clientX, touch.clientY);
  };

  const handleMouseMove = (e) => {
    if (!dragDataRef.current || !containerRef.current) return;
    
    const { startX, startY, rect } = dragDataRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    const newLeft = rect.left + dx;
    const newTop = rect.top + dy;
    
    // Keep within viewport bounds
    const maxLeft = window.innerWidth - rect.width;
    const maxTop = window.innerHeight - rect.height;
    const constrainedLeft = Math.max(0, Math.min(maxLeft, newLeft));
    const constrainedTop = Math.max(0, Math.min(maxTop, newTop));
    
    // Update DOM directly for immediate response using transform for better performance
    const element = containerRef.current;
    const newRight = window.innerWidth - constrainedLeft - rect.width;
    const newBottom = window.innerHeight - constrainedTop - rect.height;
    
    // Use transform instead of changing position for better performance
    const translateX = constrainedLeft - rect.left;
    const translateY = constrainedTop - rect.top;
    element.style.transform = `translate(${translateX}px, ${translateY}px)`;
    
    // Store the new position for final state update
    currentTransformRef.current = { ...currentTransformRef.current, right: newRight, bottom: newBottom };
  };

  const handleTouchMove = (e) => {
    const touch = e.touches[0];
    handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
  };

  const endDrag = () => {
    if (!dragDataRef.current) return;
    
    dragDataRef.current = null;
    setIsDragging(false);
    document.body.style.userSelect = '';
    document.body.style.cursor = '';
    
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', endDrag);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', endDrag);
    
    // Clear transform and update React state with final position
    if (containerRef.current) {
      containerRef.current.style.transform = '';
    }
    
    const finalPosition = {
      right: currentTransformRef.current.right,
      bottom: currentTransformRef.current.bottom
    };
    setTempPosition(finalPosition);
    setPosition(finalPosition);
  };

  // Resize functionality
  const startResize = (direction, clientX, clientY) => {
    if (isMinimized || resizeDataRef.current) return;
    if (isMobile) return; // Disable resizing on mobile
    
    const rect = containerRef.current.getBoundingClientRect();
    resizeDataRef.current = {
      direction,
      startX: clientX,
      startY: clientY,
      startWidth: rect.width,
      startHeight: rect.height,
      startLeft: rect.left,
      startTop: rect.top,
      startRight: tempPosition.right,
      startBottom: tempPosition.bottom
    };
    
    setIsResizing(true);
    
    // Initialize current transform with starting dimensions and position
    currentTransformRef.current = {
      width: rect.width,
      height: rect.height,
      right: tempPosition.right,
      bottom: tempPosition.bottom
    };
    
    document.addEventListener('mousemove', handleResizeMouseMove, { passive: false });
    document.addEventListener('mouseup', endResize);
    document.body.style.cursor = getResizeCursor(direction);
    document.body.style.userSelect = 'none';
  };

  const handleResizeMouseMove = (e) => {
    if (!resizeDataRef.current || !containerRef.current) return;
    
    const { direction, startX, startY, startWidth, startHeight, startRight, startBottom } = resizeDataRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    let newWidth = startWidth;
    let newHeight = startHeight;
    let newRight = startRight;
    let newBottom = startBottom;
    
    const minWidth = 200;
    const minHeight = 200;
    const maxWidth = window.innerWidth - 40;
    const maxHeight = window.innerHeight - 40;

    // Handle different resize directions
    if (direction.includes('e')) { // East (right edge)
      newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + dx));
    }
    if (direction.includes('w')) { // West (left edge)
      const proposedWidth = startWidth - dx;
      newWidth = Math.max(minWidth, Math.min(maxWidth, proposedWidth));
      const actualWidthChange = newWidth - startWidth;
      newRight = startRight - actualWidthChange;
    }
    if (direction.includes('s')) { // South (bottom edge)
      newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + dy));
    }
    if (direction.includes('n')) { // North (top edge)
      const proposedHeight = startHeight - dy;
      newHeight = Math.max(minHeight, Math.min(maxHeight, proposedHeight));
      const actualHeightChange = newHeight - startHeight;
      newBottom = startBottom - actualHeightChange;
    }

    // Ensure we don't go off screen
    const maxRight = window.innerWidth - newWidth;
    const maxBottom = window.innerHeight - newHeight;
    newRight = Math.max(0, Math.min(maxRight, newRight));
    newBottom = Math.max(0, Math.min(maxBottom, newBottom));

    // Update DOM directly for immediate response
    const element = containerRef.current;
    element.style.width = `${newWidth}px`;
    element.style.height = `${newHeight}px`;
    
    // Only update position if it changed to avoid unnecessary reflows
    if (newRight !== startRight || newBottom !== startBottom) {
      element.style.right = `${newRight}px`;
      element.style.bottom = `${newBottom}px`;
    }
    
    // Store the new dimensions and position for final state update
    currentTransformRef.current = {
      width: newWidth,
      height: newHeight,
      right: newRight,
      bottom: newBottom
    };
  };

  const endResize = () => {
    if (!resizeDataRef.current) return;
    
    resizeDataRef.current = null;
    setIsResizing(false);
    document.removeEventListener('mousemove', handleResizeMouseMove);
    document.removeEventListener('mouseup', endResize);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    // Update React state with final dimensions and position
    const finalDimensions = {
      width: currentTransformRef.current.width,
      height: currentTransformRef.current.height
    };
    const finalPosition = {
      right: currentTransformRef.current.right,
      bottom: currentTransformRef.current.bottom
    };
    
    setTempDimensions(finalDimensions);
    setTempPosition(finalPosition);
    updateDimensions(finalDimensions);
    setPosition(finalPosition);
  };

  const getResizeCursor = (direction) => {
    const cursors = {
      'n': 'ns-resize',
      'ne': 'ne-resize',
      'e': 'ew-resize',
      'se': 'se-resize',
      's': 'ns-resize',
      'sw': 'sw-resize',
      'w': 'ew-resize',
      'nw': 'nw-resize'
    };
    return cursors[direction] || 'default';
  };

  // Mobile resize via drag handle
  const startMobileResize = (clientY) => {
    if (isMinimized || isFullscreen) return;

    mobileResizeDataRef.current = {
      startY: clientY,
      startHeight: tempDimensions.height
    };

    setIsMobileResizing(true);
    document.body.style.userSelect = 'none';
    document.body.style.touchAction = 'none';

    document.addEventListener('touchmove', handleMobileResizeMove, { passive: false });
    document.addEventListener('touchend', endMobileResize);
    document.addEventListener('mousemove', handleMobileResizeMouseMove, { passive: false });
    document.addEventListener('mouseup', endMobileResize);
  };

  const handleMobileResizeMove = (e) => {
    e.preventDefault();
    if (!mobileResizeDataRef.current) return;

    const touch = e.touches[0];
    const { startY, startHeight } = mobileResizeDataRef.current;

    // Dragging up (negative dy) increases height, dragging down decreases
    const dy = startY - touch.clientY;
    const newHeight = Math.max(200, Math.min(window.innerHeight - 150, startHeight + dy));

    // Update DOM directly for smooth performance
    if (containerRef.current) {
      containerRef.current.style.height = `${newHeight}px`;
    }

    currentTransformRef.current = {
      ...currentTransformRef.current,
      height: newHeight
    };
  };

  const handleMobileResizeMouseMove = (e) => {
    if (!mobileResizeDataRef.current) return;

    const { startY, startHeight } = mobileResizeDataRef.current;
    const dy = startY - e.clientY;
    const newHeight = Math.max(200, Math.min(window.innerHeight - 150, startHeight + dy));

    if (containerRef.current) {
      containerRef.current.style.height = `${newHeight}px`;
    }

    currentTransformRef.current = {
      ...currentTransformRef.current,
      height: newHeight
    };
  };

  const endMobileResize = () => {
    if (!mobileResizeDataRef.current) return;

    mobileResizeDataRef.current = null;
    setIsMobileResizing(false);
    document.body.style.userSelect = '';
    document.body.style.touchAction = '';

    document.removeEventListener('touchmove', handleMobileResizeMove);
    document.removeEventListener('touchend', endMobileResize);
    document.removeEventListener('mousemove', handleMobileResizeMouseMove);
    document.removeEventListener('mouseup', endMobileResize);

    // Update React state with final height
    const finalHeight = currentTransformRef.current.height;
    if (finalHeight) {
      const finalDimensions = {
        ...tempDimensions,
        height: finalHeight
      };
      setTempDimensions(finalDimensions);
      updateDimensions(finalDimensions);
    }
  };

  const handleDragHandleTouchStart = (e) => {
    e.preventDefault();
    const touch = e.touches[0];
    startMobileResize(touch.clientY);
  };

  const handleDragHandleMouseDown = (e) => {
    e.preventDefault();
    startMobileResize(e.clientY);
  };

  const handleKeyDown = (e) => {
    if (e.target !== e.currentTarget) return;
    const step = 10;
    let newPos = { ...tempPosition };
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        newPos.bottom = newPos.bottom + step;
        setTempPosition(newPos);
        setPosition(newPos);
        break;
      case 'ArrowDown':
        e.preventDefault();
        newPos.bottom = Math.max(0, newPos.bottom - step);
        setTempPosition(newPos);
        setPosition(newPos);
        break;
      case 'ArrowLeft':
        e.preventDefault();
        newPos.right = newPos.right + step;
        setTempPosition(newPos);
        setPosition(newPos);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newPos.right = Math.max(0, newPos.right - step);
        setTempPosition(newPos);
        setPosition(newPos);
        break;
      case 'Escape':
        e.preventDefault();
        newPos = { bottom: 20, right: 20 };
        setTempPosition(newPos);
        setPosition(newPos);
        break;
      default:
    }
  };
  
  const handleContentChange = (e) => {
    updateContent(e.target.value);
  };

  const handleTitleChange = (e) => {
    updateTitle(e.target.value);
  };

  // Track audio player container ref for portal positioning
  // (Must be declared before early returns to follow React hooks rules)
  const audioContainerRef = useRef(null);
  const [audioPosition, setAudioPosition] = useState({ top: 0, left: 0, width: 0 });

  // Update audio position when container or state changes
  useEffect(() => {
    const updatePosition = () => {
      if (audioContainerRef.current && !isMinimized && !isFullscreen) {
        const rect = audioContainerRef.current.getBoundingClientRect();
        setAudioPosition({
          top: rect.top,
          left: rect.left,
          width: rect.width
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    // Also update when notepad position/dimensions change
    const interval = setInterval(updatePosition, 100);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      clearInterval(interval);
    };
  }, [isMinimized, isFullscreen, tempPosition, tempDimensions]);

  // Persistent Audio Player Portal - must render even when minimized to preserve audio state
  const persistentAudioPlayer = currentSongAudio && createPortal(
    <div
      id="persistent-notepad-audio"
      className={`flex-shrink-0 w-full ${
        darkMode ? 'bg-gray-800' : 'bg-white'
      }`}
      style={{
        position: 'fixed',
        zIndex: 1000000,
        ...(isMinimized ? {
          // Hidden when minimized but keep mounted
          opacity: 0,
          pointerEvents: 'none',
          top: '-9999px'
        } : isFullscreen ? {
          // Fullscreen: position at top after header and tabs
          top: `calc(max(32px, calc(8px + env(safe-area-inset-top, 24px))) + 49px${openTabs.length > 0 ? ' + 36px' : ''})`,
          left: 0,
          right: 0,
          borderBottom: darkMode ? '1px solid #4B5563' : '1px solid #E5E7EB'
        } : audioPosition.width > 0 ? {
          // Normal expanded: position over the spacer
          top: audioPosition.top + 'px',
          left: audioPosition.left + 'px',
          width: audioPosition.width + 'px',
          borderBottom: darkMode ? '1px solid #4B5563' : '1px solid #E5E7EB'
        } : {
          display: 'none'
        })
      }}
    >
      <AudioPlayer
        key={`persistent-audio-${currentSongAudio.url}`}
        audioUrl={currentSongAudio.url}
        audioFilename={currentSongAudio.filename}
        audioSize={currentSongAudio.size}
        audioDuration={currentSongAudio.duration}
        darkMode={darkMode}
        onDownload={onAudioDownload}
        onRemove={onAudioRemove}
        onReplace={onAudioReplace}
        showControls={true}
        compact={true}
        hideMenu={true}
      />
    </div>,
    document.body
  );

  // Render FAB for mobile when minimized (but still include audio portal)
  if (isMinimized && isMobile && !isFullscreen) {
    return (
      <>
        {persistentAudioPlayer}
        <button
          onClick={toggleMinimized}
          className={`fixed rounded-full shadow-2xl transition-all duration-300 z-[999999] flex items-center justify-center ${
            darkMode
              ? 'bg-gray-800 border-white border-2 hover:bg-gray-700'
              : 'bg-white border-gray-500 border-2 hover:bg-gray-100'
          }`}
          style={{
            bottom: `calc(80px + env(safe-area-inset-bottom, 0px))`, // 80px = 64px bottom nav + 16px spacing
            right: `calc(16px + env(safe-area-inset-right, 0px))`,
            width: '56px',
            height: '56px'
          }}
          title="Open Notepad"
          aria-label="Open Notepad"
        >
          <Edit3 className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`} />
        </button>
      </>
    );
  }

  return (
    <>
    {/* Persistent Audio Player - Rendered via portal to survive fullscreen/minimize transitions */}
    {persistentAudioPlayer}

    {/* Mobile Drag Handle - Shows above notepad when expanded on mobile */}
    {!isFullscreen && !isMinimized && isMobile && (
      <div
        onTouchStart={(e) => {
          e.stopPropagation();
          handleDragHandleTouchStart(e);
        }}
        onMouseDown={(e) => {
          e.stopPropagation();
          handleDragHandleMouseDown(e);
        }}
        onClick={(e) => e.stopPropagation()}
        className={`fixed flex items-center justify-center cursor-ns-resize z-[999999]`}
        style={{
          bottom: `${tempPosition.bottom + (isKeyboardOpen ? 8 : 64) + tempDimensions.height}px`,
          // Center the handle: notepad right edge + half notepad width - half handle width
          right: `${tempPosition.right + (tempDimensions.width / 2) - (tempDimensions.width * 0.25 / 2)}px`,
          width: `${tempDimensions.width * 0.25}px`,
          minWidth: '80px',
          height: '24px',
          touchAction: 'none',
          backgroundColor: darkMode ? 'rgba(31, 41, 55, 1)' : 'rgba(255, 255, 255, 1)',
          border: darkMode ? '2px solid white' : '2px solid #6b7280',
          borderRadius: '8px 8px 0 0',
          borderBottom: 'none'
        }}
      >
        {/* Drag handle icon */}
        <ChevronsUpDown
          className={`transition-colors ${
            isMobileResizing
              ? darkMode ? 'text-gray-300' : 'text-gray-600'
              : darkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
          style={{ width: '20px', height: '20px' }}
        />
      </div>
    )}

    {!isFullscreen && (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className={`fixed shadow-2xl border ${
        isDragging || isResizing || isMobileResizing ? 'transition-none' : 'transition-all duration-300'
      } ${
        isMinimized ? 'z-[60] md:z-[70] floating-notepad-minimized' : 'z-[999999]'
      } ${
        darkMode
          ? 'bg-gray-800 border-white border-2'
          : 'bg-white border-gray-500 border-2'
      } ${!isMinimized ? 'floating-notepad-expanded' : ''} ${
        isDragging ? 'shadow-3xl scale-[1.02]' : ''
      } ${
        isResizing || isMobileResizing ? 'shadow-3xl' : ''
      }`}
      style={
        isMinimized
          ? {
              // Collapsed: Bottom bar - FIXED to viewport bottom (desktop only now)
              bottom: '0',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 'min(300px, calc(100vw - 32px))',
              height: '40px',
              borderRadius: '8px 8px 0 0',
              borderBottom: 'none',
              resize: 'none',
              overflow: 'hidden',
              border: darkMode ? '2px solid white !important' : '2px solid #6b7280 !important',
              display: isMobile ? 'none' : 'block' // Hide bar on mobile, show FAB instead
            }
          : {
              // Expanded: Floating window
              // When keyboard is open, reduce offset since BottomNav is hidden by keyboard
              bottom: isMobile ? `${tempPosition.bottom + (isKeyboardOpen ? 8 : 64)}px` : `${tempPosition.bottom}px`,
              right: isMobile ? `calc(${Math.max(tempPosition.right, 8)}px + env(safe-area-inset-right, 0px))` : `${tempPosition.right}px`,
              width: isMobile ? `calc(${tempDimensions.width}px - env(safe-area-inset-right, 0px))` : `${tempDimensions.width}px`,
              height: `${tempDimensions.height}px`,
              borderRadius: '8px',
              resize: 'none', // Disable default resize, we'll use custom handles
              overflow: 'hidden',
              minWidth: '200px',
              minHeight: '200px',
              border: darkMode ? '2px solid white !important' : '2px solid #6b7280 !important'
            }
      }
    >
      {/* Header - Contains title and buttons */}
      <div
        className={`flex items-center justify-between p-2 ${
          isMinimized ? '' : 'border-b'
        } ${
          darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
        } ${
          isMobile ? 'cursor-default' : 'cursor-move'
        }`}
        onMouseDown={isMobile ? undefined : handleMouseDown}
        onTouchStart={isMobile ? undefined : handleTouchStart}
      >
        {/* Left side - Icon + Title or Notepad label */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Edit3 className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          {isMinimized ? (
            <span 
              className={`text-sm font-medium cursor-pointer truncate ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}
              onClick={toggleMinimized}
            >
              {title || 'Notepad'}{hasUnsavedChanges ? '*' : ''}
            </span>
          ) : (
            <input
              type="text"
              value={title + (hasUnsavedChanges ? '*' : '')}
              onChange={(e) => handleTitleChange({ target: { value: e.target.value.replace('*', '') } })}
              placeholder="Title..."
              className={`flex-1 px-1 md:px-2 py-0.5 md:py-1 text-xs md:text-sm border rounded min-w-0 max-w-[100px] md:max-w-none ${
                darkMode 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          )}
        </div>

        {/* Right side - Export buttons + Minimize/Maximize button */}
        <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0 notepad-header-buttons pr-1">
          {/* Buttons for MINIMIZED state */}
          {isMinimized && (
            <>
              {/* Upload/Save Button */}
              <button
                onClick={notepadState.currentEditingSongId ? onSaveChanges : onUploadToSongs}
                disabled={!content.trim()}
                className={`p-1 rounded text-xs transition-colors ${
                  content.trim()
                    ? notepadState.currentEditingSongId
                      ? darkMode
                        ? 'bg-blue-800 hover:bg-blue-700 text-blue-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      : darkMode
                        ? 'bg-green-800 hover:bg-green-700 text-green-200'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    : darkMode
                      ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={notepadState.currentEditingSongId ? "Save Changes" : "Add to Songs"}
              >
                {notepadState.currentEditingSongId ? (
                  <Save className="w-4 h-4" style={darkMode ? {} : { color: '#000000' }} />
                ) : (
                  <Upload className="w-4 h-4" style={darkMode ? {} : { color: '#000000' }} />
                )}
              </button>

              {/* New Tab Button */}
              <button
                onClick={onStartNewContent}
                className={`p-1 rounded text-xs transition-colors ${
                  darkMode
                    ? 'bg-purple-800 hover:bg-purple-700 text-purple-200'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                title="New Empty Tab"
              >
                <Plus className="w-4 h-4" style={darkMode ? {} : { color: '#000000' }} />
              </button>
            </>
          )}

          {/* Buttons for EXPANDED state - same as minimized */}
          {!isMinimized && (
            <>
              {/* Upload/Save Button */}
              <button
                onClick={notepadState.currentEditingSongId ? onSaveChanges : onUploadToSongs}
                disabled={!content.trim()}
                className={`p-1 rounded text-xs transition-colors ${
                  content.trim()
                    ? notepadState.currentEditingSongId
                      ? darkMode
                        ? 'bg-blue-800 hover:bg-blue-700 text-blue-200'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                      : darkMode
                        ? 'bg-green-800 hover:bg-green-700 text-green-200'
                        : 'bg-green-600 hover:bg-green-700 text-white'
                    : darkMode
                      ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                }`}
                title={notepadState.currentEditingSongId ? "Save Changes" : "Add to Songs"}
              >
                {notepadState.currentEditingSongId ? (
                  <Save className="w-4 h-4" style={darkMode ? {} : { color: '#000000' }} />
                ) : (
                  <Upload className="w-4 h-4" style={darkMode ? {} : { color: '#000000' }} />
                )}
              </button>

              {/* New Tab Button */}
              <button
                onClick={onStartNewContent}
                className={`p-1 rounded text-xs transition-colors ${
                  darkMode
                    ? 'bg-purple-800 hover:bg-purple-700 text-purple-200'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
                title="New Empty Tab"
              >
                <Plus className="w-4 h-4" style={darkMode ? {} : { color: '#000000' }} />
              </button>
            </>
          )}

          <button
            onClick={toggleMinimized}
            className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 ${
              darkMode ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tab Bar - Show when not minimized and tabs exist */}
      {!isMinimized && openTabs.length > 0 && (
        <NotepadTabBar
          tabs={openTabs}
          activeTabIndex={activeTabIndex}
          onSwitchTab={onSwitchTab}
          onCloseTab={onCloseTab}
          getTabDisplayName={getTabDisplayName}
          darkMode={darkMode}
        />
      )}

      {/* Audio Player Spacer - reserves space when audio exists (actual player is in portal) */}
      {!isMinimized && currentSongAudio && (
        <div
          className={`flex-shrink-0 border-b w-full ${
            darkMode ? 'border-gray-600' : 'border-gray-200'
          }`}
          style={{ minHeight: '52px' }}
          ref={audioContainerRef}
        />
      )}

      {/* Content - Full-size textarea when not minimized */}
      {!isMinimized && (
        <div 
          className="flex-1 w-full relative overflow-visible"
          style={{ 
            height: isMobile && isFullscreen ? (currentSongAudio ? 'calc(100vh - 49px - 60px)' : 'calc(100vh - 49px)') : (currentSongAudio ? 'calc(100% - 49px - 60px)' : 'calc(100% - 49px)'),
            minHeight: isMobile && isFullscreen ? '200px' : '150px',
            width: '100%'
          }}
        >
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing your lyrics..."
            className={`w-full h-full resize-none border-none outline-none text-sm p-3 block ${
              darkMode 
                ? 'bg-gray-800 text-gray-300 placeholder-gray-500' 
                : 'bg-white text-gray-900 placeholder-gray-400'
            }`}
            style={{ 
              width: '100%', 
              height: '100%',
              minHeight: '150px',
              resize: 'none',
              border: 'none',
              outline: 'none',
              boxSizing: 'border-box',
              display: 'block',
              textAlign: 'left'
            }}
          />
          
          {/* Fullscreen toggle button - bottom right corner, mobile only via CSS */}
          <button
            onClick={toggleFullscreen}
            className={`absolute w-10 h-10 rounded-full shadow-lg transition-all duration-200 flex items-center justify-center mobile-fullscreen-btn ${
              darkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-300'
            } hover:scale-110 z-20`}
            style={{
              bottom: '12px',
              right: '12px',
              left: 'auto'
            }}
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? <Shrink className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
          </button>
          
          {/* Character count - positioned in bottom left corner on mobile, bottom right on desktop */}
          <div className={`absolute bottom-2 text-xs pointer-events-none mobile-char-count ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}>
            {content.trim() ? content.trim().split(/\s+/).length : 0} words • {content.length} chars
          </div>
        </div>
      )}

      {/* Resize handles - Only show when expanded and on desktop */}
      {!isMinimized && !isMobile && (
        <>
          {/* Corner handles - Invisible but functional */}
          <div 
            className="absolute w-6 h-6 cursor-nw-resize resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize('nw', e.clientX, e.clientY);
            }}
            style={{ 
              top: '-3px', 
              left: '-3px', 
              zIndex: 1000,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '2px',
              cursor: 'nw-resize' // Explicitly set cursor in style
            }}
            title="Resize from top-left corner"
          />
          <div 
            className="absolute w-6 h-6 cursor-ne-resize resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize('ne', e.clientX, e.clientY);
            }}
            style={{ 
              top: '-3px', 
              right: '-3px', 
              zIndex: 1000,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '2px',
              cursor: 'ne-resize' // Explicitly set cursor in style
            }}
            title="Resize from top-right corner"
          />
          <div 
            className="absolute w-6 h-6 cursor-sw-resize resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize('sw', e.clientX, e.clientY);
            }}
            style={{ 
              bottom: '-3px', 
              left: '-3px', 
              zIndex: 1000,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '2px',
              cursor: 'sw-resize' // Explicitly set cursor in style
            }}
            title="Resize from bottom-left corner"
          />
          <div 
            className="absolute w-6 h-6 cursor-se-resize resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize('se', e.clientX, e.clientY);
            }}
            style={{ 
              bottom: '-3px', 
              right: '-3px', 
              zIndex: 1000,
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '2px',
              cursor: 'se-resize' // Explicitly set cursor in style
            }}
            title="Resize from bottom-right corner"
          />
          
          {/* Edge handles - Also made invisible */}
          <div 
            className="absolute h-3 cursor-n-resize resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize('n', e.clientX, e.clientY);
            }}
            style={{ 
              top: '-2px', 
              left: '6px', 
              right: '6px', 
              zIndex: 1000,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'n-resize' // Explicitly set cursor in style
            }}
            title="Resize from top edge"
          />
          <div 
            className="absolute h-3 cursor-s-resize resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize('s', e.clientX, e.clientY);
            }}
            style={{ 
              bottom: '-2px', 
              left: '6px', 
              right: '6px', 
              zIndex: 1000,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 's-resize' // Explicitly set cursor in style
            }}
            title="Resize from bottom edge"
          />
          <div 
            className="absolute w-3 cursor-w-resize resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize('w', e.clientX, e.clientY);
            }}
            style={{ 
              top: '6px', 
              bottom: '6px', 
              left: '-2px', 
              zIndex: 1000,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'w-resize' // Explicitly set cursor in style
            }}
            title="Resize from left edge"
          />
          <div 
            className="absolute w-3 cursor-e-resize resize-handle"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startResize('e', e.clientX, e.clientY);
            }}
            style={{ 
              top: '6px', 
              bottom: '6px', 
              right: '-2px', 
              zIndex: 1000,
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'e-resize' // Explicitly set cursor in style
            }}
            title="Resize from right edge"
          />
        </>
      )}
    </div>
    )}

    {isFullscreen && (
      <div 
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 999999,
          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Header - Matches minimized/expanded notepad header exactly */}
        <div
          className={`flex items-center justify-between p-2 border-b ${
            darkMode ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-gray-50'
          }`}
          style={{
            paddingTop: 'max(32px, calc(8px + env(safe-area-inset-top, 24px)))',
            paddingRight: 'max(8px, env(safe-area-inset-right, 8px))'
          }}
        >
          {/* Left side - Icon + Title */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Edit3 className={`w-4 h-4 flex-shrink-0 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              value={title + (hasUnsavedChanges ? '*' : '')}
              onChange={(e) => updateTitle(e.target.value.replace('*', ''))}
              placeholder="Title..."
              className={`flex-1 px-1 md:px-2 py-0.5 md:py-1 text-xs md:text-sm border rounded min-w-0 max-w-[100px] md:max-w-none ${
                darkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              }`}
            />
          </div>

          {/* Right side - Buttons matching minimized/expanded notepad */}
          <div className="flex items-center gap-0.5 md:gap-1 flex-shrink-0 notepad-header-buttons pr-1">
            {/* Upload/Save Button */}
            <button
              onClick={notepadState.currentEditingSongId ? onSaveChanges : onUploadToSongs}
              disabled={!content.trim()}
              className={`p-1 rounded text-xs transition-colors ${
                content.trim()
                  ? notepadState.currentEditingSongId
                    ? darkMode
                      ? 'bg-blue-800 hover:bg-blue-700 text-blue-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                    : darkMode
                      ? 'bg-green-800 hover:bg-green-700 text-green-200'
                      : 'bg-green-600 hover:bg-green-700 text-white'
                  : darkMode
                    ? 'bg-gray-600 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
              title={notepadState.currentEditingSongId ? "Save Changes" : "Add to Songs"}
            >
              {notepadState.currentEditingSongId ? (
                <Save className="w-4 h-4" style={darkMode ? {} : { color: '#000000' }} />
              ) : (
                <Upload className="w-4 h-4" style={darkMode ? {} : { color: '#000000' }} />
              )}
            </button>

            {/* New Tab Button */}
            <button
              onClick={onStartNewContent}
              className={`p-1 rounded text-xs transition-colors ${
                darkMode
                  ? 'bg-purple-800 hover:bg-purple-700 text-purple-200'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
              title="New Empty Tab"
            >
              <Plus className="w-4 h-4" style={darkMode ? {} : { color: '#000000' }} />
            </button>

            {/* Exit fullscreen button */}
            <button
              onClick={toggleFullscreen}
              className={`p-1 rounded hover:bg-opacity-20 hover:bg-gray-500 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}
              title="Exit Fullscreen"
            >
              <Shrink className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Bar - Show when tabs exist */}
        {openTabs.length > 0 && (
          <NotepadTabBar
            tabs={openTabs}
            activeTabIndex={activeTabIndex}
            onSwitchTab={onSwitchTab}
            onCloseTab={onCloseTab}
            getTabDisplayName={getTabDisplayName}
            darkMode={darkMode}
          />
        )}

        {/* Audio Player Spacer - reserves space (actual player is in portal) */}
        {currentSongAudio && (
          <div
            className={`flex-shrink-0 border-b w-full ${
              darkMode ? 'border-gray-600' : 'border-gray-200'
            }`}
            style={{ minHeight: '52px' }}
          />
        )}

        {/* Fullscreen Textarea */}
        <div style={{
          flex: 1,
          position: 'relative',
          backgroundColor: darkMode ? '#1f2937' : '#ffffff',
          minHeight: '300px'
        }}>
          <textarea
            value={content}
            onChange={handleContentChange}
            placeholder="Start writing your lyrics..."
            style={{
              width: '100%',
              height: '100%',
              minHeight: '300px',
              border: 'none',
              outline: 'none',
              padding: '16px',
              fontSize: '18px',
              backgroundColor: darkMode ? '#374151' : '#f9fafb',
              color: darkMode ? '#d1d5db' : '#111827',
              resize: 'none'
            }}
          />
          
          {/* Character count - positioned in bottom right */}
          <div style={{
            position: 'absolute',
            bottom: '8px',
            right: '8px',
            fontSize: '12px',
            color: darkMode ? '#9ca3af' : '#6b7280',
            pointerEvents: 'none'
          }}>
            {content.trim() ? content.trim().split(/\s+/).length : 0} words • {content.length} chars
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default FloatingNotepad;