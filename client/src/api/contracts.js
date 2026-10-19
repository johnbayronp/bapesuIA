import { db } from './db';
import { uploadToS3, deleteFromS3 } from '../lib/s3Upload';

const attachmentContentType = (file) => {
  if (file.type && file.type !== 'application/octet-stream') return file.type;
  const extension = file.name.split('.').pop().toLowerCase();
  return ({ pdf: 'application/pdf', jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png' })[extension] || file.type || 'application/octet-stream';
};

export const contractsApi = {
  list: (companyId) =>
    db.from('bapesu_contracts')
      .select('*, bapesu_contract_attachments(id,kind,file_name,content_type,storage_url)')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),

  create: (payload) =>
    db.from('bapesu_contracts').insert(payload).select().single(),

  updateDraft: (companyId, contractId, payload) =>
    db.from('bapesu_contracts').update(payload)
      .eq('company_id', companyId).eq('id', contractId).eq('status', 'DRAFT')
      .select().single(),

  addAttachment: (payload) =>
    db.from('bapesu_contract_attachments').insert(payload).select().single(),

  listAttachmentKinds: (companyId, contractId) =>
    db.from('bapesu_contract_attachments').select('kind')
      .eq('company_id', companyId).eq('contract_id', contractId),

  deleteWithAudit: async ({ companyId, contractId, reason }) => {
    const attachments = await db.from('bapesu_contract_attachments').select('storage_url')
      .eq('company_id', companyId).eq('contract_id', contractId);
    if (attachments.error) return { error: attachments.error, filesRemoved: false };

    const deletion = await db.rpc('delete_contract_with_audit', {
      p_contract_id: contractId,
      p_reason: reason,
    });
    if (deletion.error) return { error: deletion.error, filesRemoved: false };

    const cleanup = await Promise.allSettled((attachments.data || []).map(({ storage_url }) => deleteFromS3(storage_url)));
    return {
      error: null,
      filesRemoved: cleanup.every((result) => result.status === 'fulfilled'),
    };
  },

  uploadAttachment: async ({ companyId, contractId, kind, file }) => {
    const contentType = attachmentContentType(file);
    const storageUrl = await uploadToS3(file, `${kind.toLowerCase()}_${contractId}`, {
      folder: `contracts/${companyId}`,
      maxBytes: 2 * 1024 * 1024,
      contentType,
    });

    const metadata = await contractsApi.addAttachment({
      company_id: companyId,
      contract_id: contractId,
      kind,
      file_name: file.name.slice(0, 180),
      content_type: contentType,
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
