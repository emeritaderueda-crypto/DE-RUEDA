import React, { useEffect, useRef, useState, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  FlipHorizontal,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  ShieldAlert,
  HelpCircle,
  Upload,
  Sparkles,
  QrCode,
  Zap,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  isTurnstileSoundEnabled,
  setTurnstileSoundEnabled,
  playSuccessChime,
  playFailureChime,
} from '../../utils/audioChime';

interface TurnstileQrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetSiteId?: string;
  customTitle?: string;
  customDescription?: string;
  onScanEmployee?: (employee: import('../../types').Employee) => void;
}

export const TurnstileQrScannerModal: React.FC<TurnstileQrScannerModalProps> = ({
  isOpen,
  onClose,
  targetSiteId,
  customTitle,
  customDescription,
  onScanEmployee,
}) => {
  const { employees, currentSite, scanAttendanceQr } = useApp();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const isScanningRef = useRef<boolean>(false);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedPayloadRef = useRef<string>('');

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isRequestingCamera, setIsRequestingCamera] = useState<boolean>(false);
  const [permissionState, setPermissionState] = useState<'idle' | 'prompt' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [scanResult, setScanResult] = useState<{ success: boolean; message: string; employeeName?: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeSite, setActiveSite] = useState<string>(targetSiteId || currentSite || 'SITE-001');
  const [manualBadgeInput, setManualBadgeInput] = useState<string>('');
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [terminalDeviceId, setTerminalDeviceId] = useState<string>('TURNSTILE-GATE-01A');
  const [terminalLocationTag, setTerminalLocationTag] = useState<string>('Main Turnstile Gate 1 - North Checkpoint');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => isTurnstileSoundEnabled());

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setTurnstileSoundEnabled(next);
  };

  // Stop camera media tracks cleanly
  const stopCamera = useCallback(() => {
    isScanningRef.current = false;
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  // Process decoded QR text payload from camera or image file
  const handleDecodedPayload = useCallback(
    (rawText: string) => {
      const now = Date.now();
      // Debounce repetitive scans of same payload within 3 seconds
      if (rawText === lastScannedPayloadRef.current && now - lastScannedTimeRef.current < 3000) {
        return;
      }

      setIsProcessing(true);
      lastScannedTimeRef.current = now;
      lastScannedPayloadRef.current = rawText;

      let employeeId = '';
      let qrVersion = 1;

      // Support JSON payload: {"employee_id":"DRC-EMP-2026-000001","qr_version":3}
      try {
        const parsed = JSON.parse(rawText);
        if (parsed.employee_id) {
          employeeId = String(parsed.employee_id).trim();
          qrVersion = Number(parsed.qr_version) || 1;
        }
      } catch {
        // Support Plain formatted payloads e.g. "DRC-EMP-2026-000001" or "DRC-EMP-2026-000001-v3" or "DRC-EMP-2026-000001:3"
        const clean = rawText.trim();
        const vMatch = clean.match(/^(DRC-EMP-[0-9\-]+)[-:]v?([0-9]+)$/i);
        if (vMatch) {
          employeeId = vMatch[1];
          qrVersion = parseInt(vMatch[2], 10) || 1;
        } else {
          employeeId = clean;
          // Lookup active employee version from masterlist if unversioned text
          const found = employees.find((e) => e.employee_id === clean);
          qrVersion = found ? found.qr_version : 1;
        }
      }

      const emp = employees.find((e) => e.employee_id === employeeId);
      const effectiveSite = activeSite === 'ALL' ? (emp?.site_id || 'SITE-001') : activeSite;

      // If custom scanner handler provided (e.g. Canteen Stipend Collection)
      if (emp && onScanEmployee) {
        onScanEmployee(emp);
        setScanResult({
          success: true,
          message: `Worker identified: ${emp.name} (${emp.employee_id}). Ready for weekly stipend recording.`,
          employeeName: emp.name,
        });
        setIsProcessing(false);
        return;
      }

      // Dispatch to AppContext attendance timekeeper with device & location accountability
      const res = scanAttendanceQr(
        employeeId,
        qrVersion,
        effectiveSite,
        undefined,
        terminalDeviceId,
        terminalLocationTag
      );
      setScanResult({
        success: res.success,
        message: res.message,
        employeeName: emp?.name,
      });

      // Chime audio indicator (respects operator toggle and plays distinct success vs failure chimes)
      if (res.success) {
        playSuccessChime();
      } else {
        playFailureChime();
      }

      setTimeout(() => {
        setIsProcessing(false);
      }, 1000);
    },
    [activeSite, employees, scanAttendanceQr, terminalDeviceId, terminalLocationTag]
  );

  // Scan frame loop using jsQR
  const scanVideoFrame = useCallback(() => {
    if (!isScanningRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (video && canvas && video.readyState >= video.HAVE_CURRENT_DATA) {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

          // Run jsQR decoder on image frame
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            handleDecodedPayload(code.data);
          }
        }
      }
    }

    if (isScanningRef.current) {
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
    }
  }, [handleDecodedPayload]);

  // Request camera access and start stream with multi-fallback constraints
  const startCamera = useCallback(async () => {
    setIsRequestingCamera(true);
    setCameraError(null);
    stopCamera();

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('unsupported');
      setCameraError('Camera access is not supported by this browser or protocol (HTTPS/localhost required). You can still scan badge files or use direct simulation below.');
      setIsRequestingCamera(false);
      return;
    }

    setPermissionState('prompt');

    try {
      // Build constraints with progressive fallbacks for iOS, Android, and Desktop webcams
      const constraintsList: MediaStreamConstraints[] = [
        // 1. Device specific or facingMode environment
        selectedDeviceId
          ? { video: { deviceId: { exact: selectedDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false }
          : { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
        // 2. Facing mode fallback without resolution constraint
        { video: { facingMode: facingMode }, audio: false },
        // 3. Any video input
        { video: true, audio: false },
      ];

      let stream: MediaStream | null = null;
      let lastErr: unknown = null;

      for (const constraints of constraintsList) {
        try {
          stream = await navigator.mediaDevices.getUserMedia(constraints);
          if (stream) break;
        } catch (err: unknown) {
          lastErr = err;
          const e = err as { name?: string };
          // If browser or user denied permission, do not loop-retry
          if (e?.name === 'NotAllowedError' || e?.name === 'PermissionDeniedError' || e?.name === 'SecurityError') {
            break;
          }
        }
      }

      if (!stream) {
        throw lastErr || new Error('Could not initialize video stream');
      }

      streamRef.current = stream;
      setPermissionState('granted');
      setCameraActive(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true'); // Required for iOS Safari
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video play deferred:', playErr);
        }
      }

      // Enumerate devices for switching cameras (back vs front)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        setAvailableDevices(videoInputs);
      } catch {
        // ignore
      }

      // Start continuous scanning
      isScanningRef.current = true;
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
    } catch (err: unknown) {
      console.warn('Camera access notice:', err);
      const errorObj = err as { name?: string; message?: string };
      setCameraActive(false);

      if (
        errorObj.name === 'NotAllowedError' ||
        errorObj.name === 'PermissionDeniedError' ||
        errorObj.name === 'SecurityError'
      ) {
        setPermissionState('denied');
        setCameraError(
          'Camera permission was not granted by your browser. You can click "Request Camera Access Again", upload a badge photo, or click any employee badge below to test attendance.'
        );
      } else if (errorObj.name === 'NotFoundError' || errorObj.name === 'DevicesNotFoundError') {
        setPermissionState('unsupported');
        setCameraError('No video camera was detected on this device. You can upload a badge photo or use the badge simulator below.');
      } else if (errorObj.name === 'NotReadableError' || errorObj.name === 'TrackStartError') {
        setCameraError('Camera is currently in use by another application or tab. Please close other camera apps and retry.');
      } else {
        setCameraError(errorObj.message || 'Unable to access camera on this device.');
      }
    } finally {
      setIsRequestingCamera(false);
    }
  }, [facingMode, scanVideoFrame, selectedDeviceId, stopCamera]);

  // Handle image file upload for QR scanning
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth',
          });
          if (code && code.data) {
            handleDecodedPayload(code.data);
          } else {
            setScanResult({
              success: false,
              message: 'No readable QR code found in uploaded image. Please ensure the badge QR code is centered and clear.',
            });
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Switch between front and back camera
  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
    setSelectedDeviceId('');
  };

  // Toggle camera flashlight / torch if hardware supported
  const handleToggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      // @ts-expect-error non-standard torch constraint for modern browsers
      await track.applyConstraints({ advanced: [{ torch: nextTorch }] });
      setTorchOn(nextTorch);
    } catch {
      // torch not supported on this device/browser
    }
  };

  // Process manual keyboard or barcode reader input
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBadgeInput.trim()) return;
    handleDecodedPayload(manualBadgeInput.trim());
    setManualBadgeInput('');
  };

  // Auto-request camera when modal opens
  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setScanResult(null);
      setCameraError(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, startCamera, stopCamera]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-xl bg-[#0e1a16] border border-[#234338] rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 bg-[#13241f] border-b border-[#234338] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-[#a3e635]/10 border border-[#a3e635]/30 flex items-center justify-center text-[#a3e635]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
                {customTitle || 'Turnstile QR Code Attendance Scanner'}
              </h2>
              <p className="text-[11px] text-slate-400">
                {customDescription || 'Live camera scanner with instant Time In & Time Out logging'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSound}
              title={soundEnabled ? 'Chime sound enabled (Click to mute)' : 'Chime sound muted (Click to enable)'}
              className={`p-1.5 rounded-lg border text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer ${
                soundEnabled
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                  : 'bg-[#13241f] border-[#234338] text-slate-400 hover:text-white'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline text-[10px] font-mono">{soundEnabled ? 'Chime ON' : 'Muted'}</span>
            </button>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Site Selector for the scanner turnstile */}
          <div className="bg-[#13241f] border border-[#234338] rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-slate-400 font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              Active Turnstile Location:
            </span>
            <select
              value={activeSite}
              onChange={(e) => setActiveSite(e.target.value)}
              className="bg-[#0e1a16] border border-[#234338] text-[#a3e635] font-bold font-mono px-3 py-1.5 rounded-lg text-xs outline-none focus:border-[#a3e635]"
            >
              <option value="SITE-001">SITE-001 &bull; Bonifacio Ridge Tower</option>
              <option value="SITE-002">SITE-002 &bull; Alabang Warehouse</option>
              <option value="SITE-003">SITE-003 &bull; Nuvali Commercial Hub</option>
              <option value="ALL">Auto-Match Employee Current Site</option>
            </select>
          </div>

          {/* Camera Viewfinder Viewport */}
          <div className="relative bg-black rounded-xl border-2 border-[#234338] overflow-hidden aspect-4/3 flex items-center justify-center group">
            {/* Real Video Element */}
            <video
              ref={videoRef}
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                cameraActive ? 'opacity-100' : 'opacity-0'
              }`}
              playsInline
              muted
            />

            {/* Hidden Offscreen Canvas for jsQR Frame Processing */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Target Laser / Alignment Overlay */}
            {cameraActive && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                {/* Viewfinder Target Box */}
                <div className="relative w-48 h-48 sm:w-56 sm:h-56 border-2 border-[#a3e635]/80 rounded-2xl shadow-[0_0_20px_rgba(163,230,53,0.3)]">
                  {/* Corner Accent Brackets */}
                  <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-[#a3e635] rounded-tl-sm"></div>
                  <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-[#a3e635] rounded-tr-sm"></div>
                  <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-[#a3e635] rounded-bl-sm"></div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-[#a3e635] rounded-br-sm"></div>

                  {/* Animated Scanner Laser */}
                  <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-[#a3e635] to-transparent shadow-[0_0_8px_#a3e635] animate-bounce mt-4"></div>

                  <div className="absolute bottom-2 left-0 right-0 text-center text-[10px] font-mono text-[#a3e635] font-bold bg-black/60 py-0.5 px-2 rounded-full mx-auto w-fit">
                    Point at Worker Badge QR
                  </div>
                </div>
              </div>
            )}

            {/* Camera Inactive / Prompt Overlay */}
            {!cameraActive && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-[#0a1411]">
                <div className="w-14 h-14 rounded-full bg-[#13241f] border border-[#234338] flex items-center justify-center text-slate-400 mb-3">
                  <CameraOff className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-white text-sm mb-1">Camera Stream Standby</h4>
                <p className="text-xs text-slate-400 max-w-xs mb-4">
                  {permissionState === 'denied'
                    ? 'Camera permission is restricted or was denied in browser settings. You can grant access, upload a badge photo, or click any employee badge below.'
                    : 'Click below to request device camera access, upload a badge photo, or test scanning.'}
                </p>

                <div className="flex flex-wrap items-center justify-center gap-2">
                  <button
                    onClick={startCamera}
                    disabled={isRequestingCamera}
                    className="px-4 py-2 bg-[#a3e635] text-[#080f0d] font-bold text-xs rounded-lg hover:bg-[#84cc16] flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95 disabled:opacity-75"
                  >
                    {isRequestingCamera ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-black" />
                        <span>Requesting Camera Permission...</span>
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4" />
                        <span>{permissionState === 'denied' ? 'Request Camera Access Again' : 'Allow & Open Camera'}</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-[#13241f] border border-[#234338] text-slate-200 hover:text-white font-semibold text-xs rounded-lg hover:bg-[#1a332c] flex items-center gap-1.5"
                  >
                    <Upload className="w-4 h-4 text-emerald-400" />
                    Upload Badge Image
                  </button>

                  {employees.length > 0 && (
                    <button
                      onClick={() => {
                        const firstEmp = employees[0];
                        handleDecodedPayload(
                          JSON.stringify({ employee_id: firstEmp.employee_id, qr_version: firstEmp.qr_version })
                        );
                      }}
                      className="px-4 py-2 bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 hover:text-white font-bold text-xs rounded-lg hover:bg-emerald-500/25 flex items-center gap-1.5"
                    >
                      <Sparkles className="w-4 h-4 text-[#a3e635]" />
                      Scan Sample Badge
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Camera Floating Controls (When Active) */}
            {cameraActive && (
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleFacingMode}
                    className="p-2 bg-black/70 hover:bg-black text-white rounded-lg border border-white/20 text-xs flex items-center gap-1 backdrop-blur-xs transition-colors"
                    title="Switch Camera (Front / Back)"
                  >
                    <FlipHorizontal className="w-3.5 h-3.5 text-[#a3e635]" />
                    <span className="hidden sm:inline text-[10px] font-semibold">
                      {facingMode === 'environment' ? 'Rear Cam' : 'Front Cam'}
                    </span>
                  </button>

                  {availableDevices.length > 1 && (
                    <select
                      value={selectedDeviceId}
                      onChange={(e) => {
                        setSelectedDeviceId(e.target.value);
                        startCamera();
                      }}
                      className="bg-black/70 text-slate-200 border border-white/20 text-[10px] rounded-lg px-2 py-1.5 max-w-[120px] truncate outline-none backdrop-blur-xs"
                    >
                      {availableDevices.map((d, i) => (
                        <option key={d.deviceId || i} value={d.deviceId}>
                          {d.label || `Camera ${i + 1}`}
                        </option>
                      ))}
                    </select>
                  )}
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleToggleTorch}
                    className={`p-2 rounded-lg border text-xs flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer ${
                      torchOn
                        ? 'bg-amber-400 text-black border-amber-300 shadow-md shadow-amber-500/20'
                        : 'bg-black/70 hover:bg-black text-white border-white/20'
                    }`}
                    title="Toggle Flashlight / Torch"
                  >
                    <Zap className={`w-3.5 h-3.5 ${torchOn ? 'text-black fill-current' : 'text-amber-400'}`} />
                    <span className="hidden sm:inline text-[10px] font-semibold">
                      {torchOn ? 'Torch On' : 'Torch'}
                    </span>
                  </button>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 bg-black/70 hover:bg-black text-white rounded-lg border border-white/20 text-xs flex items-center gap-1 backdrop-blur-xs transition-colors cursor-pointer"
                    title="Scan photo of QR badge"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="hidden sm:inline text-[10px]">Upload</span>
                  </button>
                  <button
                    onClick={stopCamera}
                    className="p-2 bg-red-950/80 hover:bg-red-900 text-red-200 rounded-lg border border-red-700/50 text-xs flex items-center gap-1 backdrop-blur-xs transition-colors"
                    title="Pause Camera"
                  >
                    <CameraOff className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Hidden File Input for Image Upload QR Scanning */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Camera Permission / Error Alert */}
          {cameraError && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-bold text-amber-300">Camera Device Notice</div>
                <div className="text-[11px] text-amber-200/90 mt-0.5">{cameraError}</div>
                {permissionState === 'denied' && (
                  <div className="text-[10px] text-amber-400/80 mt-1">
                    Tip: Look for the camera icon in your browser URL address bar to reset camera permissions to "Allow".
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live Scan Results Display */}
          {scanResult && (
            <div
              className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-3 transition-all ${
                scanResult.success
                  ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-200 shadow-md shadow-emerald-950/50'
                  : 'bg-red-500/15 border border-red-500/40 text-red-200 shadow-md shadow-red-950/50'
              }`}
            >
              {scanResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-extrabold text-sm text-white flex items-center justify-between">
                  <span>{scanResult.success ? 'Attendance Verified' : 'Scan Rejected'}</span>
                  {scanResult.employeeName && (
                    <span className="text-[#a3e635] text-xs font-mono">{scanResult.employeeName}</span>
                  )}
                </div>
                <div className="text-xs mt-1 text-slate-200 font-medium leading-relaxed">
                  {scanResult.message}
                </div>
              </div>
            </div>
          )}

          {/* Manual Badge ID / Hardware Barcode Reader Input */}
          <div className="p-3 bg-[#13241f] border border-[#234338] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-[#a3e635]" />
                Manual Badge ID or Barcode Scanner Input:
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Format: DRC-EMP-2026-XXXXXX</span>
            </div>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualBadgeInput}
                onChange={(e) => setManualBadgeInput(e.target.value)}
                placeholder="Type or scan Badge ID (e.g. DRC-EMP-2026-000001)..."
                className="flex-1 px-3 py-1.5 bg-[#080f0d] border border-[#234338] focus:border-[#a3e635] rounded-lg text-white font-mono text-xs placeholder:text-slate-600 outline-none"
              />
              <button
                type="submit"
                disabled={!manualBadgeInput.trim() || isProcessing}
                className="px-3.5 py-1.5 bg-[#a3e635] text-[#080f0d] hover:bg-[#84cc16] font-bold text-xs rounded-lg transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Log Attendance
              </button>
            </form>
          </div>

          {/* Quick Field Simulation Buttons */}
          <div className="pt-2 border-t border-[#234338]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-[#a3e635]" />
                Simulate Direct Badge Touch (Physical Turnstile Tap):
              </span>
              <span className="text-[10px] text-slate-500">Tap to test engine</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
              {employees.slice(0, 6).map((e) => (
                <button
                  key={e.employee_id}
                  onClick={() => {
                    handleDecodedPayload(
                      JSON.stringify({ employee_id: e.employee_id, qr_version: e.qr_version })
                    );
                  }}
                  disabled={isProcessing}
                  className="p-2.5 bg-[#13241f] border border-[#234338] hover:border-[#a3e635] rounded-xl text-left text-xs text-slate-300 hover:text-white transition-all hover:bg-[#193029] flex flex-col justify-between"
                >
                  <div className="font-bold text-white flex items-center justify-between">
                    <span className="truncate">{e.name}</span>
                    <span className="text-[10px] font-mono text-[#a3e635] bg-[#0e1a16] px-1.5 py-0.5 rounded border border-[#234338]">
                      v{e.qr_version}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                    <span>{e.position}</span>
                    <span className="font-mono text-emerald-400">{e.site_id}</span>
                  </div>
                </button>
              ))}

              {/* Security Test: Outdated QR Version Rejection */}
              <button
                onClick={() => {
                  handleDecodedPayload(
                    JSON.stringify({ employee_id: employees[0]?.employee_id, qr_version: 999 })
                  );
                }}
                className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-xl text-left text-xs text-red-300 hover:bg-red-500/20 transition-colors sm:col-span-2"
              >
                <div className="font-bold text-red-200 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  Test Reassigned Worker / Obsolete QR Badge (Security Audit)
                </div>
                <div className="text-[10px] text-red-400/90 mt-0.5">
                  Verifies turnstile rejects outdated printed badges when worker was reassigned to another site
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3.5 bg-[#13241f] border-t border-[#234338] flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cameraActive ? 'bg-[#a3e635]' : 'bg-slate-600'}`}></span>
            {cameraActive ? 'Camera active & scanning' : 'Camera standby'}
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="px-4 py-2 bg-[#0e1a16] border border-[#234338] text-slate-300 hover:text-white text-xs font-semibold rounded-lg hover:bg-white/5 transition-colors"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
