const inventoryKey = (companyId) => `bapesu:inventory:ui:${companyId}`;
const operationsKey = (companyId) => `bapesu:inventory:ops-ui:${companyId}`;

function read(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function write(key, data) {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}

function remove(key) {
  try {
    sessionStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function readInventoryUi(companyId) {
  if (!companyId) return null;
  return read(inventoryKey(companyId));
}

export function persistInventoryUi(companyId, data) {
  if (!companyId) return;
  const hasOpen = data.productModal || data.categoryModal || data.stockModal;
  if (hasOpen) write(inventoryKey(companyId), data);
  else remove(inventoryKey(companyId));
}

export function readOperationsUi(companyId) {
  if (!companyId) return null;
  return read(operationsKey(companyId));
}

export function persistOperationsUi(companyId, data) {
  if (!companyId) return;
  const hasOpen = data.opModal || data.suppModal || data.whModal;
  if (hasOpen) write(operationsKey(companyId), data);
  else remove(operationsKey(companyId));
}
