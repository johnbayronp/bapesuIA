import { db } from './db';
import { uploadToS3 } from '../lib/s3Upload';

export const contractsApi = {
  list: (companyId) =>
    db.from('bapesu_contracts')
      .select('*, bapesu_contract_attachments(id,kind,file_name,content_type,storage_url)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),

  create: (payload) =>
    db.from('bapesu_contracts').insert(payload).select().single(),

  addAttachment: (payload) =>
    db.from('bapesu_contract_attachments').insert(payload).select().single(),

  uploadAttachment: async ({ companyId, contractId, kind, file }) => {
    const storageUrl = await uploadToS3(file, `${kind.toLowerCase()}_${contractId}`, {
      folder: `contracts/${companyId}`,
      maxBytes: 2 * 1024 * 1024,
    });

    const metadata = await contractsApi.addAttachment({
      company_id: companyId,
      contract_id: contractId,
      kind,
      file_name: file.name.slice(0, 180),
      content_type: file.type,
      storage_url: storageUrl,
    });
    return metadata;
  },

  downloadAttachment: async (url) => {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`No se pudo descargar el anexo (${response.status}).`);
      return { data: await response.blob(), error: null };
    } catch (error) {
      return { data: null, error };
    }
  },
};
