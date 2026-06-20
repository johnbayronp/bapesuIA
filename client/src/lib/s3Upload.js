import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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

const imageFileFromCanvas = (canvas, quality) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('No se pudo comprimir la imagen'));
        else resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });

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
  if (!maxBytes || !file.type.startsWith('image/') || file.size <= maxBytes) {
    return file;
  }

  const image = await loadImageBitmap(file);
  let width = image.width;
  let height = image.height;
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

    blob = await imageFileFromCanvas(canvas, quality);
    if (blob.size <= maxBytes) {
      return new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' });
    }

    if (quality > 0.48) {
      quality -= 0.12;
    } else {
      width *= 0.78;
      height *= 0.78;
      quality = 0.7;
    }
  }

  throw new Error('No se pudo reducir la imagen a menos de 1 MB');
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

  const uploadFile = await compressImage(file, options.maxBytes);
  const folder    = options.folder ?? FOLDER;
  const ext       = uploadFile.name.split('.').pop().toLowerCase();
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
    ContentType: uploadFile.type,
  }));

  const publicKey = key.split('/').map(encodeURIComponent).join('/');
  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${publicKey}`;
}
