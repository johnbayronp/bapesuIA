import React, { useState, useRef, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import useToast from '../../hooks/useToast';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const POSITIONS = [
  { id: 'top-left',      label: '↖', row: 0, col: 0 },
  { id: 'top-center',    label: '↑', row: 0, col: 1 },
  { id: 'top-right',     label: '↗', row: 0, col: 2 },
  { id: 'middle-left',   label: '←', row: 1, col: 0 },
  { id: 'center',        label: '·', row: 1, col: 1 },
  { id: 'middle-right',  label: '→', row: 1, col: 2 },
  { id: 'bottom-left',   label: '↙', row: 2, col: 0 },
  { id: 'bottom-center', label: '↓', row: 2, col: 1 },
  { id: 'bottom-right',  label: '↘', row: 2, col: 2 },
];

function getLogoCoords(position, bgW, bgH, logoW, logoH, padding) {
  const map = {
    'top-left':      { x: padding,             y: padding },
    'top-center':    { x: bgW / 2 - logoW / 2, y: padding },
    'top-right':     { x: bgW - logoW - padding, y: padding },
    'middle-left':   { x: padding,               y: bgH / 2 - logoH / 2 },
    'center':        { x: bgW / 2 - logoW / 2,   y: bgH / 2 - logoH / 2 },
    'middle-right':  { x: bgW - logoW - padding,  y: bgH / 2 - logoH / 2 },
    'bottom-left':   { x: padding,               y: bgH - logoH - padding },
    'bottom-center': { x: bgW / 2 - logoW / 2,   y: bgH - logoH - padding },
    'bottom-right':  { x: bgW - logoW - padding,  y: bgH - logoH - padding },
  };
  return map[position] || map['bottom-right'];
}

export default function LogoStamper() {
  const { showSuccess, showError } = useToast();

  const [bgImages, setBgImages]       = useState([]);   // [{ file, url, name }]
  const [activeIdx, setActiveIdx]     = useState(0);
  const [logoFile, setLogoFile]       = useState(null);
  const [logoUrl, setLogoUrl]         = useState(null);
  const [position, setPosition]       = useState('bottom-right'); // global position
  const [individualPositions, setIndividualPositions] = useState(false);
  const [perImagePositions, setPerImagePositions]     = useState({});
  const [size, setSize]               = useState(20);         // % of bg width
  const [opacity, setOpacity]         = useState(100);        // 0-100
  const [padding, setPadding]         = useState(20);         // px on original image
  const [individualAdjustments, setIndividualAdjustments] = useState(false);
  const [perImageAdjustments, setPerImageAdjustments]     = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [customName, setCustomName]   = useState('');         // prefix for output files

  // Resolved position for the active image
  const activePosition = individualPositions
    ? (perImagePositions[activeIdx] ?? position)
    : position;

  const setActivePosition = (pos) => {
    if (individualPositions) {
      setPerImagePositions((prev) => ({ ...prev, [activeIdx]: pos }));
    } else {
      setPosition(pos);
    }
  };

  const posForImage = (i) =>
    individualPositions ? (perImagePositions[i] ?? position) : position;

  // Resolved adjustments for the active image
  const activeAdj = individualAdjustments
    ? (perImageAdjustments[activeIdx] ?? { size, opacity, padding })
    : { size, opacity, padding };

  const activeSize    = activeAdj.size;
  const activeOpacity = activeAdj.opacity;
  const activePadding = activeAdj.padding;

  const setActiveAdj = (key, val) => {
    if (individualAdjustments) {
      setPerImageAdjustments((prev) => ({
        ...prev,
        [activeIdx]: { ...(prev[activeIdx] ?? { size, opacity, padding }), [key]: val },
      }));
    } else {
      if (key === 'size')    setSize(val);
      if (key === 'opacity') setOpacity(val);
      if (key === 'padding') setPadding(val);
    }
  };

  const adjForImage = (i) =>
    individualAdjustments ? (perImageAdjustments[i] ?? { size, opacity, padding }) : { size, opacity, padding };

  const addMoreInputRef = useRef(null);

  const canvasRef  = useRef(null);
  const bgImgRef   = useRef(new window.Image());
  const logoImgRef = useRef(new window.Image());

  // Draw preview
  const drawPreview = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const bg  = bgImgRef.current;
    const logo = logoImgRef.current;

    if (!bg.src || !bg.complete) return;

    canvas.width  = bg.naturalWidth;
    canvas.height = bg.naturalHeight;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0);

    if (logo.src && logo.complete && logoUrl) {
      const logoW = Math.round((activeSize / 100) * bg.naturalWidth);
      const ratio  = logo.naturalHeight / logo.naturalWidth;
      const logoH  = Math.round(logoW * ratio);
      const { x, y } = getLogoCoords(activePosition, bg.naturalWidth, bg.naturalHeight, logoW, logoH, activePadding);

      ctx.globalAlpha = activeOpacity / 100;
      ctx.drawImage(logo, x, y, logoW, logoH);
      ctx.globalAlpha = 1;
    }
  }, [activePosition, activeSize, activeOpacity, activePadding, logoUrl]);

  // Load background
  useEffect(() => {
    if (!bgImages[activeIdx]) return;
    const img = bgImgRef.current;
    img.onload = drawPreview;
    img.src = bgImages[activeIdx].url;
  }, [bgImages, activeIdx]);

  // Load logo
  useEffect(() => {
    if (!logoUrl) return;
    const img = logoImgRef.current;
    img.onload = drawPreview;
    img.src = logoUrl;
  }, [logoUrl]);

  // Redraw when settings change
  useEffect(() => { drawPreview(); }, [drawPreview]);

  const handleBgChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const items = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setBgImages(items);
    setActiveIdx(0);
    e.target.value = '';
  };

  const handleAddMore = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;
    const newItems = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setBgImages((prev) => [...prev, ...newItems]);
    e.target.value = '';
  };

  const removeImage = (idx) => {
    setBgImages((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      return next;
    });
    setActiveIdx((prev) => {
      if (idx < prev) return prev - 1;
      if (idx === prev) return Math.max(0, prev - 1);
      return prev;
    });
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLogoFile(file);
    setLogoUrl(URL.createObjectURL(file));
  };

  const getFileName = (index) => {
    const prefix = customName.trim();
    if (prefix) return `${prefix}-${index + 1}.png`;
    return `logo-${bgImages[index]?.name.replace(/\.[^.]+$/, '') ?? index + 1}.png`;
  };

  const downloadCurrent = () => {
    const canvas = canvasRef.current;
    if (!canvas || !bgImages[activeIdx]) return;
    const link = document.createElement('a');
    link.href = canvas.toDataURL('image/png');
    link.download = getFileName(activeIdx);
    link.click();
    showSuccess('Imagen descargada');
  };

  const downloadAll = async () => {
    if (!bgImages.length || !logoUrl) return;
    setIsProcessing(true);

    try {
      const logo = new window.Image();
      await new Promise((res) => { logo.onload = res; logo.src = logoUrl; });

      const zip = new JSZip();

      for (let i = 0; i < bgImages.length; i++) {
        const item = bgImages[i];
        const bg = new window.Image();
        await new Promise((res) => { bg.onload = res; bg.src = item.url; });

        const c = document.createElement('canvas');
        c.width = bg.naturalWidth;
        c.height = bg.naturalHeight;
        const ctx = c.getContext('2d');
        ctx.drawImage(bg, 0, 0);

        const logoW = Math.round((adjForImage(i).size / 100) * bg.naturalWidth);
        const logoH = Math.round(logoW * (logo.naturalHeight / logo.naturalWidth));
        const { x, y } = getLogoCoords(posForImage(i), bg.naturalWidth, bg.naturalHeight, logoW, logoH, adjForImage(i).padding);

        ctx.globalAlpha = adjForImage(i).opacity / 100;
        ctx.drawImage(logo, x, y, logoW, logoH);
        ctx.globalAlpha = 1;

        const dataUrl = c.toDataURL('image/png');
        const base64 = dataUrl.split(',')[1];
        zip.file(getFileName(i), base64, { base64: true });
      }

      const zipName = customName.trim() ? `${customName.trim()}.zip` : 'imagenes-con-logo.zip';
      const blob = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = zipName;
      link.click();
      URL.revokeObjectURL(link.href);

      showSuccess(`${bgImages.length} imágenes empaquetadas en ${zipName}`);
    } catch {
      showError('Error al procesar las imágenes');
    } finally {
      setIsProcessing(false);
    }
  };

  const hasBg   = bgImages.length > 0;
  const hasLogo = !!logoUrl;
  const ready   = hasBg && hasLogo;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

      {/* Header */}
      <div className="mb-8 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-pink-500/10 dark:bg-pink-500/15 text-pink-500 dark:text-pink-400 flex items-center justify-center">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">Agregar Logo a Imagen</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Añade tu marca a una o varias imágenes con preview en tiempo real</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── Controls ── */}
        <div className="space-y-5">

          {/* Upload background */}
          <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              1 · Imagen(es) de fondo
              {bgImages.length > 0 && (
                <span className="ml-2 text-xs font-normal text-indigo-500">{bgImages.length} seleccionada{bgImages.length > 1 ? 's' : ''}</span>
              )}
            </label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-white/15 rounded-xl cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all duration-200">
              <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="text-xs text-gray-400">{hasBg ? 'Reemplazar imágenes' : 'Haz clic o arrastra imágenes'}</span>
              <input type="file" accept="image/*" multiple onChange={handleBgChange} className="hidden" />
            </label>

            {/* Add more button */}
            {hasBg && (
              <div className="mt-2">
                <input ref={addMoreInputRef} type="file" accept="image/*" multiple onChange={handleAddMore} className="hidden" />
                <button
                  onClick={() => addMoreInputRef.current?.click()}
                  className="w-full py-2 rounded-xl border border-dashed border-indigo-300 dark:border-indigo-500/40 text-indigo-500 dark:text-indigo-400 text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-all duration-200 flex items-center justify-center gap-1.5">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Agregar más fotos
                </button>
              </div>
            )}

            {/* Thumbnails */}
            {bgImages.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {bgImages.map((item, i) => (
                  <div key={i} className="relative group">
                    <button onClick={() => setActiveIdx(i)}
                      className={`relative w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${i === activeIdx ? 'border-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.4)]' : 'border-transparent opacity-60 hover:opacity-100'}`}>
                      <img src={item.url} alt={item.name} className="w-full h-full object-cover" />
                      {/* Dot for custom per-image position */}
                      {individualPositions && perImagePositions[i] && (
                        <span className="absolute bottom-0.5 right-0.5 w-2 h-2 rounded-full bg-violet-500 border border-white dark:border-gray-900" />
                      )}
                      {/* Dot for custom per-image adjustments */}
                      {individualAdjustments && perImageAdjustments[i] && (
                        <span className="absolute bottom-0.5 left-0.5 w-2 h-2 rounded-full bg-orange-500 border border-white dark:border-gray-900" />
                      )}
                    </button>
                    <button
                      onClick={() => removeImage(i)}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none items-center justify-center hidden group-hover:flex shadow">
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upload logo */}
          <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              2 · Logo / Marca de agua
              {hasLogo && <span className="ml-2 text-xs font-normal text-emerald-500">✓ Cargado</span>}
            </label>
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 dark:border-white/15 rounded-xl cursor-pointer hover:border-pink-400 dark:hover:border-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/5 transition-all duration-200">
              {hasLogo ? (
                <img src={logoUrl} alt="Logo" className="h-14 w-auto object-contain" />
              ) : (
                <>
                  <svg className="w-6 h-6 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M14 10h.01" />
                  </svg>
                  <span className="text-xs text-gray-400">Sube tu logo (PNG con fondo transparente recomendado)</span>
                </>
              )}
              <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
            </label>
          </div>

          {/* Position grid */}
          <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">3 · Posición</label>

              {/* Toggle: individual vs global — only when multiple images */}
              {bgImages.length > 1 && (
                <button
                  onClick={() => setIndividualPositions((v) => !v)}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    individualPositions
                      ? 'bg-violet-500/10 border-violet-400 dark:border-violet-500/60 text-violet-600 dark:text-violet-400'
                      : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-violet-300 dark:hover:border-violet-500/40'
                  }`}
                >
                  <span className={`w-7 h-4 rounded-full relative transition-colors duration-200 ${individualPositions ? 'bg-violet-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${individualPositions ? 'left-3.5' : 'left-0.5'}`} />
                  </span>
                  {individualPositions ? 'Por imagen' : 'Igual para todas'}
                </button>
              )}
            </div>

            {/* Indicator when in individual mode */}
            {individualPositions && bgImages.length > 1 && (
              <p className="text-xs text-violet-500 dark:text-violet-400 mb-3 flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Editando posición de imagen {activeIdx + 1} de {bgImages.length}
                {perImagePositions[activeIdx] && (
                  <span className="ml-1 text-[10px] bg-violet-500/15 px-1.5 py-0.5 rounded-full">personalizada</span>
                )}
              </p>
            )}

            <div className="grid grid-cols-3 gap-2 w-36">
              {POSITIONS.map((pos) => (
                <button key={pos.id} onClick={() => setActivePosition(pos.id)}
                  className={`w-10 h-10 rounded-lg text-lg font-bold transition-all duration-150 ${
                    activePosition === pos.id
                      ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/15 hover:text-indigo-500'
                  }`}>
                  {pos.label}
                </button>
              ))}
            </div>
          </div>

          {/* Size, Opacity, Padding */}
          <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">4 · Ajustes</label>

              {bgImages.length > 1 && (
                <button
                  onClick={() => setIndividualAdjustments((v) => !v)}
                  className={`flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                    individualAdjustments
                      ? 'bg-orange-500/10 border-orange-400 dark:border-orange-500/60 text-orange-600 dark:text-orange-400'
                      : 'bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:border-orange-300 dark:hover:border-orange-500/40'
                  }`}
                >
                  <span className={`w-7 h-4 rounded-full relative transition-colors duration-200 ${individualAdjustments ? 'bg-orange-500' : 'bg-gray-300 dark:bg-white/20'}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-all duration-200 ${individualAdjustments ? 'left-3.5' : 'left-0.5'}`} />
                  </span>
                  {individualAdjustments ? 'Por imagen' : 'Igual para todas'}
                </button>
              )}
            </div>

            {individualAdjustments && bgImages.length > 1 && (
              <p className="text-xs text-orange-500 dark:text-orange-400 flex items-center gap-1 !mt-2">
                <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Editando ajustes de imagen {activeIdx + 1} de {bgImages.length}
                {perImageAdjustments[activeIdx] && (
                  <span className="ml-1 text-[10px] bg-orange-500/15 px-1.5 py-0.5 rounded-full">personalizada</span>
                )}
              </p>
            )}

            {[
              { label: 'Tamaño',     key: 'size',    value: activeSize,    min: 3,  max: 60,  unit: '%',  color: 'accent-indigo-500' },
              { label: 'Opacidad',   key: 'opacity', value: activeOpacity, min: 10, max: 100, unit: '%',  color: 'accent-pink-500'   },
              { label: 'Margen (px)',key: 'padding', value: activePadding, min: 0,  max: 100, unit: 'px', color: 'accent-cyan-500'   },
            ].map(({ label, key, value, min, max, unit, color }) => (
              <div key={label}>
                <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1.5">
                  <span>{label}</span>
                  <span className="font-semibold text-gray-700 dark:text-gray-200">{value}{unit}</span>
                </div>
                <input type="range" min={min} max={max} value={value}
                  onChange={(e) => setActiveAdj(key, Number(e.target.value))}
                  className={`w-full h-1.5 rounded-full appearance-none bg-gray-200 dark:bg-white/10 cursor-pointer ${color}`} />
              </div>
            ))}
          </div>

          {/* Custom file name */}
          <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              5 · Nombre de archivo
            </label>
            <div className="relative">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="ej: Jeans_Alto  →  Jeans_Alto-1, Jeans_Alto-2…"
                className="w-full px-3 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:focus:ring-indigo-500 transition"
              />
            </div>
            {customName.trim() && (
              <p className="mt-2 text-xs text-indigo-500 dark:text-indigo-400">
                Se guardará como: <span className="font-semibold">{customName.trim()}-1.png</span>, <span className="font-semibold">{customName.trim()}-2.png</span>…
              </p>
            )}
            {!customName.trim() && (
              <p className="mt-2 text-xs text-gray-400 dark:text-gray-600">
                Sin nombre personalizado se usará el nombre original del archivo.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={downloadCurrent} disabled={!ready}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40 shadow-[0_4px_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Descargar esta
            </button>
            {bgImages.length > 1 && (
              <button onClick={downloadAll} disabled={!ready || isProcessing}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold text-sm transition-all duration-200 disabled:opacity-40 shadow-[0_4px_20px_rgba(16,185,129,0.3)] flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                {isProcessing ? 'Procesando...' : `Descargar ZIP (${bgImages.length})`}
              </button>
            )}
          </div>
        </div>

        {/* ── Preview ── */}
        <div className="bg-white dark:bg-white/3 border border-gray-200 dark:border-white/8 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Preview en tiempo real</span>
            {hasBg && (
              <span className="text-xs text-gray-400 dark:text-gray-600">
                {customName.trim() ? `${customName.trim()}-${activeIdx + 1}.png` : bgImages[activeIdx]?.name}
              </span>
            )}
          </div>

          <div
            className="flex-1 rounded-xl flex items-center justify-center overflow-hidden min-h-[320px]"
            style={{ background: 'repeating-conic-gradient(#e5e7eb 0% 25%, #f9fafb 0% 50%) 0 0 / 16px 16px' }}
          >
            {hasBg ? (
              <canvas ref={canvasRef}
                className="max-w-full max-h-[520px] rounded-lg shadow-lg object-contain" />
            ) : (
              <div className="text-center text-gray-300 dark:text-gray-700">
                <svg className="w-14 h-14 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Sube una imagen para ver el preview</p>
              </div>
            )}
          </div>

          {!hasLogo && hasBg && (
            <p className="text-xs text-center text-amber-500 dark:text-amber-400 mt-3">
              ⚠ Sube un logo para verlo en el preview
            </p>
          )}
        </div>
      </div>
      <ToastContainer />
    </div>
  );
}
