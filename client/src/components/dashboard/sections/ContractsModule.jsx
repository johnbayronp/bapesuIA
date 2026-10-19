import React, { useEffect, useRef, useState } from 'react';
import { clientsApi, contractsApi } from '../../../api';
import { db } from '../../../api/db';
import { useCompany } from '../../../context/CompanyContext';
import { generateContractDocx } from '../../../lib/contracts/contractDocx';

const MAX_SOURCE_FILE_SIZE = 25 * 1024 * 1024;
const DOCUMENT_TYPES = ['C.C.', 'T.I.', 'C.E.', 'P.P.T.', 'Pasaporte', 'Registro civil', 'NIT'];
const MARITAL_STATUSES = ['Soltero(a)', 'Casado(a)', 'Unión libre', 'Divorciado(a)', 'Viudo(a)', 'Separado(a)'];

async function attachmentKind(file) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (type === 'application/pdf' || name.endsWith('.pdf')) return 'pdf';
  if (type === 'image/jpeg' || type === 'image/png' || /\.(jpe?g|png)$/.test(name)) return 'image';
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (String.fromCharCode(...bytes.slice(0, 5)) === '%PDF-') return 'pdf';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image';
  return null;
}

const DEFAULT_FORM = () => ({
  buyerName: '', buyerIdType: 'C.C.', buyerIdentification: '', buyerIssuedIn: '', buyerMaritalStatus: '', buyerAddress: '', buyerPhone: '', buyerEmail: '',
  coBuyerName: '', coBuyerIdType: 'C.C.', coBuyerIdentification: '', coBuyerIssuedIn: '', coBuyerMaritalStatus: '', coBuyerAddress: '', coBuyerPhone: '', coBuyerEmail: '', lot: '', areaM2: '', price: '', priceInWords: '',
  paymentStartDay: '15', paymentDeadlineDay: '20', initialPayment: '', monthlyInstallmentCount: '', monthlyInstallment: '',
  semiannualInstallmentCount: '', semiannualMonths: 'marzo y septiembre', semiannualInstallment: '', extraordinaryPayment: '', finalPayment: '',
  signingDate: new Date().toISOString().slice(0, 10), signingCity: 'Yopal, Casanare',
});

const money = (value) => Number(value || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
const contractStatus = (status) => status === 'DRAFT' ? 'Borrador' : status === 'SIGNED' ? 'Firmado' : status === 'READY' ? 'Listo' : status;
const SMALL_NUMBERS = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const TENS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const HUNDREDS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function underThousand(value) {
  if (value < 30) return SMALL_NUMBERS[value];
  if (value < 100) return `${TENS[Math.floor(value / 10)]}${value % 10 ? ` y ${SMALL_NUMBERS[value % 10]}` : ''}`;
  if (value === 100) return 'cien';
  return `${HUNDREDS[Math.floor(value / 100)]}${value % 100 ? ` ${underThousand(value % 100)}` : ''}`;
}

function apocopate(value) {
  return value.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');
}

function colombianPesosInWords(value) {
  const amount = Number(value || 0);
  if (!Number.isSafeInteger(amount) || amount < 0 || amount > 999_999_999_999) return '';
  if (amount === 0) return 'CERO PESOS M/CTE.';

  const parts = [];
  const billions = Math.floor(amount / 1_000_000_000);
  const millions = Math.floor(amount / 1_000_000) % 1_000;
  const thousands = Math.floor(amount / 1_000) % 1_000;
  const units = amount % 1_000;
  if (billions) parts.push(`${billions === 1 ? 'mil' : `${apocopate(underThousand(billions))} mil`} millones`);
  if (millions) parts.push(`${millions === 1 ? 'un' : apocopate(underThousand(millions))} millón${millions === 1 ? '' : 'es'}`);
  if (thousands) parts.push(thousands === 1 ? 'mil' : `${apocopate(underThousand(thousands))} mil`);
  if (units) parts.push(apocopate(underThousand(units)));
  const currencySuffix = amount === 1 ? 'PESO M/CTE.' : `${amount >= 1_000_000 && amount % 1_000_000 === 0 ? 'DE ' : ''}PESOS M/CTE.`;
  return `${parts.join(' ')} ${currencySuffix}`.toLocaleUpperCase('es-CO');
}

function formatThousands(value) {
  const digits = String(value || '').replace(/\D/g, '');
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function normalizeMoneyInput(value) {
  return String(value).replace(/\D/g, '').replace(/^0+(?=\d)/, '');
}

function contractToForm(contract) {
  const buyer = contract.client_snapshot || {};
  const coBuyer = buyer.coBuyer || {};
  return {
    buyerName: buyer.name || '', buyerIdType: buyer.idType || 'C.C.', buyerIdentification: buyer.identification || '',
    buyerIssuedIn: buyer.issuedIn || '', buyerMaritalStatus: buyer.maritalStatus || '', buyerAddress: buyer.address || '',
    buyerPhone: buyer.phone || '', buyerEmail: buyer.email || '', coBuyerName: coBuyer.name || contract.co_buyer_name || '',
    coBuyerIdType: coBuyer.idType || 'C.C.', coBuyerIdentification: coBuyer.identification || contract.co_buyer_identification || '',
    coBuyerIssuedIn: coBuyer.issuedIn || '', coBuyerMaritalStatus: coBuyer.maritalStatus || '',
    coBuyerAddress: coBuyer.address || '', coBuyerPhone: coBuyer.phone || '', coBuyerEmail: coBuyer.email || '',
    lot: contract.lot || '', areaM2: String(contract.area_m2 ?? ''), price: String(Math.trunc(Number(contract.price) || 0)), priceInWords: contract.price_in_words || '',
    paymentStartDay: String(contract.payment_start_day ?? 15), paymentDeadlineDay: String(contract.payment_deadline_day ?? 20),
    initialPayment: String(Math.trunc(Number(contract.initial_payment) || 0)), monthlyInstallmentCount: String(contract.monthly_installment_count ?? ''),
    monthlyInstallment: String(Math.trunc(Number(contract.monthly_installment) || 0)), semiannualInstallmentCount: String(contract.semiannual_installment_count ?? ''),
    semiannualMonths: contract.semiannual_months || 'marzo y septiembre', semiannualInstallment: String(Math.trunc(Number(contract.semiannual_installment) || 0)),
    extraordinaryPayment: contract.extraordinary_payment == null ? '' : String(Math.trunc(Number(contract.extraordinary_payment) || 0)), finalPayment: String(Math.trunc(Number(contract.final_payment) || 0)),
    signingDate: contract.signing_date || new Date().toISOString().slice(0, 10), signingCity: contract.signing_city || 'Yopal, Casanare',
  };
}

function saveBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function ContractsModule() {
  const { company, user } = useCompany();
  const pendingStorageKey = company?.id ? `bapesu-contract-pending-${company.id}` : null;
  const [contracts, setContracts] = useState([]);
  const [view, setView] = useState('editor');
  const [form, setForm] = useState(DEFAULT_FORM);
  const [mapFile, setMapFile] = useState(null);
  const [idFile, setIdFile] = useState(null);
  const [paymentPlanFile, setPaymentPlanFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingContractId, setPendingContractId] = useState(() => pendingStorageKey ? sessionStorage.getItem(pendingStorageKey) : null);
  const [actionReason, setActionReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [workingId, setWorkingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [previewError, setPreviewError] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const previewRef = useRef(null);
  const previewSequence = useRef(0);

  async function refreshContracts() {
    if (!company?.id) {
      setContracts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const response = await contractsApi.list(company.id);
    if (response.error) setError(`No se pudieron cargar los contratos: ${response.error.message}`);
    else setContracts(response.data || []);
    setLoading(false);
  }

  useEffect(() => { void refreshContracts(); }, [company?.id]);

  useEffect(() => {
    setPendingContractId(pendingStorageKey ? sessionStorage.getItem(pendingStorageKey) : null);
  }, [pendingStorageKey]);

  useEffect(() => {
    const sequence = ++previewSequence.current;
    let current = true;
    if (!previewRef.current) return undefined;
    setPreviewLoading(true);
    const timeout = window.setTimeout(async () => {
      try {
        const blob = await generateContractDocx(form, { mapFile, idFile, paymentPlanFile });
        const { renderAsync } = await import('docx-preview');
        if (!current || sequence !== previewSequence.current || !previewRef.current) return;
        previewRef.current.innerHTML = '';
        await renderAsync(await blob.arrayBuffer(), previewRef.current, undefined, {
          breakPages: true, renderHeaders: true, renderFooters: true, renderFootnotes: true, renderEndnotes: true,
        });
        setPreviewError('');
      } catch (cause) {
        if (current && sequence === previewSequence.current) {
          setPreviewError(cause instanceof Error ? cause.message : 'No fue posible mostrar el contrato.');
        }
      } finally {
        if (current && sequence === previewSequence.current) setPreviewLoading(false);
      }
    }, 450);
    return () => { current = false; window.clearTimeout(timeout); };
  }, [form, mapFile, idFile, paymentPlanFile]);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setError('');
    setNotice('');
  }

  function setPrice(value) {
    const digits = normalizeMoneyInput(value);
    setForm((current) => ({ ...current, price: digits, priceInWords: digits ? colombianPesosInWords(digits) : '' }));
    setError('');
    setNotice('');
  }

  function setMoneyField(key, value) {
    const digits = normalizeMoneyInput(value);
    setForm((current) => ({ ...current, [key]: digits }));
    setError('');
    setNotice('');
  }

  async function validateFile(file, label, { required = true, imageOnly = false } = {}) {
    if (!file && required) throw new Error(`Adjunta ${label.toLowerCase()} para guardar el contrato.`);
    if (!file) return;
    if (file.size > MAX_SOURCE_FILE_SIZE) throw new Error(`${label}: el archivo original no puede superar 25 MB.`);
    const kind = await attachmentKind(file);
    if (imageOnly ? kind !== 'image' : !kind) {
      throw new Error(`${label}: ${imageOnly ? 'adjunta una imagen JPG o PNG.' : 'adjunta un PDF, JPG o PNG.'}`);
    }
  }

  async function submit(event) {
    event.preventDefault();
    if (!company?.id || !user?.id) return setError('Tu usuario debe estar asociado a una empresa para guardar contratos.');
    setSaving(true);
    setError('');
    setNotice('');
    let createdContractId = null;
    try {
      await validateFile(mapFile, 'el plano del lote');
      await validateFile(idFile, 'la cédula del comprador');
      await validateFile(paymentPlanFile, 'el cuadro del plan de pagos', { required: false, imageOnly: true });
      const snapshot = {
        name: form.buyerName.trim(), identification: form.buyerIdentification.trim(), idType: form.buyerIdType.trim(),
        issuedIn: form.buyerIssuedIn.trim(), maritalStatus: form.buyerMaritalStatus.trim(), address: form.buyerAddress.trim(),
        phone: form.buyerPhone.trim(), email: form.buyerEmail.trim(),
        coBuyer: form.coBuyerName.trim() ? {
          name: form.coBuyerName.trim(), idType: form.coBuyerIdType.trim(), identification: form.coBuyerIdentification.trim(),
          issuedIn: form.coBuyerIssuedIn.trim(), maritalStatus: form.coBuyerMaritalStatus.trim(),
          address: form.coBuyerAddress.trim(), phone: form.coBuyerPhone.trim(), email: form.coBuyerEmail.trim(),
        } : null,
      };
      const existingClient = await db.from('bapesu_clients').select('id').eq('company_id', company.id)
        .eq('nit', snapshot.identification).limit(1).maybeSingle();
      if (existingClient.error) throw existingClient.error;
      let clientId = existingClient.data?.id || null;
      if (!clientId) {
        const clientResponse = await clientsApi.create({
          company_id: company.id, user_id: user.id, name: snapshot.name, nit: snapshot.identification,
          email: snapshot.email || null, phone: snapshot.phone || null, address: snapshot.address || null,
          city: form.signingCity || null,
        });
        if (clientResponse.error) throw clientResponse.error;
        clientId = clientResponse.data?.id || null;
      }

      const payload = {
        company_id: company.id, client_id: clientId, client_name: snapshot.name,
        client_identification: snapshot.identification, client_snapshot: snapshot,
        co_buyer_name: snapshot.coBuyer?.name || null, co_buyer_identification: snapshot.coBuyer?.identification || null,
        lot: form.lot.trim(), area_m2: Number(form.areaM2), price: Number(form.price), price_in_words: form.priceInWords.trim(),
        payment_start_day: Number(form.paymentStartDay), payment_deadline_day: Number(form.paymentDeadlineDay),
        initial_payment: Number(form.initialPayment), monthly_installment_count: Number(form.monthlyInstallmentCount),
        monthly_installment: Number(form.monthlyInstallment), semiannual_installment_count: Number(form.semiannualInstallmentCount),
        semiannual_months: form.semiannualMonths.trim(), semiannual_installment: Number(form.semiannualInstallment),
        extraordinary_payment: form.extraordinaryPayment ? Number(form.extraordinaryPayment) : null,
        final_payment: Number(form.finalPayment), signing_date: form.signingDate, signing_city: form.signingCity.trim(),
        status: 'DRAFT', created_by: user.id, audit_reason: actionReason.trim() || null,
      };
      let shouldUpdateExisting = Boolean(pendingContractId);
      if (pendingContractId) createdContractId = pendingContractId;
      else {
        // Recover a recent draft from the old flow, which saved the contract row
        // before attachment metadata failed and did not remember its id.
        const recentContracts = await contractsApi.list(company.id);
        if (recentContracts.error) throw recentContracts.error;
        const recentIncomplete = (recentContracts.data || []).find((contract) => {
          const age = Date.now() - new Date(contract.created_at).getTime();
          const attachedKinds = new Set((contract.bapesu_contract_attachments || []).map((attachment) => attachment.kind));
          return contract.status === 'DRAFT' && contract.created_by === user.id && age >= 0 && age < 24 * 60 * 60 * 1000
            && contract.client_identification === payload.client_identification
            && contract.co_buyer_identification === payload.co_buyer_identification
            && contract.lot === payload.lot && Number(contract.price) === payload.price
            && contract.signing_date === payload.signing_date
            && (!attachedKinds.has('LOT_MAP') || !attachedKinds.has('BUYER_ID'));
        });
        if (recentIncomplete) {
          createdContractId = recentIncomplete.id;
          shouldUpdateExisting = true;
        }
      }

      if (!createdContractId) {
        const contractResponse = await contractsApi.create(payload);
        if (contractResponse.error) throw contractResponse.error;
        createdContractId = contractResponse.data.id;
      } else if (shouldUpdateExisting) {
        const contractResponse = await contractsApi.updateDraft(company.id, createdContractId, payload);
        if (contractResponse.error) throw contractResponse.error;
      }
      setPendingContractId(createdContractId);
      if (pendingStorageKey) sessionStorage.setItem(pendingStorageKey, createdContractId);

      const existingKindsResponse = await contractsApi.listAttachmentKinds(company.id, createdContractId);
      if (existingKindsResponse.error) throw existingKindsResponse.error;
      const existingKinds = new Set((existingKindsResponse.data || []).map((attachment) => attachment.kind));
      for (const [kind, file] of [['LOT_MAP', mapFile], ['BUYER_ID', idFile], ['PAYMENT_PLAN', paymentPlanFile]]) {
        if (!file || existingKinds.has(kind)) continue;
        try {
          const upload = await contractsApi.uploadAttachment({ companyId: company.id, contractId: createdContractId, kind, file });
          if (upload.error) throw upload.error;
        } catch (cause) {
          const details = cause?.message || (typeof cause === 'string' ? cause : 'revisa la conexión con AWS y los permisos del bucket');
          throw new Error(`No se pudo guardar el anexo “${file.name}”: ${details}`);
        }
      }
      await refreshContracts();
      setPendingContractId(null);
      if (pendingStorageKey) sessionStorage.removeItem(pendingStorageKey);
      setForm(DEFAULT_FORM());
      setMapFile(null);
      setIdFile(null);
      setPaymentPlanFile(null);
      setActionReason('');
      setNotice('Contrato guardado. Puedes descargarlo en formato Word desde la lista.');
    } catch (cause) {
      const message = cause?.message || (typeof cause === 'string' ? cause : 'No se pudo guardar el contrato.');
      setError(createdContractId
        ? `${message} El registro del contrato quedó guardado; revisa el anexo indicado antes de descargar el Word.`
        : message);
    } finally {
      setSaving(false);
    }
  }

  async function removeContract() {
    if (!deleteTarget || deleteReason.trim().length < 5) return;
    setWorkingId(deleteTarget.id);
    setError('');
    setNotice('');
    try {
      const response = await contractsApi.deleteWithAudit({
        companyId: company.id,
        contractId: deleteTarget.id,
        reason: deleteReason.trim(),
      });
      if (response.error) throw response.error;
      setDeleteTarget(null);
      setDeleteReason('');
      await refreshContracts();
      setNotice(response.filesRemoved
        ? 'Contrato eliminado. El usuario, la fecha, la hora y el motivo quedaron registrados en Trazabilidad.'
        : 'Contrato eliminado y registrado en Trazabilidad, pero AWS no pudo borrar uno o más archivos anexos.');
    } catch (cause) {
      setError(cause?.message || 'No se pudo eliminar el contrato.');
    } finally {
      setWorkingId(null);
    }
  }

  async function getContractFiles(contract) {
    const attachments = contract.bapesu_contract_attachments || [];
    const fileFor = async (kind) => {
      const attachment = attachments.find((item) => item.kind === kind);
      if (!attachment) return null;
      const response = await contractsApi.downloadAttachment(attachment.storage_url);
      if (response.error) throw response.error;
      return new File([response.data], attachment.file_name, { type: attachment.content_type });
    };
    const [map, id, paymentPlan] = await Promise.all([fileFor('LOT_MAP'), fileFor('BUYER_ID'), fileFor('PAYMENT_PLAN')]);
    return { mapFile: map, idFile: id, paymentPlanFile: paymentPlan };
  }

  async function loadSavedContract(contract) {
    setWorkingId(contract.id);
    setError('');
    setNotice('');
    try {
      const files = await getContractFiles(contract);
      setForm(contractToForm(contract));
      setMapFile(files.mapFile);
      setIdFile(files.idFile);
      setPaymentPlanFile(files.paymentPlanFile);
      setNotice('Vista previa cargada. Descarga el documento Word.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los anexos del contrato.');
    } finally {
      setWorkingId(null);
    }
  }

  async function downloadWord(contract = null) {
    setWorkingId(contract?.id || 'current');
    setError('');
    try {
      const files = contract ? await getContractFiles(contract) : { mapFile, idFile, paymentPlanFile };
      const values = contract ? contractToForm(contract) : form;
      const blob = await generateContractDocx(values, files);
      const lot = (values.lot || contract?.id || 'contrato').replace(/[^a-zA-Z0-9_-]+/g, '-').replace(/^-|-$/g, '');
      saveBlob(blob, `Contrato-${lot || 'documento'}.docx`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo generar el documento Word.');
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="contracts-module w-full min-w-0 space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
        <p className="text-sm text-gray-500">Promesa de compraventa · Villas de Terranova</p>
        <h1 className="text-2xl font-extrabold text-gray-900">Contratos</h1>
        <p className="text-sm text-gray-500 mt-1">Completa los datos y genera el documento desde la plantilla Word.</p>
        </div>
        <button type="button" onClick={() => setView((current) => current === 'saved' ? 'editor' : 'saved')} className="rounded-xl border border-emerald-600 bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:border-emerald-700 hover:bg-emerald-700">
          {view === 'saved' ? '← Volver al editor' : `Ver contratos guardados${contracts.length ? ` (${contracts.length})` : ''}`}
        </button>
      </header>

      {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</p>}

      {view === 'saved' ? (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-4">
            <h2 className="font-bold text-gray-900">Contratos guardados</h2>
            <p className="mt-1 text-sm text-gray-500">Abre, descarga o elimina contratos. Las acciones de creación y eliminación quedan en Trazabilidad.</p>
          </div>
          {loading ? <p className="px-5 py-10 text-sm text-gray-500">Cargando contratos…</p> : contracts.length === 0 ? (
            <p className="px-5 py-10 text-sm text-gray-500">Los contratos creados aparecerán aquí.</p>
          ) : <div className="grid gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {contracts.map((contract) => (
              <article key={contract.id} className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate font-semibold text-gray-900">{contract.client_name}</p><p className="mt-1 text-sm text-gray-500">{contract.lot} · {contract.area_m2} m²</p></div>
                  <span className="shrink-0 rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">{contractStatus(contract.status)}</span>
                </div>
                <div className="flex items-center justify-between gap-2 text-sm"><span className="font-bold text-yellow-600">{money(contract.price)}</span><span className="text-gray-400">{contract.signing_date ? new Date(`${contract.signing_date}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}</span></div>
                <p className="text-xs text-gray-500">Anexos: {(contract.bapesu_contract_attachments || []).map((file) => ({ LOT_MAP: 'Plano', BUYER_ID: 'Cédula', PAYMENT_PLAN: 'Cuadro de pagos' })[file.kind] || file.kind).join(' · ') || 'ninguno'}</p>
                <div className="mt-auto flex flex-wrap gap-2">
                  <button type="button" onClick={async () => { setView('editor'); await loadSavedContract(contract); }} disabled={Boolean(workingId)} className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-50">{workingId === contract.id ? 'Cargando…' : 'Abrir contrato'}</button>
                  <button type="button" onClick={() => void downloadWord(contract)} disabled={Boolean(workingId)} className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Descargar Word</button>
                  <button type="button" onClick={() => { setDeleteTarget(contract); setDeleteReason(''); setError(''); setNotice(''); }} disabled={Boolean(workingId)} aria-label={`Eliminar contrato de ${contract.client_name}`} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50">Eliminar</button>
                </div>
              </article>
            ))}
          </div>}
        </section>
      ) : <>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <section className="min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="font-bold text-gray-900">Crear contrato</h2>
            <p className="text-sm text-gray-500 mt-1">Datos del comprador, del lote y del plan de pagos.</p>
          </div>
          <form onSubmit={submit} className="p-5 space-y-6">
            <FieldGroup title="Datos del comprador">
              <Field label="Nombre completo" value={form.buyerName} onChange={(value) => setField('buyerName', value)} required />
              <div className="grid grid-cols-[minmax(100px,0.4fr)_1fr] gap-3">
                <SelectField label="Tipo de documento" value={form.buyerIdType} onChange={(value) => setField('buyerIdType', value)} options={DOCUMENT_TYPES} required />
                <Field label="Número de documento" value={form.buyerIdentification} onChange={(value) => setField('buyerIdentification', value)} required />
              </div>
              <Field label="Documento expedido en" value={form.buyerIssuedIn} onChange={(value) => setField('buyerIssuedIn', value)} required />
              <SelectField label="Estado civil" value={form.buyerMaritalStatus} onChange={(value) => setField('buyerMaritalStatus', value)} options={MARITAL_STATUSES} required />
              <Field label="Dirección" value={form.buyerAddress} onChange={(value) => setField('buyerAddress', value)} required />
              <Field label="Teléfono" type="tel" value={form.buyerPhone} onChange={(value) => setField('buyerPhone', value)} required />
              <Field label="Correo electrónico" type="email" value={form.buyerEmail} onChange={(value) => setField('buyerEmail', value)} required />
              <Field label="Segundo comprador (opcional)" value={form.coBuyerName} onChange={(value) => setField('coBuyerName', value)} />
              {form.coBuyerName.trim() && <>
                <SelectField label="Tipo de documento del segundo comprador" value={form.coBuyerIdType} onChange={(value) => setField('coBuyerIdType', value)} options={DOCUMENT_TYPES} required />
                <Field label="Número de documento del segundo comprador" value={form.coBuyerIdentification} onChange={(value) => setField('coBuyerIdentification', value)} required />
                <Field label="Documento expedido en (segundo comprador)" value={form.coBuyerIssuedIn} onChange={(value) => setField('coBuyerIssuedIn', value)} required />
                <SelectField label="Estado civil (segundo comprador)" value={form.coBuyerMaritalStatus} onChange={(value) => setField('coBuyerMaritalStatus', value)} options={MARITAL_STATUSES} required />
                <Field label="Dirección (segundo comprador)" value={form.coBuyerAddress} onChange={(value) => setField('coBuyerAddress', value)} required />
                <Field label="Teléfono (segundo comprador)" type="tel" value={form.coBuyerPhone} onChange={(value) => setField('coBuyerPhone', value)} required />
                <Field label="Correo electrónico (segundo comprador)" type="email" value={form.coBuyerEmail} onChange={(value) => setField('coBuyerEmail', value)} required />
              </>}
            </FieldGroup>

            <FieldGroup title="Lote y valor">
              <Field label="Terreno / lote" value={form.lot} onChange={(value) => setField('lot', value)} required placeholder="Mz. Alisio, lote 21" />
              <Field label="Área (m²)" type="number" value={form.areaM2} onChange={(value) => setField('areaM2', value)} required />
              <MoneyField label="Precio (COP)" value={form.price} onChange={setPrice} required />
              <Field label="Valor en letras (automático)" value={form.priceInWords} onChange={() => {}} required readOnly placeholder="Se completa al ingresar el precio" />
            </FieldGroup>

            <FieldGroup title="Plan de pagos">
              <Field label="Día inicial de pago" type="number" value={form.paymentStartDay} onChange={(value) => setField('paymentStartDay', value)} required />
              <Field label="Fecha límite de pago" type="number" value={form.paymentDeadlineDay} onChange={(value) => setField('paymentDeadlineDay', value)} required />
              <MoneyField label="Cuota inicial (COP)" value={form.initialPayment} onChange={(value) => setMoneyField('initialPayment', value)} required />
              <Field label="Número de cuotas mensuales" type="number" value={form.monthlyInstallmentCount} onChange={(value) => setField('monthlyInstallmentCount', value)} required />
              <MoneyField label="Valor cuota mensual (COP)" value={form.monthlyInstallment} onChange={(value) => setMoneyField('monthlyInstallment', value)} required />
              <Field label="Número de cuotas semestrales" type="number" value={form.semiannualInstallmentCount} onChange={(value) => setField('semiannualInstallmentCount', value)} required />
              <Field label="Meses de pago semestral" value={form.semiannualMonths} onChange={(value) => setField('semiannualMonths', value)} required />
              <MoneyField label="Valor cuota semestral (COP)" value={form.semiannualInstallment} onChange={(value) => setMoneyField('semiannualInstallment', value)} required />
              <MoneyField label="Cuota extraordinaria (opcional)" value={form.extraordinaryPayment} onChange={(value) => setMoneyField('extraordinaryPayment', value)} />
              <MoneyField label="Pago final (COP)" value={form.finalPayment} onChange={(value) => setMoneyField('finalPayment', value)} required />
            </FieldGroup>

            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-gray-600">Motivo de creación (opcional)</span>
              <textarea value={actionReason} onChange={(event) => setActionReason(event.target.value)} maxLength={1000} rows={2} placeholder="Ej.: formalización de compraventa del lote…" className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20" />
              <span className="block text-[11px] text-gray-400">Quedará asociado al registro de trazabilidad.</span>
            </label>

            <FieldGroup title="Firma y anexos">
              <Field label="Fecha del contrato" type="date" value={form.signingDate} onChange={(value) => setField('signingDate', value)} required />
              <Field label="Ciudad de firma" value={form.signingCity} onChange={(value) => setField('signingCity', value)} required />
              <FileField label="Plano con lote señalado" file={mapFile} onChange={setMapFile} hint="PDF, JPG o PNG · hasta 25 MB antes de optimizar" />
              <FileField label="Cédula del comprador" file={idFile} onChange={setIdFile} hint="PDF, JPG o PNG · hasta 25 MB antes de optimizar" />
              <FileField label="Cuadro del plan de pagos (opcional)" file={paymentPlanFile} onChange={setPaymentPlanFile} required={false} accept=".jpg,.jpeg,.png,image/jpeg,image/png" hint="Solo JPG o PNG · hasta 25 MB antes de optimizar" />
              <p className="text-xs text-gray-500">Los adjuntos de más de 2 MB se optimizan antes de subirlos a AWS. Para el cuadro de pagos, importa una imagen JPG o PNG; si no la cargas, se genera automáticamente.</p>
            </FieldGroup>

            <button type="submit" disabled={saving || loading} className="w-full rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 px-4 py-3 text-sm font-bold text-gray-900 shadow-[0_4px_16px_rgba(245,158,11,0.25)] transition hover:from-yellow-500 hover:to-amber-600 disabled:cursor-not-allowed disabled:opacity-60">
              {saving ? 'Guardando contrato y anexos…' : pendingContractId ? 'Reintentar anexos' : 'Guardar contrato'}
            </button>
          </form>
        </section>

        <div className="min-w-0 space-y-6">
          <section className="contract-print-root min-w-0 bg-white rounded-2xl border border-gray-200 shadow-sm">
            <div className="not-for-print flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
              <div><h2 className="font-bold text-gray-900">Vista previa del contrato</h2><p className="text-xs text-gray-500 mt-1">Generada desde la misma plantilla Word.</p></div>
              <div className="flex gap-2">
                <button type="button" onClick={() => void downloadWord()} disabled={!mapFile || !idFile || previewLoading || Boolean(workingId)} className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{workingId === 'current' ? 'Generando Word…' : 'Descargar Word'}</button>
              </div>
            </div>
            <div className="not-for-print px-5 pt-3 text-xs text-gray-500">
              {previewLoading && <p>Actualizando vista previa…</p>}
              {!mapFile || !idFile ? <p>Vista previa activa. Los anexos pendientes aparecen como marcadores en el documento.</p> : null}
              {previewError && <p role="status" className="text-red-600 mt-1">{previewError}</p>}
            </div>
            <div className="contract-docx-scroll max-h-[calc(100vh-13rem)] min-w-0 overflow-auto rounded-b-2xl bg-slate-100 p-2">
              <div ref={previewRef} className="contract-docx-paper" />
            </div>
          </section>

        </div>
      </div>
      </>}

      {deleteTarget && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-gray-900/50 p-4 backdrop-blur-sm" role="presentation">
        <section role="dialog" aria-modal="true" aria-labelledby="delete-contract-title" className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
          <div className="border-t-4 border-red-500 px-6 pb-5 pt-5">
            <div className="flex items-start justify-between gap-4">
              <div><h2 id="delete-contract-title" className="text-lg font-bold text-gray-900">Eliminar contrato</h2><p className="mt-1 text-sm text-gray-500">{deleteTarget.client_name} · Lote {deleteTarget.lot}</p></div>
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={Boolean(workingId)} aria-label="Cerrar" className="text-2xl leading-none text-gray-400 hover:text-gray-700">×</button>
            </div>
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-800">El contrato y sus anexos dejarán de estar disponibles. La eliminación quedará registrada en Trazabilidad.</p>
            <label className="mt-4 block space-y-1.5">
              <span className="text-xs font-semibold text-gray-700">Motivo de eliminación *</span>
              <textarea autoFocus value={deleteReason} onChange={(event) => setDeleteReason(event.target.value)} maxLength={1000} minLength={5} rows={3} required placeholder="Escribe por qué se elimina este contrato…" className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-red-400 focus:ring-2 focus:ring-red-400/20" />
              <span className="block text-[11px] text-gray-400">Mínimo 5 caracteres. Se guardará junto con tu usuario y la fecha y hora.</span>
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTarget(null)} disabled={Boolean(workingId)} className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50">Cancelar</button>
              <button type="button" onClick={() => void removeContract()} disabled={Boolean(workingId) || deleteReason.trim().length < 5} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50">{workingId === deleteTarget.id ? 'Eliminando…' : 'Eliminar y registrar'}</button>
            </div>
          </div>
        </section>
      </div>}

      <style>{`
        .contract-docx-paper .docx-wrapper { background: #e2e8f0; padding: .75rem 0; }
        .contract-docx-paper .docx { margin: 0 auto 1rem; box-shadow: 0 1px 5px #0002; }
        @media print {
          body * { visibility: hidden !important; }
          .contract-print-root, .contract-print-root * { visibility: visible !important; }
          .contract-print-root { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; border: 0 !important; box-shadow: none !important; }
          .not-for-print { display: none !important; }
          .contract-docx-scroll { max-height: none !important; overflow: visible !important; padding: 0 !important; background: white !important; }
          .contract-docx-paper .docx-wrapper { background: white !important; padding: 0 !important; }
          .contract-docx-paper .docx { margin: 0 auto !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}

function FieldGroup({ title, children }) {
  return <section className="space-y-3">
    <h3 className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-800 border border-emerald-100">{title}</h3>
    <div className="grid gap-3 sm:grid-cols-2">{children}</div>
  </section>;
}

function Field({ label, value, onChange, type = 'text', required = false, placeholder, readOnly = false }) {
  const id = `contract-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return <label htmlFor={id} className="block min-w-0 space-y-1.5">
    <span className="text-xs font-semibold text-gray-600">{label}{required ? ' *' : ''}</span>
    <input id={id} type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} readOnly={readOnly} placeholder={placeholder} min={type === 'number' ? '0' : undefined} step={type === 'number' ? '0.01' : undefined} className={`w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20 ${readOnly ? 'cursor-default bg-gray-50' : 'bg-white'}`} />
  </label>;
}

function SelectField({ label, value, onChange, options, required = false }) {
  const id = `contract-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  const availableOptions = value && !options.includes(value) ? [value, ...options] : options;
  return <label htmlFor={id} className="block min-w-0 space-y-1.5">
    <span className="text-xs font-semibold text-gray-600">{label}{required ? ' *' : ''}</span>
    <select id={id} value={value} onChange={(event) => onChange(event.target.value)} required={required} className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20">
      {!value && <option value="" disabled>Selecciona una opción</option>}
      {availableOptions.map((option) => <option key={option} value={option}>{option}</option>)}
    </select>
  </label>;
}

function MoneyField({ label, value, onChange, required = false }) {
  const id = `contract-money-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return <label htmlFor={id} className="block min-w-0 space-y-1.5">
    <span className="text-xs font-semibold text-gray-600">{label}{required ? ' *' : ''}</span>
    <input id={id} type="text" inputMode="numeric" autoComplete="off" value={formatThousands(value)} onChange={(event) => onChange(event.target.value)} required={required} placeholder="120.000.000" className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:border-yellow-400 focus:ring-2 focus:ring-yellow-400/20" />
  </label>;
}

function FileField({ label, file, onChange, required = true, accept = '.pdf,.jpg,.jpeg,.png,application/pdf,image/png,image/jpeg', hint = 'PDF, JPG o PNG · máximo 2 MB' }) {
  const id = `contract-file-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return <label htmlFor={id} className="block min-w-0 space-y-1.5">
    <span className="text-xs font-semibold text-gray-600">{label}{required ? ' *' : ''}</span>
    <input id={id} type="file" accept={accept} required={required} onChange={(event) => onChange(event.target.files?.[0] || null)} className="w-full rounded-lg border border-gray-200 bg-white px-2 py-2 text-xs text-gray-700" />
    <span className="block truncate text-[11px] text-gray-400">{file?.name || 'Sin archivos seleccionados'}</span>
    <span className="block text-[11px] text-gray-400">{hint}</span>
  </label>;
}
