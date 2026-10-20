import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera,
  CameraOff,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Upload,
  X,
  ShieldCheck,
  RotateCw,
  Sparkles,
  Info,
  Lock,
} from 'lucide-react';

interface HrEmployeePhotoCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  onPhotoSaved: (photoDataUrl: string) => void;
  currentPhotoUrl?: string;
}

export const HrEmployeePhotoCaptureModal: React.FC<HrEmployeePhotoCaptureModalProps> = ({
  isOpen,
  onClose,
  employeeName,
  onPhotoSaved,
  currentPhotoUrl,
}) => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [isRequestingCamera, setIsRequestingCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied' | 'unknown'>('unknown');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [confirmedIdentity, setConfirmedIdentity] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera media stream tracks cleanly
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, [stream]);

  // Clean up stream on modal close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setCapturedPhoto(null);
      setCameraError(null);
      setUploadError(null);
      setConfirmedIdentity(false);
    }
  }, [isOpen, stopCamera]);

  // Check browser permissions API
  useEffect(() => {
    if (isOpen && typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((status) => {
          setPermissionState(status.state as any);
          status.onchange = () => {
            setPermissionState(status.state as any);
          };
        })
        .catch(() => {
          setPermissionState('unknown');
        });
    }
  }, [isOpen]);

  // Enumerate video devices
  const enumerateDevices = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.enumerateDevices) {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
        if (videoInputs.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(videoInputs[0].deviceId);
        }
      }
    } catch (e) {
      console.warn('Unable to enumerate camera devices', e);
    }
  }, [selectedDeviceId]);

  // Request camera access only after user explicitly clicks "Open Camera"
  const startCamera = async () => {
    setIsRequestingCamera(true);
    setCameraError(null);
    setCapturedPhoto(null);
    stopCamera();

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCameraError('Camera API is not supported in this browser environment. Please use the secure file upload option below.');
      setIsRequestingCamera(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: selectedDeviceId
          ? { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 960 } }
          : {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 960 },
            },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setCameraActive(true);
      setPermissionState('granted');

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.play().catch((err) => {
          console.warn('Video play error:', err);
        });
      }

      await enumerateDevices();
    } catch (err: any) {
      console.error('Camera access error:', err);
      const name = err.name || '';
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setCameraError(
          'Camera access was denied by your browser. Please allow camera permissions in your browser URL bar, or upload an ID badge photo from your device files.'
        );
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        setCameraError('No video camera was detected on this computer. Please upload an ID badge photo below.');
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        setCameraError('Camera is currently in use by another program (e.g. Zoom, Meet). Please close other camera applications and try again.');
      } else {
        setCameraError(err.message || 'Unable to access camera on this device.');
      }
    } finally {
      setIsRequestingCamera(false);
    }
  };

  // Toggle front vs rear camera
  const toggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    setSelectedDeviceId('');
    setTimeout(() => {
      startCamera();
    }, 100);
  };

  // Capture frame from active video element to high-res canvas
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !cameraActive) return;

    const canvas = canvasRef.current || document.createElement('canvas');
    const width = video.videoWidth || 640;
    const height = video.videoHeight || 480;

    // Crop to 3:4 portrait ID badge proportion centered
    const targetRatio = 3 / 4;
    let cropWidth = width;
    let cropHeight = width / targetRatio;

    if (cropHeight > height) {
      cropHeight = height;
      cropWidth = height * targetRatio;
    }

    const startX = (width - cropWidth) / 2;
    const startY = (height - cropHeight) / 2;

    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw video frame to canvas
    ctx.drawImage(video, startX, startY, cropWidth, cropHeight, 0, 0, 600, 800);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
    setCapturedPhoto(dataUrl);
    stopCamera();
    setConfirmedIdentity(true);
  };

  // Retake photo
  const handleRetake = () => {
    setCapturedPhoto(null);
    setConfirmedIdentity(false);
    startCamera();
  };

  // Handle file upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedMimes.includes(file.type)) {
      setUploadError(`Invalid file format '${file.type}'. Allowed: JPG, PNG, WEBP.`);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size exceeds 5MB limit.');
      return;
    }

    setUploadError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result as string;
      setCapturedPhoto(b64);
      setConfirmedIdentity(true);
      stopCamera();
    };
    reader.readAsDataURL(file);
  };

  // Confirm and save photo to HR employee profile
  const handleSavePhoto = () => {
    if (!capturedPhoto) return;
    if (!confirmedIdentity) {
      setUploadError('Please affirm that the photograph belongs to the intended employee.');
      return;
    }

    onPhotoSaved(capturedPhoto);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs">
      <div className="w-full max-w-xl bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#234338] flex items-center justify-between bg-[#13241f]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#a3e635]/15 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm">HR Employee ID Photo Capture</h3>
              <p className="text-[11px] text-slate-400">
                Official Credential Photo for{' '}
                <strong className="text-[#a3e635]">{employeeName || 'New Employee'}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-[#1a362d]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Section 6 Purpose & DOLE Compliance Notice */}
          <div className="p-3 bg-linear-to-r from-[#10b981]/15 to-[#a3e635]/10 border border-[#10b981]/30 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-[#a3e635] shrink-0" />
              <span>DOLE OSH Rule 1020 & Construction Turnstile ID Compliance</span>
            </div>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Camera access is requested strictly when initiated by authorized HR staff to capture high-resolution identification photos for physical worker badges and turnstile biometric verification.
            </p>
          </div>

          {/* Privacy & Lawful-Basis Notice */}
          <div className="p-2.5 bg-[#0a1411] border border-[#234338] rounded-lg text-[10px] text-slate-400 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <span>
              <strong>Privacy Protection:</strong> Photos are stored securely in the private ERP repository. No facial recognition scoring or biometric tracking algorithms are applied without separate authorization.
            </span>
          </div>

          {/* Camera Viewport / Captured Preview */}
          <div className="relative bg-black rounded-xl overflow-hidden border border-[#234338] aspect-4/3 flex items-center justify-center">
            {/* Live Video Element */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-200 ${
                cameraActive && !capturedPhoto ? 'opacity-100' : 'hidden'
              } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Oval Face Guide Overlay (When Camera is Active) */}
            {cameraActive && !capturedPhoto && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                <div className="w-48 h-64 border-2 border-dashed border-[#a3e635] rounded-full opacity-80 shadow-[0_0_20px_rgba(163,230,53,0.3)]"></div>
                <div className="text-[11px] font-bold text-white bg-black/60 px-3 py-1 rounded-full mt-2 backdrop-blur-xs">
                  Center employee's face within the guide
                </div>
              </div>
            )}

            {/* Captured Photo Preview */}
            {capturedPhoto && (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-[#080f0d]">
                <img
                  src={capturedPhoto}
                  alt="Captured Worker Badge"
                  className="max-h-full max-w-full object-contain rounded-lg border border-[#234338] shadow-lg"
                />
                <div className="absolute bottom-3 left-3 bg-emerald-500/90 text-black font-extrabold text-[10px] px-2.5 py-1 rounded-md flex items-center gap-1 shadow-md">
                  <CheckCircle2 className="w-3 h-3 text-black" />
                  ID Photo Captured Ready
                </div>
              </div>
            )}

            {/* Camera Inactive Standby Screen */}
            {!cameraActive && !capturedPhoto && (
              <div className="p-6 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-[#13241f] border border-[#234338] flex items-center justify-center text-slate-400 mx-auto">
                  <CameraOff className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Camera Stream Standby</h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    {permissionState === 'denied'
                      ? 'Camera permission was denied in your browser settings. You can grant access in your address bar or upload a digital photo below.'
                      : 'Click "Open Camera" below to initiate video capture, or upload an existing photo.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  disabled={isRequestingCamera}
                  className="px-4 py-2.5 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-xl hover:bg-[#bef264] flex items-center gap-2 mx-auto cursor-pointer shadow-md transition-all active:scale-95 disabled:opacity-75"
                >
                  {isRequestingCamera ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-black" />
                      <span>Requesting Camera Access...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Open Camera Stream</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Floating Device Controls (While Camera Stream is Live) */}
            {cameraActive && !capturedPhoto && (
              <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
                <button
                  type="button"
                  onClick={toggleFacingMode}
                  className="p-2 bg-black/70 hover:bg-black text-white rounded-lg border border-white/20 text-xs flex items-center gap-1 backdrop-blur-xs cursor-pointer transition-colors"
                  title="Switch Camera (Front / Back)"
                >
                  <RotateCw className="w-3.5 h-3.5 text-[#a3e635]" />
                  <span className="hidden sm:inline text-[10px] font-semibold">Flip</span>
                </button>
              </div>
            )}
          </div>

          {/* Error Notice */}
          {(cameraError || uploadError) && (
            <div className="p-3 bg-red-500/15 border border-red-500/40 rounded-xl text-xs text-red-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-red-300">Camera or Upload Issue</div>
                <div className="text-[11px] mt-0.5 leading-relaxed">{cameraError || uploadError}</div>
              </div>
            </div>
          )}

          {/* Action Buttons Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#234338]">
            {/* Left: Alternate File Upload Option */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleFileUpload}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#193028] transition-colors"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" />
                <span>Upload Photo File</span>
              </button>
            </div>

            {/* Right: Camera Action (Capture / Retake / Confirm) */}
            <div className="flex items-center gap-2">
              {cameraActive && !capturedPhoto && (
                <button
                  type="button"
                  onClick={handleCapture}
                  className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#bef264] cursor-pointer shadow-md transition-all active:scale-95"
                >
                  <Camera className="w-4 h-4" />
                  <span>Capture Photo</span>
                </button>
              )}

              {capturedPhoto && (
                <>
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="px-3 py-2 bg-[#13241f] border border-[#234338] text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer hover:bg-[#193028]"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
                    <span>Retake</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePhoto}
                    disabled={!confirmedIdentity}
                    className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold rounded-xl text-xs flex items-center gap-1.5 hover:bg-[#bef264] cursor-pointer shadow-md disabled:opacity-50 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save to Employee Profile</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Section 6 Explicit Identity Confirmation Checkbox */}
          {capturedPhoto && (
            <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl flex items-start gap-2.5">
              <input
                type="checkbox"
                id="affirm-employee-photo"
                checked={confirmedIdentity}
                onChange={(e) => setConfirmedIdentity(e.target.checked)}
                className="mt-0.5 accent-[#a3e635] rounded cursor-pointer"
              />
              <label htmlFor="affirm-employee-photo" className="text-[11px] text-slate-300 cursor-pointer select-none">
                <strong>Reviewer Confirmation:</strong> I confirm this photograph belongs to{' '}
                <span className="text-[#a3e635] font-bold">{employeeName || 'the intended employee'}</span> and meets official De Rueda Construction ID badge and DOLE credential standards.
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
