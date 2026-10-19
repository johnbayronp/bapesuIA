import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const REGION = import.meta.env.VITE_AWS_REGION;
const BUCKET = import.meta.env.VITE_AWS_S3_BUCKET;
const FOLDER = import.meta.env.VITE_AWS_S3_FOLDER ?? 'logos';

const s3 = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId:     import.meta.env.VITE_AWS_ACCESS_KEY_ID,
    secretAccessKey: import.meta.env.VITE_AWS_SECRET_ACCESS_KEY,
  },
});

const imageFileFromCanvas = (canvas, type, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('No se pudo comprimir la imagen'));
        else resolve(blob);
      }, type, quality
    );
  });

const concatBytes = (parts) => {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    result.set(part, offset);
    offset += part.length;
  }
  return result;
};

const pdfText = (value) => new TextEncoder().encode(value);

function createPdfFromJpegs(pages) {
  const objects = [null, pdfText('<< /Type /Catalog /Pages 2 0 R >>'), null];
  const pageRefs = pages.map((_, index) => `${3 + index * 3} 0 R`).join(' ');
  objects[2] = pdfText(`<< /Type /Pages /Kids [${pageRefs}] /Count ${pages.length} >>`);

  pages.forEach((page, index) => {
    const pageId = 3 + index * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const { jpeg, width, height, pageWidth, pageHeight } = page;
    const content = pdfText(`q\n${pageWidth} 0 0 ${pageHeight} 0 0 cm\n/Im0 Do\nQ`);
    objects[pageId] = pdfText(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    objects[contentId] = concatBytes([
      pdfText(`<< /Length ${content.length} >>\nstream\n`), content, pdfText('\nendstream'),
    ]);
    objects[imageId] = concatBytes([
      pdfText(`<< /Type /XObject /Subtype /Image /Width ${width} /Height ${height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
      jpeg, pdfText('\nendstream'),
    ]);
  });

  const chunks = [pdfText('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n')];
  const offsets = [0];
  let length = chunks[0].length;
  objects.slice(1).forEach((object, index) => {
    offsets.push(length);
    const chunk = concatBytes([pdfText(`${index + 1} 0 obj\n`), object, pdfText('\nendobj\n')]);
    chunks.push(chunk);
    length += chunk.length;
  });
  const xrefOffset = length;
  const xref = [`xref\n0 ${objects.length}\n0000000000 65535 f \n`];
  offsets.slice(1).forEach((offset) => xref.push(`${String(offset).padStart(10, '0')} 00000 n \n`));
  chunks.push(pdfText(`${xref.join('')}trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`));
  return concatBytes(chunks);
}

async function compressPdf(file, maxBytes) {
  const [pdfjs, worker] = await Promise.all([
    import('pdfjs-dist/build/pdf.mjs'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ]);
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const source = await file.arrayBuffer();
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(source), isEvalSupported: false });
  const pdfDocument = await loadingTask.promise;

  try {
    for (const scale of [1.6, 1.3, 1.05, 0.85, 0.7]) {
      const renderedPages = [];
      for (let pageNumber = 1; pageNumber <= pdfDocument.numPages; pageNumber += 1) {
        const page = await pdfDocument.getPage(pageNumber);
        const originalViewport = page.getViewport({ scale: 1 });
        const renderScale = Math.min(scale, 2000 / Math.max(originalViewport.width, originalViewport.height));
        const viewport = page.getViewport({ scale: renderScale });
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.ceil(viewport.width));
        canvas.height = Math.max(1, Math.ceil(viewport.height));
        await page.render({ canvas, canvasContext: canvas.getContext('2d'), viewport }).promise;
        renderedPages.push({
          canvas, pageWidth: Number(originalViewport.width.toFixed(2)), pageHeight: Number(originalViewport.height.toFixed(2)),
        });
      }

      for (const quality of [0.78, 0.62, 0.48, 0.36]) {
        const pages = [];
        for (const renderedPage of renderedPages) {
          const { canvas, pageWidth, pageHeight } = renderedPage;
          const jpegBlob = await imageFileFromCanvas(canvas, 'image/jpeg', quality);
          pages.push({
            jpeg: new Uint8Array(await jpegBlob.arrayBuffer()), width: canvas.width, height: canvas.height,
            pageWidth, pageHeight,
          });
        }
        const compressed = createPdfFromJpegs(pages);
        if (compressed.length <= maxBytes) {
          renderedPages.forEach(({ canvas }) => { canvas.width = 0; canvas.height = 0; });
          return new File([compressed], file.name, { type: 'application/pdf', lastModified: file.lastModified });
        }
      }
      renderedPages.forEach(({ canvas }) => { canvas.width = 0; canvas.height = 0; });
    }
  } finally {
    await loadingTask.destroy();
  }

  throw new Error('No se pudo reducir el PDF a menos de 2 MB. Intenta con un documento de menor tamaño.');
}

const loadImageBitmap = async (file) => {
  if ('createImageBitmap' in window) {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('No se pudo leer la imagen'));
    };
    image.src = objectUrl;
  });
};

async function compressImage(file, maxBytes) {
  const extension = file.name.split('.').pop().toLowerCase();
  const imageType = file.type.startsWith('image/') ? file.type : ({ jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' })[extension];
  if (!maxBytes || !imageType || file.size <= maxBytes) {
    return file;
  }

  const image = await loadImageBitmap(file);
  let width = image.width;
  let height = image.height;
  const outputType = imageType === 'image/png' ? 'image/png' : 'image/jpeg';
  const outputName = file.name.replace(/\.[^.]+$/, outputType === 'image/png' ? '.png' : '.jpg');
  let quality = 0.82;
  let blob = null;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));

    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

    blob = await imageFileFromCanvas(canvas, outputType, quality);
    if (blob.size <= maxBytes) {
      return new File([blob], outputName, { type: outputType, lastModified: file.lastModified });
    }

    if (quality > 0.48) {
      quality -= 0.12;
    } else {
      width *= 0.78;
      height *= 0.78;
      quality = 0.7;
    }
  }

  throw new Error('No se pudo reducir la imagen a menos de 2 MB. Intenta con una imagen de menor tamaño.');
}

async function compressAttachment(file, maxBytes) {
  if (!maxBytes || file.size <= maxBytes) return file;
  if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    return compressPdf(file, maxBytes);
  }
  return compressImage(file, maxBytes);
}

/**
 * Sube un File al bucket S3 y devuelve la URL pública.
 * @param {File} file
 * @param {string} [prefix]  Prefijo para el nombre del archivo (ej: company_id)
 * @returns {Promise<string>} URL pública del objeto subido
 */
export async function uploadToS3(file, prefix = '', options = {}) {
  if (!REGION || !BUCKET) {
    throw new Error('Faltan las variables de entorno de AWS (VITE_AWS_REGION, VITE_AWS_S3_BUCKET)');
  }

  const uploadFile = await compressAttachment(file, options.maxBytes);
  const folder    = options.folder ?? FOLDER;
  const ext       = uploadFile.name.split('.').pop().toLowerCase();
  const inferredContentType = ({ pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' })[ext];
  const timestamp = Date.now();
  const safeName  = `${prefix ? prefix + '_' : ''}${timestamp}.${ext}`;
  const key       = folder ? `${folder}/${safeName}` : safeName;

  // Convertir a ArrayBuffer para compatibilidad con el navegador
  const arrayBuffer = await uploadFile.arrayBuffer();
  const body        = new Uint8Array(arrayBuffer);

  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        body,
    ContentType: uploadFile.type && uploadFile.type !== 'application/octet-stream'
      ? uploadFile.type
      : options.contentType || inferredContentType || 'application/octet-stream',
  }));

  const publicKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${publicKey}`;
}

export async function deleteFromS3(url) {
  if (!REGION || !BUCKET) {
    throw new Error('Faltan las variables de entorno de AWS (VITE_AWS_REGION, VITE_AWS_S3_BUCKET)');
  }
  const parsedUrl = new URL(url);
  if (parsedUrl.hostname !== `${BUCKET}.s3.${REGION}.amazonaws.com`) {
    throw new Error('La URL del anexo no pertenece al bucket configurado.');
  }
  const key = parsedUrl.pathname.slice(1).split('/').map(decodeURIComponent).join('/');
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
}
