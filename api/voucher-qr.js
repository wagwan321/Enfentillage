// QR code picture (PNG) for a cashback voucher, shown in the voucher email and on the thank-you page.
// It only ever encodes the store's own voucher address with a well-formed code, so it cannot be used to
// make QR codes for anything else. Scanning it opens the voucher on WordPress, where staff accept it (once).
const zlib = require('node:zlib');

const VOUCHER_URL = 'https://enfantillagestore.com/?enfv=';
const codePattern = /^[1-9]\d{0,9}-[A-HJ-NP-Z2-9]{10}$/;

// ---- QR encoder: byte mode, error correction level M, versions 1-10 ----
// [ecc codewords per block, blocks in group 1, data codewords per block in group 1, blocks in group 2, data per block in group 2]
const BLOCKS_M = [null,
  [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0], [24, 2, 43, 0, 0],
  [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39], [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]];
const ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

const EXP = new Uint8Array(512), LOG = new Uint8Array(256);
for (let i = 0, x = 1; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; }
for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
const mul = (a, b) => (a && b ? EXP[LOG[a] + LOG[b]] : 0);

function reedSolomon(data, n) {
  let gen = [1];
  for (let i = 0; i < n; i++) {
    const next = new Array(gen.length + 1).fill(0);
    gen.forEach((g, j) => { next[j] ^= g; next[j + 1] ^= mul(g, EXP[i]); });
    gen = next;
  }
  const rem = new Array(n).fill(0);
  for (const byte of data) {
    const factor = byte ^ rem.shift();
    rem.push(0);
    for (let j = 0; j < n; j++) rem[j] ^= mul(gen[j + 1], factor);
  }
  return rem;
}

function dataCapacity(v) { const b = BLOCKS_M[v]; return b[1] * b[2] + b[3] * b[4]; }

function codewords(bytes, v) {
  const capacity = dataCapacity(v), bits = [];
  const push = (value, length) => { for (let i = length - 1; i >= 0; i--) bits.push((value >>> i) & 1); };
  push(0b0100, 4); push(bytes.length, v < 10 ? 8 : 16);
  for (const b of bytes) push(b, 8);
  push(0, Math.min(4, capacity * 8 - bits.length));
  while (bits.length % 8) bits.push(0);
  const data = [];
  for (let i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
  for (let pad = 0xec; data.length < capacity; pad ^= 0xec ^ 0x11) data.push(pad);
  const [ecc, n1, d1, n2, d2] = BLOCKS_M[v], blocks = [];
  let at = 0;
  for (let i = 0; i < n1 + n2; i++) { const size = i < n1 ? d1 : d2; blocks.push(data.slice(at, at += size)); }
  const eccBlocks = blocks.map(block => reedSolomon(block, ecc));
  const out = [];
  for (let i = 0; i < Math.max(d1, d2); i++) for (const block of blocks) if (i < block.length) out.push(block[i]);
  for (let i = 0; i < ecc; i++) for (const block of eccBlocks) out.push(block[i]);
  return out;
}

function bchBits(value, poly, polyLength, shift) {
  let v = value << shift;
  for (let i = polyLength + shift - 1; i >= shift; i--) if ((v >>> i) & 1) v ^= poly << (i - shift);
  return (value << shift) | v;
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0, (r) => r % 2 === 0, (r, c) => c % 3 === 0, (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0, (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0, (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0];

function build(v, words, maskNo) {
  const size = v * 4 + 17;
  const m = Array.from({ length: size }, () => new Array(size).fill(0));
  const fixed = Array.from({ length: size }, () => new Array(size).fill(false));
  const set = (r, c, dark) => { m[r][c] = dark ? 1 : 0; fixed[r][c] = true; };
  for (const [r0, c0] of [[0, 0], [0, size - 7], [size - 7, 0]]) {
    for (let r = -1; r <= 7; r++) for (let c = -1; c <= 7; c++) {
      const rr = r0 + r, cc = c0 + c;
      if (rr < 0 || cc < 0 || rr >= size || cc >= size) continue;
      const ring = Math.max(Math.abs(r - 3), Math.abs(c - 3));
      set(rr, cc, ring !== 2 && ring !== 4);
    }
  }
  for (const r of ALIGN[v]) for (const c of ALIGN[v]) {
    if (fixed[r][c]) continue;
    for (let dr = -2; dr <= 2; dr++) for (let dc = -2; dc <= 2; dc++) set(r + dr, c + dc, Math.max(Math.abs(dr), Math.abs(dc)) !== 1);
  }
  for (let i = 8; i < size - 8; i++) { set(6, i, i % 2 === 0); set(i, 6, i % 2 === 0); }
  set(size - 8, 8, true);   // the dark module
  // reserve format (and version) areas
  for (let i = 0; i < 9; i++) { if (!fixed[8][i]) set(8, i, 0); if (!fixed[i][8]) set(i, 8, 0); }
  for (let i = 0; i < 8; i++) { set(8, size - 1 - i, 0); if (!fixed[size - 1 - i][8]) set(size - 1 - i, 8, 0); }
  const version = v >= 7 ? bchBits(v, 0x1f25, 12, 12) : 0;
  if (v >= 7) for (let i = 0; i < 18; i++) {
    const bit = (version >>> i) & 1, a = Math.floor(i / 3), b = size - 11 + (i % 3);
    set(a, b, bit); set(b, a, bit);
  }
  // data, in two-column zigzag from the bottom right
  const bits = [];
  for (const w of words) for (let i = 7; i >= 0; i--) bits.push((w >>> i) & 1);
  let k = 0, upward = true;
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5;
    for (let n = 0; n < size; n++) {
      const r = upward ? size - 1 - n : n;
      for (const c of [right, right - 1]) {
        if (fixed[r][c]) continue;
        const bit = k < bits.length ? bits[k++] : 0;
        m[r][c] = bit ^ (MASKS[maskNo](r, c) ? 1 : 0);
      }
    }
    upward = !upward;
  }
  // format information: level M is 00
  const format = bchBits((0b00 << 3) | maskNo, 0x537, 10, 10) ^ 0x5412;
  for (let i = 0; i < 15; i++) {
    const bit = (format >>> i) & 1;
    if (i < 6) m[i][8] = bit; else if (i < 8) m[i + 1][8] = bit; else m[size - 15 + i][8] = bit;
    if (i < 8) m[8][size - 1 - i] = bit; else if (i < 9) m[8][7] = bit; else m[8][14 - i] = bit;
  }
  return m;
}

function penalty(m) {
  const size = m.length;
  let score = 0;
  const lines = [];
  for (let i = 0; i < size; i++) { lines.push(m[i]); lines.push(m.map(row => row[i])); }
  for (const line of lines) {
    let run = 1;
    for (let i = 1; i <= size; i++) {
      if (i < size && line[i] === line[i - 1]) run++;
      else { if (run >= 5) score += run - 2; run = 1; }
    }
    const s = line.join('');
    for (const pattern of ['10111010000', '00001011101']) for (let at = s.indexOf(pattern); at !== -1; at = s.indexOf(pattern, at + 1)) score += 40;
  }
  for (let r = 0; r < size - 1; r++) for (let c = 0; c < size - 1; c++) {
    const v = m[r][c];
    if (v === m[r][c + 1] && v === m[r + 1][c] && v === m[r + 1][c + 1]) score += 3;
  }
  const dark = m.reduce((sum, row) => sum + row.reduce((a, b) => a + b, 0), 0);
  score += Math.floor(Math.abs((dark * 100) / (size * size) - 50) / 5) * 10;
  return score;
}

function qrMatrix(text) {
  const bytes = [...Buffer.from(String(text), 'utf8')];
  let v = 1;
  while (v <= 10 && dataCapacity(v) < bytes.length + (v < 10 ? 2 : 3)) v++;
  if (v > 10) throw new Error('Text too long for a QR code');
  const words = codewords(bytes, v);
  let best = null, bestScore = Infinity;
  for (let mask = 0; mask < 8; mask++) {
    const m = build(v, words, mask), score = penalty(m);
    if (score < bestScore) { best = m; bestScore = score; }
  }
  return best;
}

// ---- PNG (two colours, no external libraries) ----
const CRC = new Uint32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
function crc32(buf) { let c = 0xffffffff; for (const b of buf) c = CRC[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; }
function chunk(type, data) {
  const head = Buffer.alloc(8); head.writeUInt32BE(data.length, 0); head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}
function qrPng(text, scale = 8, quiet = 4) {
  const m = qrMatrix(text), n = m.length, px = (n + quiet * 2) * scale;
  const raw = Buffer.alloc((px + 1) * px);
  for (let y = 0; y < px; y++) {
    raw[y * (px + 1)] = 0;
    const r = Math.floor(y / scale) - quiet;
    for (let x = 0; x < px; x++) {
      const c = Math.floor(x / scale) - quiet;
      raw[y * (px + 1) + 1 + x] = r >= 0 && c >= 0 && r < n && c < n && m[r][c] ? 1 : 0;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(px, 0); ihdr.writeUInt32BE(px, 4); ihdr[8] = 8; ihdr[9] = 3;   // 8-bit, palette
  const palette = Buffer.from([255, 255, 255, 0x1e, 0x24, 0x59]);                   // white, store navy
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('PLTE', palette),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

function voucherUrl(code) {
  if (typeof code !== 'string' || !codePattern.test(code)) throw new Error('Invalid voucher code');
  return VOUCHER_URL + code;
}

function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.setHeader('Allow', 'GET, HEAD'); return res.status(405).end(); }
  let png;
  try { png = qrPng(voucherUrl(req.query?.code)); }
  catch { res.setHeader('Cache-Control', 'no-store'); return res.status(400).end(); }
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Robots-Tag', 'noindex');
  return res.status(200).send(req.method === 'HEAD' ? '' : png);
}

module.exports = handler;
module.exports.qrMatrix = qrMatrix;
module.exports.qrPng = qrPng;
module.exports.voucherUrl = voucherUrl;
module.exports.reedSolomon = reedSolomon;
