# Solución para el problema de categorías en ProductsManagement.jsx

## Problema identificado
Las categorías no aparecían cuando se editaba o agregaba un producto en el componente `ProductsManagement.jsx`.

## Causas del problema
1. **Categorías no se cargaban en la pestaña de productos**: El `useEffect` solo cargaba categorías cuando `activeTab === 'categories'`, pero también se necesitan para el selector de categorías en el formulario de productos.

2. **Categorías no se cargaban antes de abrir el modal**: Las funciones `handleCreateNew` y `handleEditProduct` no verificaban si las categorías estaban cargadas antes de abrir el modal.

3. **Problema de autenticación**: El endpoint de categorías es público pero el frontend enviaba token de autorización.

4. **URL incorrecta**: La URL del endpoint no incluía `/v1/` en la ruta.

## Cambios realizados

### 1. Carga de categorías en la pestaña de productos
```javascript
// Cargar categorías al montar el componente
useEffect(() => {
  loadCategories();
}, []);

// Cargar productos al montar el componente
useEffect(() => {
  if (activeTab === 'products') {
    loadProducts();
    loadStats();
  } else {
    loadCategories();
  }
}, [currentPage, selectedCategory, searchTerm, activeTab, categorySearchTerm, selectedCategoryStatus, selectedProductStatus]);
```

### 2. Carga de categorías antes de abrir modales
```javascript
const handleCreateNew = async () => {
  setEditingProduct(null);
  resetForm();
  // Asegurar que las categorías estén cargadas antes de abrir el modal
  if (categories.length === 0) {
    await loadCategories();
  }
  setShowModal(true);
};

const handleEditProduct = async (product) => {
  setEditingProduct(product);
  setFormData({
    name: product.name,
    description: product.description || '',
    category: product.category,
    price: product.price.toString(),
    stock: product.stock.toString(),
    image_url: product.image_url || '',
    is_featured: product.is_featured || false,
    status: product.status
  });
  // Asegurar que las categorías estén cargadas antes de abrir el modal
  if (categories.length === 0) {
    await loadCategories();
  }
  setShowModal(true);
};
```

### 3. Remover autenticación del endpoint de categorías
```javascript
const loadCategories = async () => {
  try {
    setCategoriesLoading(true);
    
    let url = `${import.meta.env.VITE_API_URL}/v1/categories`;
    const params = new URLSearchParams();
    
    // Agregar filtros si están activos
    if (categorySearchTerm) {
      params.append('search', categorySearchTerm);
    }
    
    if (selectedCategoryStatus !== 'all') {
      params.append('status', selectedCategoryStatus);
    }
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    console.log('Loading categories from:', url);
    
    // El endpoint de categorías es público, no necesita token
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('Categories response status:', response.status);

    if (response.ok) {
      const data = await response.json();
      console.log('Categories response data:', data);
      
      if (data.success) {
        // Guardar las categorías completas para el modal
        setFullCategories(data.data);
        // Extraer solo los nombres de las categorías para el selector
        const categoryNames = data.data.map(cat => cat.name);
        console.log('Category names extracted:', categoryNames);
        setCategories(categoryNames);
      } else {
        console.error('Categories API returned success: false', data);
      }
    } else {
      console.error('Categories API error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('Error loading categories:', error);
  } finally {
    setCategoriesLoading(false);
  }
};
```

### 4. Corregir URL del endpoint
```javascript
// Antes
let url = `${import.meta.env.VITE_API_URL}/categories`;

// Después
let url = `${import.meta.env.VITE_API_URL}/v1/categories`;
```

## Cómo probar la solución

1. **Iniciar el servidor backend**:
   ```bash
   cd server
   python run.py
   ```

2. **Iniciar el frontend**:
   ```bash
   cd client
   npm run dev
   ```

3. **Probar la funcionalidad**:
   - Ir al panel de administración
   - Navegar a "Gestión de Productos"
   - Hacer clic en "Agregar Producto"
   - Verificar que el selector de categorías muestre las categorías disponibles
   - Editar un producto existente
   - Verificar que el selector de categorías muestre la categoría actual del producto

## Logs de debug agregados
Se agregaron logs de console.log para ayudar a debuggear:
- URL de la petición
- Status de la respuesta
- Datos de la respuesta
- Nombres de categorías extraídos

## Notas adicionales
- El endpoint `/api/v1/categories` es público y no requiere autenticación
- Las categorías se almacenan como nombres de string en la tabla `products`
- La relación entre productos y categorías es por nombre, no por ID 