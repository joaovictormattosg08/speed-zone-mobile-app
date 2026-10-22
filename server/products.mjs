const seeds = [
  ['SZ-TUR-660-TS', 'Turbocompressor Billet Garrett G25-660 Twin Scroll T4 .82 A/R', 7890, 'Turbo'],
  ['SZ-TUR-042', 'Turbocompressor Garrett GT2871R Ball Bearing', 4850, 'Turbo'],
  ['SZ-INT-108', 'Kit Intercooler Frontal Alumínio Billet Racing', 2390, 'Cooling'],
  ['SZ-ELT-220', 'Bobinas de Ignição R8 Red Edition (4 un)', 799, 'Eletrônica'],
  ['SZ-BRK-512', 'Kit Freios Big Brake 6 Pistões 355mm', 6200, 'Freios'],
  ['SZ-ACC-015', 'Mangote Pressurização 3"', 145, 'Admissão'],
];
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
export function setupProducts(db) {
  db.exec('CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, payload TEXT NOT NULL)');
  for (const [id, name, price, category] of seeds) db.prepare('INSERT OR IGNORE INTO products VALUES (?, ?)').run(id, JSON.stringify({ id, name, price, category, stock: 5, minimum: 3, cost: 0, published: true, images: [], stage: 'STAGE 2+', subcategory: '', platforms: [], power: '', diameter: '', material: '', description: '', revision: 1 }));
}
export function listProducts(db, admin = false) {
  return db.prepare('SELECT payload FROM products ORDER BY id').all().map(row => JSON.parse(row.payload)).filter(p => !p.archived && (admin || p.published)).map(p => { if (admin) return p; const { cost, ...publicProduct } = p; return publicProduct; });
}
export function saveProduct(db, body, id) {
  const previous = id && db.prepare('SELECT payload FROM products WHERE id = ?').get(id);
  if (id && !previous) fail('Produto não encontrado.', 404);
  const old = previous ? JSON.parse(previous.payload) : null;
  if (old && body.revision !== old.revision) fail('Este produto foi alterado. Reabra o cadastro antes de salvar.', 409);
  if (old && body.archived === true) {
    const product = { ...old, archived: true, published: false, revision: old.revision + 1 };
    db.prepare('UPDATE products SET payload = ? WHERE id = ?').run(JSON.stringify(product), id); return product;
  }
  const product = { id: id || body.id, revision: (old?.revision || 0) + 1 };
  if (typeof product.id !== 'string' || !/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(product.id)) fail('SKU: use de 3 a 40 letras maiúsculas, números e hífens.');
  for (const key of ['name', 'category', 'subcategory', 'stage', 'power', 'diameter', 'material', 'description']) {
    if (typeof body[key] !== 'string' || body[key].length > (key === 'description' ? 3000 : 200)) fail('Confira os campos do produto.');
    product[key] = body[key].trim();
  }
  if (product.name.length < 3 || !product.category) fail('Informe o nome e a categoria.');
  for (const key of ['price', 'cost', 'stock', 'minimum']) {
    const value = body[key];
    if (!Number.isFinite(value) || value < 0 || value > 10000000 || (['stock','minimum'].includes(key) && !Number.isInteger(value))) fail('Preço, custo e estoque devem ser valores válidos.');
    product[key] = value;
  }
  if (product.price <= 0) fail('O preço deve ser maior que zero.');
  if (typeof body.published !== 'boolean') fail('Publicação inválida.');
  if (!Array.isArray(body.platforms) || body.platforms.length > 20 || body.platforms.some(p => typeof p !== 'string' || p.length > 100)) fail('Aplicações inválidas.');
  if (!Array.isArray(body.images) || body.images.length > 5 || body.images.some(image => typeof image !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/]+=*$/.test(image)) || body.images.join('').length > 6500000) fail('Envie até 5 imagens JPG, PNG ou WebP, total de até 4,8 MB.');
  if (!old && !body.images.length) fail('Adicione uma foto principal.');
  Object.assign(product, { platforms: body.platforms, images: body.images, published: body.published });
  try {
    if (old) db.prepare('UPDATE products SET payload = ? WHERE id = ?').run(JSON.stringify(product), id);
    else db.prepare('INSERT INTO products VALUES (?, ?)').run(product.id, JSON.stringify(product));
  } catch (error) { if (String(error).includes('UNIQUE')) fail('Este SKU já está cadastrado.', 409); throw error; }
  return product;
}
// Called within the order transaction so stock and the order commit together.
export function moveStock(db, items, direction) {
  for (const item of items) {
    const row = db.prepare('SELECT payload FROM products WHERE id = ?').get(item.id);
    if (!row) fail('Produto não encontrado.');
    const product = JSON.parse(row.payload);
    if (direction < 0 && (!product.published || product.archived || product.stock < item.quantity)) fail('Estoque insuficiente para ' + product.name);
    product.stock += direction * item.quantity;
    product.revision += 1;
    db.prepare('UPDATE products SET payload = ? WHERE id = ?').run(JSON.stringify(product), item.id);
  }
}
