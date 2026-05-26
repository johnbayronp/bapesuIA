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

/**
 * Sube un File al bucket S3 y devuelve la URL pública.
 * @param {File} file
 * @param {string} [prefix]  Prefijo para el nombre del archivo (ej: company_id)
 * @returns {Promise<string>} URL pública del objeto subido
 */
export async function uploadToS3(file, prefix = '') {
  if (!REGION || !BUCKET) {
    throw new Error('Faltan las variables de entorno de AWS (VITE_AWS_REGION, VITE_AWS_S3_BUCKET)');
  }

  const ext       = file.name.split('.').pop().toLowerCase();
  const timestamp = Date.now();
  const safeName  = `${prefix ? prefix + '_' : ''}${timestamp}.${ext}`;
  const key       = FOLDER ? `${FOLDER}/${safeName}` : safeName;

  // Convertir a ArrayBuffer para compatibilidad con el navegador
  const arrayBuffer = await file.arrayBuffer();
  const body        = new Uint8Array(arrayBuffer);

  await s3.send(new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    Body:        body,
    ContentType: file.type,
  }));

  return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}
