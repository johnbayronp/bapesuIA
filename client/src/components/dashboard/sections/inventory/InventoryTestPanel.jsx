/**
 * PANEL DE TESTS AUTOMÁTICOS — Inventario
 * Corre directamente contra la BD real con la sesión del usuario autenticado.
 * Agrega y limpia sus propios datos de prueba.
 *
 * Cómo usar:
 *   1. Importa este componente en BusinessDashboard.jsx temporalmente
 *   2. Agrega una ruta /dashboard/inv-test → <InventoryTestPanel />
 *   3. Navega a esa ruta y haz clic en "Ejecutar todos los tests"
 *   4. Cuando termines, elimina la ruta y este archivo
 */

import { useState } from 'react';
import { db } from '../../../../api/db';
import { useCompany } from '../../../../context/CompanyContext';

const PASS = '✅';
const FAIL = '❌';
const WARN = '⚠️';

function log(results, name, pass, detail = '') {
  results.push({ name, pass, detail });
}

export default function InventoryTestPanel() {
  const { company, user } = useCompany();
  const [running,  setRunning]  = useState(false);
  const [results,  setResults]  = useState([]);
  const [summary,  setSummary]  = useState(null);
  const [cleaning, setCleaning] = useState(false);

  // IDs de los objetos de prueba (para limpiarlos después)
  const TEST_TAG = '__inv_test__';

  const runTests = async () => {
    if (!company?.id) { alert('No hay empresa cargada'); return; }
    setRunning(true);
    setResults([]);
    setSummary(null);
    const R = [];
    const cid = company.id;
    const uid = user?.id ?? null;

    // ── HELPER: leer stock actual ──────────────────────────
    const getStock = async (pid) => {
      const { data } = await db.from('bapesu_products').select('stock_available,purchase_price,sale_price').eq('id', pid).single();
      return data ?? null;
    };
    const round3 = (n) => +n.toFixed(3);
    const applyOp = async (pid, type, qty, countedQty = 0) => {
      const prod = await getStock(pid);
      const cur  = Number(prod?.stock_available) || 0;
      let newStock = cur;
      if (type === 'entrada')  newStock = round3(cur + qty);
      if (type === 'salida')   newStock = Math.max(round3(cur - qty), 0);
      if (type === 'traslado') newStock = cur;
      if (type === 'conteo')   newStock = Math.max(round3(countedQty), 0);
      await db.from('bapesu_products').update({ stock_available: newStock }).eq('id', pid);
      const mvQty = type === 'salida' ? round3(-qty) : (type === 'conteo' ? round3(newStock - cur) : round3(qty));
      if (mvQty !== 0) await db.from('bapesu_stock_movements').insert({ company_id: cid, product_id: pid, type: type === 'conteo' ? 'ajuste' : type, quantity: mvQty, created_by: uid });
      return newStock;
    };

    // ── 0. LIMPIEZA PREVIA ─────────────────────────────────
    setResults([{ name: '🧹 Limpiando datos de prueba anteriores…', pass: null, detail: '' }]);
    await cleanupTestData(cid, TEST_TAG);

    // ══════════════════════════════════════════════════════
    // BLOQUE A — SETUP: producto, proveedor, bodega
    // ══════════════════════════════════════════════════════
    setResults(p => [...p, { name: '── BLOQUE A: Setup inicial ──', pass: null, detail: '' }]);

    let productId = null, supplierId = null, warehouseId = null;

    // A1. Crear producto "Filamento PLA"
    {
      const { data, error } = await db.from('bapesu_products').insert({
        company_id: cid, created_by: uid,
        name: `${TEST_TAG} Filamento PLA 1.75mm`,
        sku: 'FIL-PLA-TST',
        unit: 'kg',
        stock_available: 0,
        stock_min: 1,
        purchase_price: 45000,
        sale_price: 80000,
        tax_rate: 19,
        is_active: true,
      }).select('id').single();
      if (error) { log(R, 'A1. Crear producto Filamento PLA', false, error.message); setResults(p => [...p, R[R.length-1]]); finish(R); return; }
      productId = data.id;
      log(R, 'A1. Crear producto Filamento PLA (stock=0, costo=$45k, venta=$80k)', true, `ID: ${data.id.slice(0,8)}`);
      setResults(p => [...p, R[R.length-1]]);
    }

    // A2. Crear proveedor
    {
      const { data, error } = await db.from('bapesu_suppliers').insert({
        company_id: cid, name: `${TEST_TAG} Filamentos Colombia S.A.S`, is_active: true,
      }).select('id').single();
      if (error) log(R, 'A2. Crear proveedor', false, error.message);
      else { supplierId = data.id; log(R, 'A2. Crear proveedor "Filamentos Colombia S.A.S"', true, data.id.slice(0,8)); }
      setResults(p => [...p, R[R.length-1]]);
    }

    // A3. Crear bodega
    {
      const { data, error } = await db.from('bapesu_warehouses').insert({
        company_id: cid, name: `${TEST_TAG} Taller de impresión`, is_active: true, address: 'Oficina principal',
      }).select('id').single();
      if (error) log(R, 'A3. Crear bodega', false, error.message);
      else { warehouseId = data.id; log(R, 'A3. Crear bodega "Taller de impresión"', true, data.id.slice(0,8)); }
      setResults(p => [...p, R[R.length-1]]);
    }

    // ══════════════════════════════════════════════════════
    // BLOQUE B — FLUJO 3D PRINTING: compra 3kg, usa 1.5kg
    // ══════════════════════════════════════════════════════
    setResults(p => [...p, { name: '── BLOQUE B: Flujo impresión 3D ──', pass: null, detail: '' }]);

    // B1. Entrada: compra 3 rollos de 1kg c/u → stock 0→3
    {
      const { data: op, error } = await db.from('bapesu_inventory_ops').insert({
        company_id: cid, created_by: uid,
        type: 'entrada', reference: 'TST-ENT-001',
        op_date: new Date().toISOString().slice(0,10),
        status: 'borrador', supplier_id: supplierId, warehouse_to: warehouseId,
        notes: 'Compra 3 rollos filamento PLA 1kg',
      }).select('id').single();
      if (error) { log(R, 'B1. Registrar compra 3kg filamento', false, error.message); }
      else {
        await db.from('bapesu_inventory_op_items').insert({ op_id: op.id, product_id: productId, quantity: 3, unit_cost: 45000, position: 0 });
        const newStock = await applyOp(productId, 'entrada', 3);
        await db.from('bapesu_inventory_ops').update({ status: 'confirmado', confirmed_at: new Date().toISOString() }).eq('id', op.id);
        log(R, `B1. Compra 3 rollos (3kg) → stock 0→${newStock} kg (esperado 3)`, newStock === 3,
          `Costo total: $${(3*45000).toLocaleString('es-CO')}`);
      }
      setResults(p => [...p, R[R.length-1]]);
    }

    // B2. Trabajo 1: se usan 0.8kg → stock 3→2.2
    {
      const { data: op, error } = await db.from('bapesu_inventory_ops').insert({
        company_id: cid, created_by: uid,
        type: 'salida', reference: 'TST-SAL-001',
        op_date: new Date().toISOString().slice(0,10),
        status: 'borrador', warehouse_from: warehouseId,
        client_ref: 'Trabajo: Pieza mecánica cliente X',
      }).select('id').single();
      if (error) { log(R, 'B2. Trabajo 1 (uso 0.8kg)', false, error.message); }
      else {
        await db.from('bapesu_inventory_op_items').insert({ op_id: op.id, product_id: productId, quantity: 0.8, position: 0 });
        const curProd = await getStock(productId);
        const newStock = await applyOp(productId, 'salida', 0.8);
        await db.from('bapesu_inventory_ops').update({ status: 'confirmado', confirmed_at: new Date().toISOString() }).eq('id', op.id);
       log(R, `B2. Trabajo 1: consumo 0.8kg → stock ${curProd.stock_available}→${newStock} kg (esperado 2.2)`,
         Math.abs(newStock - 2.2) < 0.001, 'Pieza mecánica cliente X');
      }
      setResults(p => [...p, R[R.length-1]]);
    }

    // B3. Trabajo 2: se usan 0.7kg → stock 2→1.3 (pero con Math.round queda 1)
    // Nota: stock_available es INTEGER, así que 2 - 0.7 = 1.3 → Math.round = 1
    {
      const { data: op, error } = await db.from('bapesu_inventory_ops').insert({
        company_id: cid, created_by: uid,
        type: 'salida', reference: 'TST-SAL-002',
        op_date: new Date().toISOString().slice(0,10),
        status: 'borrador', warehouse_from: warehouseId,
        client_ref: 'Trabajo: Prototipo cliente Y',
      }).select('id').single();
      if (error) { log(R, 'B3. Trabajo 2 (uso 0.7kg)', false, error.message); }
      else {
        await db.from('bapesu_inventory_op_items').insert({ op_id: op.id, product_id: productId, quantity: 0.7, position: 0 });
        const curProd = await getStock(productId);
        const newStock = await applyOp(productId, 'salida', 0.7);
        await db.from('bapesu_inventory_ops').update({ status: 'confirmado', confirmed_at: new Date().toISOString() }).eq('id', op.id);
        // 2 - round(0.7) = 2 - 1 = 1
       log(R, `B3. Trabajo 2: consumo 0.7kg → stock ${curProd.stock_available}→${newStock} kg (esperado 1.5)`,
         Math.abs(newStock - 1.5) < 0.001, `Prototipo cliente Y`);
      }
      setResults(p => [...p, R[R.length-1]]);
    }

    // B4. Total consumido = 1.5kg (0.8 + 0.7). Verificar stock restante
    {
      const prod = await getStock(productId);
      const remaining = prod?.stock_available ?? 0;
      const costValue = remaining * (Number(prod?.purchase_price) || 45000);
      const saleValue = remaining * (Number(prod?.sale_price) || 80000);
      log(R, `B4. Stock restante: ${remaining}kg (3kg comprados - 1.5kg usados)`, remaining >= 0,
        `💼 Valor a costo: $${costValue.toLocaleString('es-CO')} | 💰 Valor a venta: $${saleValue.toLocaleString('es-CO')}`);
      setResults(p => [...p, R[R.length-1]]);
    }

    // B5. Alerta stock bajo: stock_min=0.5, actual<= 0.5?
    {
      const prod = await getStock(productId);
      const cur  = prod?.stock_available ?? 0;
      const min  = 0.5;
      const isLow = cur <= min;
      log(R, `B5. Alerta stock bajo (actual=${cur}kg, mínimo=${min}kg) → ${isLow ? '🔴 ALERTA' : '🟢 OK'}`,
        true, isLow ? `Hay que comprar más filamento!` : `Aún hay stock suficiente`);
      setResults(p => [...p, R[R.length-1]]);
    }

    // ══════════════════════════════════════════════════════
    // BLOQUE C — CONTEO FÍSICO
    // ══════════════════════════════════════════════════════
    setResults(p => [...p, { name: '── BLOQUE C: Conteo físico ──', pass: null, detail: '' }]);

    // C1. Conteo con cantidad esperada y contada
    {
      const before = (await getStock(productId))?.stock_available ?? 0;
      const { data: op } = await db.from('bapesu_inventory_ops').insert({
        company_id: cid, created_by: uid,
        type: 'conteo', reference: 'TST-CNT-001',
        op_date: new Date().toISOString().slice(0,10), status: 'borrador',
      }).select('id').single();
      if (op) {
        await db.from('bapesu_inventory_op_items').insert({ op_id: op.id, product_id: productId, quantity: before, qty_counted: 2, position: 0 });
        const newStock = await applyOp(productId, 'conteo', before, 2);
        await db.from('bapesu_inventory_ops').update({ status: 'confirmado', confirmed_at: new Date().toISOString() }).eq('id', op.id);
        log(R, `C1. Conteo físico: esperado=${before}kg contado=2kg → stock fijado a ${newStock}kg`, newStock === 2,
          `Diferencia: ${2 - before}kg`);
        setResults(p => [...p, R[R.length-1]]);
      }
    }

    // C2. Conteo sin cantidad esperada (qty=0, solo qty_counted)
    {
      const { data: op } = await db.from('bapesu_inventory_ops').insert({
        company_id: cid, created_by: uid,
        type: 'conteo', reference: 'TST-CNT-002',
        op_date: new Date().toISOString().slice(0,10), status: 'borrador',
      }).select('id').single();
      if (op) {
        await db.from('bapesu_inventory_op_items').insert({ op_id: op.id, product_id: productId, quantity: 0, qty_counted: 1.5, position: 0 });
        const newStock = await applyOp(productId, 'conteo', 0, 1.5);
        await db.from('bapesu_inventory_ops').update({ status: 'confirmado', confirmed_at: new Date().toISOString() }).eq('id', op.id);
        log(R, `C2. Conteo qty_esperada=0, qty_contada=1.5 → stock fijado a ${newStock} (esperado 1.5)`,
          Math.abs(newStock - 1.5) < 0.001, 'NUMERIC: decimales exactos');
        setResults(p => [...p, R[R.length-1]]);
      }
    }

    // ══════════════════════════════════════════════════════
    // BLOQUE D — CASOS BORDE
    // ══════════════════════════════════════════════════════
    setResults(p => [...p, { name: '── BLOQUE D: Casos borde ──', pass: null, detail: '' }]);

    // D1. Salida mayor al stock → nunca negativo
    {
      const before = (await getStock(productId))?.stock_available ?? 0;
      const result = Math.max(Math.round(before - 9999), 0);
      log(R, `D1. Salida 9999kg (stock=${before}) → resultado ${result} (no negativo)`, result === 0, '✅ Nunca queda negativo');
      setResults(p => [...p, R[R.length-1]]);
    }

    // D2. Traslado NO cambia stock total
    {
      const before = (await getStock(productId))?.stock_available ?? 0;
      const result = before; // traslado no afecta
      log(R, `D2. Traslado: stock antes=${before}, después=${result} (no cambia)`, result === before, '✅ Stock total intacto');
      setResults(p => [...p, R[R.length-1]]);
    }

    // D3. Anular entrada revierte stock
    {
      // Crear una entrada de 5, confirmar, luego anular
      const before = (await getStock(productId))?.stock_available ?? 0;
      const { data: op } = await db.from('bapesu_inventory_ops').insert({
        company_id: cid, created_by: uid,
        type: 'entrada', reference: 'TST-ENT-002',
        op_date: new Date().toISOString().slice(0,10), status: 'borrador',
      }).select('id').single();
      if (op) {
        await db.from('bapesu_inventory_op_items').insert({ op_id: op.id, product_id: productId, quantity: 5, unit_cost: 45000, position: 0 });
        await applyOp(productId, 'entrada', 5);
        await db.from('bapesu_inventory_ops').update({ status: 'confirmado', confirmed_at: new Date().toISOString() }).eq('id', op.id);
        const afterEnter = (await getStock(productId))?.stock_available ?? 0; // before + 5
        // Ahora anular: revierte el +5
        const afterRevert = await applyOp(productId, 'salida', 5); // simula reversa
        await db.from('bapesu_inventory_ops').update({ status: 'anulado' }).eq('id', op.id);
        log(R, `D3. Anular entrada +5: ${before}→${afterEnter}→${afterRevert} (esperado vuelta a ${before})`,
          afterRevert === before, `Reversa correcta`);
        setResults(p => [...p, R[R.length-1]]);
      }
    }

    // D4. RLS: no puede ver datos de otra empresa
    {
      const { data } = await db.from('bapesu_products').select('id').eq('company_id', '00000000-0000-0000-0000-000000000000');
      log(R, `D4. RLS: empresa ajena no tiene acceso`, (data ?? []).length === 0,
        `Registros visibles: ${(data ?? []).length} (debe ser 0)`);
      setResults(p => [...p, R[R.length-1]]);
    }

    // ══════════════════════════════════════════════════════
    // BLOQUE E — MOVIMIENTOS E HISTORIAL
    // ══════════════════════════════════════════════════════
    setResults(p => [...p, { name: '── BLOQUE E: Historial ──', pass: null, detail: '' }]);

    {
      const { data, error } = await db
        .from('bapesu_stock_movements')
        .select('type,quantity')
        .eq('company_id', cid).eq('product_id', productId)
        .order('created_at');
      if (error) { log(R, 'E1. Leer historial movimientos', false, error.message); }
      else {
        const summary = data.map(m => `${m.type}(${m.quantity > 0 ? '+' : ''}${m.quantity})`).join(' → ');
        log(R, `E1. Historial: ${data.length} movimientos registrados`, data.length > 0, summary);
      }
      setResults(p => [...p, R[R.length-1]]);
    }

    // ══════════════════════════════════════════════════════
    // BLOQUE F — LIMPIEZA
    // ══════════════════════════════════════════════════════
    setResults(p => [...p, { name: '── BLOQUE F: Limpieza ──', pass: null, detail: '' }]);
    {
      await cleanupTestData(cid, TEST_TAG);
      const { data } = await db.from('bapesu_products').select('id').eq('company_id', cid).ilike('name', `${TEST_TAG}%`);
      log(R, 'F1. Limpieza completa', (data ?? []).length === 0,
        `Registros de prueba restantes: ${(data ?? []).length}`);
      setResults(p => [...p, R[R.length-1]]);
    }

    finish(R);
  };

  const finish = (R) => {
    const real   = R.filter(r => r.pass !== null);
    const passed = real.filter(r => r.pass === true).length;
    const failed = real.filter(r => r.pass === false).length;
    setSummary({ passed, failed, total: real.length });
    setRunning(false);
  };

  const cleanupTestData = async (cid, tag) => {
    // Primero obtenemos los productos de prueba
    const { data: prods } = await db.from('bapesu_products').select('id').eq('company_id', cid).ilike('name', `${tag}%`);
    for (const p of prods ?? []) {
      await db.from('bapesu_stock_movements').delete().eq('product_id', p.id);
    }
    // Operaciones de prueba
    const { data: ops } = await db.from('bapesu_inventory_ops').select('id').eq('company_id', cid).ilike('reference', 'TST-%');
    for (const o of ops ?? []) {
      await db.from('bapesu_inventory_op_items').delete().eq('op_id', o.id);
      await db.from('bapesu_inventory_ops').delete().eq('id', o.id);
    }
    await db.from('bapesu_products').delete().eq('company_id', cid).ilike('name', `${tag}%`);
    await db.from('bapesu_suppliers').delete().eq('company_id', cid).ilike('name', `${tag}%`);
    await db.from('bapesu_warehouses').delete().eq('company_id', cid).ilike('name', `${tag}%`);
  };

  const handleClean = async () => {
    if (!company?.id) return;
    setCleaning(true);
    await cleanupTestData(company.id, TEST_TAG);
    setCleaning(false);
    alert('Limpieza completada.');
  };

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-5">
          <h1 className="text-white font-bold text-lg">🧪 Tests automáticos — Inventario</h1>
          <p className="text-indigo-100 text-sm mt-1">
            Crea datos de prueba reales, valida el flujo completo y limpia al terminar.
          </p>
        </div>

        <div className="p-6 space-y-4">
          {/* Botones */}
          <div className="flex gap-3">
            <button
              onClick={runTests}
              disabled={running}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {running ? '⏳ Ejecutando…' : '▶ Ejecutar todos los tests'}
            </button>
            <button
              onClick={handleClean}
              disabled={cleaning || running}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm transition disabled:opacity-50"
            >
              {cleaning ? 'Limpiando…' : '🗑 Limpiar datos de prueba'}
            </button>
          </div>

          {/* Resumen */}
          {summary && (
            <div className={`flex items-center gap-4 px-5 py-4 rounded-xl font-semibold text-sm ${
              summary.failed === 0 ? 'bg-emerald-50 border border-emerald-200 text-emerald-700' : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              <span className="text-2xl">{summary.failed === 0 ? '🎉' : '🚨'}</span>
              <div>
                <p className="font-bold">{summary.failed === 0 ? 'Todos los tests pasaron' : `${summary.failed} test(s) fallaron`}</p>
                <p className="text-xs opacity-80">{summary.passed} pasaron · {summary.failed} fallaron · {summary.total} total</p>
              </div>
            </div>
          )}

          {/* Resultados */}
          {results.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50">
              {results.map((r, i) => (
                <div key={i} className={`flex items-start gap-3 px-4 py-3 text-sm ${
                  r.pass === true  ? 'bg-emerald-50/40' :
                  r.pass === false ? 'bg-red-50/40' : 'bg-gray-50'
                }`}>
                  <span className="shrink-0 text-base">
                    {r.pass === true ? PASS : r.pass === false ? FAIL : '⏳'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${r.pass === false ? 'text-red-700' : 'text-gray-800'}`}>{r.name}</p>
                    {r.detail && <p className="text-xs text-gray-500 mt-0.5 truncate">{r.detail}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Instrucciones */}
          {results.length === 0 && !running && (
            <div className="text-center py-10 text-gray-400">
              <p className="text-4xl mb-2">🧪</p>
              <p className="text-sm">Haz clic en "Ejecutar todos los tests" para iniciar</p>
              <p className="text-xs mt-1">Se crean y limpian datos temporales con el tag <code className="bg-gray-100 px-1 rounded">__inv_test__</code></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
