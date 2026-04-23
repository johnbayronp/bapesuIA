import React, { useState, useRef, useEffect, useCallback } from 'react';
import QRCode from 'qrcode';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PRESETS = [
  { id: 'classic',  name: 'Clásico',   fg: '#000000', bg: '#ffffff' },
  { id: 'midnight', name: 'Midnight',  fg: '#0f172a', bg: '#f1f5f9' },
  { id: 'ocean',    name: 'Océano',    fg: '#0ea5e9', bg: '#f0f9ff' },
  { id: 'sunset',   name: 'Atardecer', fg: '#ea580c', bg: '#fff7ed' },
  { id: 'forest',   name: 'Bosque',    fg: '#15803d', bg: '#f0fdf4' },
  { id: 'violet',   name: 'Violeta',   fg: '#7c3aed', bg: '#faf5ff' },
  { id: 'rose',     name: 'Rosa',      fg: '#e11d48', bg: '#fff1f2' },
  { id: 'mono',     name: 'Invertido', fg: '#ffffff', bg: '#111827' },
];

const ERROR_LEVELS = [
  { id: 'L', label: 'Bajo (7%)' },
  { id: 'M', label: 'Medio (15%)' },
  { id: 'Q', label: 'Alto (25%)' },
  { id: 'H', label: 'Muy alto (30%)' },
];

export default function QrGenerator() {
  const { showSuccess, showError } = useToast();

  const [text, setText]                 = useState('');
  const [fgColor, setFgColor]           = useState('#000000');
  const [bgColor, setBgColor]           = useState('#ffffff');
  const [size, setSize]                 = useState(400);
  const [margin, setMargin]             = useState(2);
  const [errorLevel, setErrorLevel]     = useState('H');
  const [logoUrl, setLogoUrl]           = useState(null);
  const [logoSize, setLogoSize]         = useState(22);    // % of QR size
  const [logoPadding, setLogoPadding]   = useState(8);     // px white box around logo
  const [logoRounded, setLogoRounded]   = useState(true);
  const [qrImageUrl, setQrImageUrl]     = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const canvasRef  = useRef(null);
  const logoImgRef = useRef(null);

  const drawQr = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas || !text.trim()) return;

    try {
      await QRCode.toCanvas(canvas, text, {
        width: size,
        margin,
        errorCorrectionLevel: errorLevel,
        color: { dark: fgColor, light: bgColor },
      });

      if (logoUrl) {
        const ctx = canvas.getContext('2d');
        const logo = logoImgRef.current;
        if (logo && logo.complete && logo.naturalWidth) {
          const logoW = (logoSize / 100) * canvas.width;
          const ratio = logo.naturalHeight / logo.naturalWidth;
          const logoH = logoW * ratio;
          const cx = canvas.width / 2;
          const cy = canvas.height / 2;
          const x  = cx - logoW / 2;
          const y  = cy - logoH / 2;

          const padX = logoPadding;
          const boxW = logoW + padX * 2;
          const boxH = logoH + padX * 2;
          const boxX = x - padX;
          const boxY = y - padX;

          ctx.fillStyle = bgColor;
          if (logoRounded) {
            const r = Math.min(boxW, boxH) * 0.18;
            ctx.beginPath();
            ctx.moveTo(boxX + r, boxY);
            ctx.arcTo(boxX + boxW, boxY,           boxX + boxW, boxY + boxH, r);
            ctx.arcTo(boxX + boxW, boxY + boxH,    boxX,        boxY + boxH, r);
            ctx.arcTo(boxX,        boxY + boxH,    boxX,        boxY,        r);
            ctx.arcTo(boxX,        boxY,           boxX + boxW, boxY,        r);
            ctx.closePath();
            ctx.fill();
          } else {
            ctx.fillRect(boxX, boxY, boxW, boxH);
          }

          if (logoRounded) {
            ctx.save();
            const r2 = Math.min(logoW, logoH) * 0.15;
            ctx.beginPath();
            ctx.moveTo(x + r2, y);
            ctx.arcTo(x + logoW, y,          x + logoW, y + logoH, r2);
            ctx.arcTo(x + logoW, y + logoH,  x,         y + logoH, r2);
            ctx.arcTo(x,         y + logoH,  x,         y,         r2);
            ctx.arcTo(x,         y,          x + logoW, y,         r2);
            ctx.closePath();
            ctx.clip();
            ctx.drawImage(logo, x, y, logoW, logoH);
            ctx.restore();
          } else {
            ctx.drawImage(logo, x, y, logoW, logoH);
          }
        }
      }

      setQrImageUrl(canvas.toDataURL('image/png'));
    } catch {
      showError('No se pudo generar el código QR (texto demasiado largo para este nivel)');
      setQrImageUrl(null);
    }
  }, [text, size, margin, errorLevel, fgColor, bgColor, logoUrl, logoSize, logoPadding, logoRounded, showError]);

  // Live preview: redraw when any setting changes
  useEffect(() => {
    if (!text.trim()) {
      setQrImageUrl(null);
      return;
    }
    const t = setTimeout(() => { drawQr(); }, 120);
    return () => clearTimeout(t);
  }, [drawQr, text]);

  // Load logo into image ref
  useEffect(() => {
    if (!logoUrl) {
      logoImgRef.current = null;
      drawQr();
      return;
    }
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      logoImgRef.current = img;
      drawQr();
    };
    img.src = logoUrl;
  }, [logoUrl]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoUrl(URL.createObjectURL(file));
    setErrorLevel('H'); // ensure max correction with logo
  };

  const removeLogo = () => {
    setLogoUrl(null);
  };

  const applyPreset = (preset) => {
    setFgColor(preset.fg);
    setBgColor(preset.bg);
  };

  const handleDownload = async () => {
    if (!qrImageUrl) return;
    setIsProcessing(true);
    try {
      const link = document.createElement('a');
      link.href = qrImageUrl;
      link.download = `qr-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showSuccess('Código QR descargado');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopy = async () => {
    if (!qrImageUrl || !canvasRef.current) return;
    try {
      const blob = await new Promise((res) => canvasRef.current.toBlob(res, 'image/png'));
      await navigator.clipboard.write([new window.ClipboardItem({ 'image/png': blob })]);
      showSuccess('QR copiado al portapapeles');
    } catch {
      showError('Tu navegador no permite copiar imágenes');
    }
  };

  const hasContent = !!text.trim();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-500 dark:text-indigo-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 4h2m4-4h-2m2 4v2m-4-2v2m-2-6h6" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Generador de Códigos QR</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Personaliza colores, agrega tu logo y descarga al instante</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Controls ── */}
        <div className="space-y-5">

          {/* Content */}
          <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              1 · Contenido del QR
            </label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ej: https://tusitio.com, texto, WiFi, número de tel…"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition"
            />
            <p className="text-xs text-gray-400 dark:text-gray-600 mt-2">
              100% generado en tu navegador. No se envían datos.
            </p>
          </div>

          {/* Colors / Presets */}
          <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              2 · Estilo
            </label>

            {/* Presets */}
            <div className="flex flex-wrap gap-2 mb-4">
              {PRESETS.map((p) => {
                const active = fgColor.toLowerCase() === p.fg.toLowerCase() && bgColor.toLowerCase() === p.bg.toLowerCase();
                return (
                  <button
                    key={p.id}
                    onClick={() => applyPreset(p)}
                    title={p.name}
                    className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                      active
                        ? 'border-indigo-400 dark:border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-indigo-300 dark:hover:border-indigo-500/40'
                    }`}
                  >
                    <span className="flex">
                      <span className="w-4 h-4 rounded-l-full border border-gray-200 dark:border-white/10" style={{ background: p.bg }} />
                      <span className="w-4 h-4 rounded-r-full border border-l-0 border-gray-200 dark:border-white/10" style={{ background: p.fg }} />
                    </span>
                    {p.name}
                  </button>
                );
              })}
            </div>

            {/* Color pickers */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">Color del QR</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="flex-1 px-2.5 py-2 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 font-mono uppercase"
                  />
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">Color de fondo</span>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 dark:border-white/10 cursor-pointer bg-transparent"
                  />
                  <input
                    type="text"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="flex-1 px-2.5 py-2 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 font-mono uppercase"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Logo */}
          <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                3 · Logo central <span className="text-xs font-normal text-gray-400">(opcional)</span>
              </label>
              {logoUrl && (
                <button onClick={removeLogo} className="text-xs text-red-500 hover:text-red-600 font-medium">
                  Quitar
                </button>
              )}
            </div>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-white/15 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all duration-200">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-14 w-auto object-contain" />
              ) : (
                <>
                  <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 10h.01" />
                  </svg>
                  <span className="text-xs text-gray-400">Sube un logo (PNG con fondo transparente recomendado)</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>

            {logoUrl && (
              <div className="space-y-4 mt-4">
                <div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>Tamaño del logo</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{logoSize}%</span>
                  </div>
                  <input type="range" min={10} max={35} value={logoSize}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-white/10 cursor-pointer accent-indigo-500" />
                </div>
                <div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                    <span>Margen blanco</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{logoPadding}px</span>
                  </div>
                  <input type="range" min={0} max={30} value={logoPadding}
                    onChange={(e) => setLogoPadding(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-white/10 cursor-pointer accent-pink-500" />
                </div>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-600 dark:text-gray-400">
                  <input
                    type="checkbox"
                    checked={logoRounded}
                    onChange={(e) => setLogoRounded(e.target.checked)}
                    className="rounded accent-indigo-500"
                  />
                  Esquinas redondeadas
                </label>
              </div>
            )}
          </div>

          {/* Advanced */}
          <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5 space-y-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300">
              4 · Ajustes
            </label>

            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                <span>Tamaño (resolución)</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{size}px</span>
              </div>
              <input type="range" min={200} max={1000} step={50} value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-white/10 cursor-pointer accent-indigo-500" />
            </div>

            <div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                <span>Margen exterior</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">{margin}</span>
              </div>
              <input type="range" min={0} max={10} value={margin}
                onChange={(e) => setMargin(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-white/10 cursor-pointer accent-cyan-500" />
            </div>

            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 block">Corrección de errores</span>
              <div className="grid grid-cols-4 gap-2">
                {ERROR_LEVELS.map((lvl) => (
                  <button
                    key={lvl.id}
                    onClick={() => setErrorLevel(lvl.id)}
                    className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                      errorLevel === lvl.id
                        ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 hover:text-indigo-500'
                    }`}
                  >
                    {lvl.id}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-1.5">
                {ERROR_LEVELS.find(l => l.id === errorLevel)?.label} — usa "Muy alto" cuando agregues logo.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={handleDownload} disabled={!hasContent || !qrImageUrl || isProcessing}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40 shadow-[0_4px_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Descargar PNG
            </button>
            <button onClick={handleCopy} disabled={!hasContent || !qrImageUrl}
              className="px-4 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold text-sm transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
              Copiar
            </button>
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preview en tiempo real</span>
            {hasContent && (
              <span className="text-xs text-gray-400 dark:text-gray-600">{size}×{size}px</span>
            )}
          </div>

          <div
            className="flex-1 rounded-xl flex items-center justify-center overflow-hidden min-h-[320px] p-4"
            style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%) 0 0 / 16px 16px' }}
          >
            {hasContent ? (
              <canvas
                ref={canvasRef}
                className={`max-w-full max-h-[520px] rounded-lg shadow-lg ${qrImageUrl ? '' : 'opacity-0'}`}
              />
            ) : (
              <div className="text-center text-gray-300 dark:text-gray-700">
                <svg className="w-14 h-14 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                    d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 4h2m4-4h-2m2 4v2m-4-2v2m-2-6h6" />
                </svg>
                <p className="text-sm">Escribe algo para generar tu QR</p>
              </div>
            )}
          </div>

          {hasContent && logoUrl && errorLevel !== 'H' && (
            <p className="text-xs text-center text-amber-500 dark:text-amber-400 mt-3">
              ⚠ Recomendado: cambia la corrección a "H" para que el QR sea legible con el logo.
            </p>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
