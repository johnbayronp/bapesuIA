/**
 * Formatea un número como moneda colombiana (COP)
 * @param {number} amount - Cantidad a formatear
 * @param {boolean} showSymbol - Si mostrar el símbolo de la moneda (default: true)
 * @returns {string} - Cantidad formateada (ej: $1.500,00)
 */
export const formatCurrency = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '$0,00' : '0,00';
  }

  // Convertir a número y redondear a 2 decimales
  const numAmount = parseFloat(amount);
  
  // Formatear con separadores de miles (puntos) y decimales (comas)
  const formatted = numAmount.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  // Si no queremos el símbolo, lo removemos
  if (!showSymbol) {
    return formatted.replace('$', '').trim();
  }

  return formatted;
};

/**
 * Formatea un número como moneda colombiana sin símbolo
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Cantidad formateada sin símbolo (ej: 1.500)
 */
export const formatCurrencyNoSymbol = (amount) => {
  return formatCurrency(amount, false);
};

/**
 * Formatea un número como moneda colombiana con símbolo
 * @param {number} amount - Cantidad a formatear
 * @returns {string} - Cantidad formateada con símbolo (ej: $1.500)
 */
export const formatCurrencyWithSymbol = (amount) => {
  return formatCurrency(amount, true);
};

/**
 * Parsea una cadena de moneda colombiana a número
 * @param {string} currencyString - Cadena formateada (ej: "$1.500" o "1.500")
 * @returns {number} - Número parseado
 */
export const parseCurrency = (currencyString) => {
  if (!currencyString) return 0;
  
  // Remover símbolo de moneda y espacios
  const cleanString = currencyString.replace(/[$,\s]/g, '');
  
  // Convertir a número
  const number = parseFloat(cleanString);
  
  return isNaN(number) ? 0 : number;
}; 