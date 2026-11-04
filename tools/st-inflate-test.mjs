/**
 * SillyTavern 导入「兼容层」单测
 *
 * 背景：网页版导入一直正常，但安卓 APK（老机型自带 WebView，Chromium < 76/80）导入无反应。
 * 原因是原实现用了 Blob.arrayBuffer() / Blob.text()（Chromium 76+）与 DecompressionStream（Chromium 80+）。
 *
 * 这里用 vm 造一个「老 WebView」沙箱：不提供 DecompressionStream / TextDecoder，
 * 直接跑 app_archive.js 里的解压器、PNG 解析与文件读取兜底，确保低版本 WebView 也能导入。
 *
 * 用法：node tools/st-inflate-test.mjs
 */
import fs from 'node:fs';
import vm from 'node:vm';
import zlib from 'node:zlib';
import assert from 'node:assert/strict';

const ASSETS = 'd:/a叙事诗/Poemnarapk-main/app/src/main/assets';
const code = fs.readFileSync(ASSETS + '/app_archive.js', 'utf8');

// ---------- 极简 FileReader（模拟 WebView 的 FileReader，只实现被测的两个方法） ----------
class StubFileReader {
  readAsArrayBuffer(file) {
    setTimeout(() => {
      const b = file._bytes;
      this.result = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
      if (this.onload) this.onload();
    }, 0);
  }
  readAsText(file) {
    setTimeout(() => {
      this.result = file._bytes.toString('utf8');
      if (this.onload) this.onload();
    }, 0);
  }
}

// 老 Android WebView 的 File：有 name/type/size，但没有 arrayBuffer()/text()
class LegacyFile {
  constructor(name, type, bytes) {
    this.name = name;
    this.type = type;
    this._bytes = bytes;
    this.size = bytes.length;
  }
}

// 新 WebView 的 File：带 arrayBuffer()/text()
class ModernFile extends LegacyFile {
  arrayBuffer() {
    const b = this._bytes;
    return Promise.resolve(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
  }
  text() { return Promise.resolve(this._bytes.toString('utf8')); }
}

function makeSandbox({ modern }) {
  const sb = {
    console,
    setTimeout,
    clearTimeout,
    alert: () => {},
    window: {},
    navigator: { userAgent: modern ? 'modern' : 'legacy-webview' },
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL() {} },
    // 老/新 WebView 都有 atob/btoa（base64 解卡必需），vm 沙箱默认没有，这里补上
    atob: (s) => atob(s),
    btoa: (s) => btoa(s),
    FileReader: StubFileReader,
    // DOM 占位：本测试只关心纯逻辑函数，页面元素一律返回 null
    document: {
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener() {},
      createElement: () => ({
        style: {}, dataset: {}, classList: { add() {}, remove() {} },
        appendChild() {}, setAttribute() {}, addEventListener() {}
      }),
      body: { appendChild() {} }
    }
  };
  if (modern) {
    sb.TextDecoder = TextDecoder;
    sb.TextEncoder = TextEncoder;
    sb.DecompressionStream = DecompressionStream;
    sb.Blob = Blob;
    sb.Response = Response;
  }
  return vm.createContext(sb);
}

function load(sandbox) {
  vm.runInContext(code, sandbox, { filename: 'app_archive.js' });
  return sandbox;
}

// 老 WebView 沙箱：没有 DecompressionStream / TextDecoder —— 正是出问题的那套环境
const legacy = load(makeSandbox({ modern: false }));

// ---------- 测试驱动 ----------
let pass = 0;
const failures = [];
function check(name, fn) {
  try {
    fn();
    pass++;
    console.log('  ok   ' + name);
  } catch (e) {
    failures.push(name + ' -> ' + (e && e.message));
    console.log('  FAIL ' + name + ' -> ' + (e && e.message));
  }
}
async function checkAsync(name, fn) {
  try {
    await fn();
    pass++;
    console.log('  ok   ' + name);
  } catch (e) {
    failures.push(name + ' -> ' + (e && e.message));
    console.log('  FAIL ' + name + ' -> ' + (e && e.message));
  }
}
const toBuf = (u8) => Buffer.from(Uint8Array.prototype.slice.call(u8));

// ---------- PNG 构造工具 ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function buildPng(extraChunks) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(2, 0);
  ihdr.writeUInt32BE(2, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    ...extraChunks,
    chunk('IDAT', zlib.deflateSync(Buffer.alloc((2 * 4 + 1) * 2))),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const cardJson = {
  spec: 'chara_card_v2',
  spec_version: '2.0',
  data: {
    name: '兼容测试角色',
    description: '一段用于回归测试的中文人设。',
    tags: ['测试'],
    character_book: {
      entries: [
        { keys: ['测试'], content: '一条世界书设定。', enabled: true, comment: '条目一' }
      ]
    }
  }
};
const cardB64 = Buffer.from(JSON.stringify(cardJson), 'utf8').toString('base64');

// ---------- 1. 环境自检：确认沙箱确实是「老 WebView」 ----------
console.log('\n[1] 沙箱环境自检');
check('老 WebView 沙箱里没有 DecompressionStream', () => {
  assert.equal(typeof legacy.DecompressionStream, 'undefined');
});
check('老 WebView 沙箱里没有 TextDecoder', () => {
  assert.equal(typeof legacy.TextDecoder, 'undefined');
});
check('app_archive.js 能在老 WebView 沙箱里完整求值（函数已导出）', () => {
  for (const fn of ['stInflateZlib', 'stInflateRaw', 'stInflateDeflate', 'stExtractFromPng',
                    'stReadFileAsArrayBuffer', 'stDecodeUtf8Text', 'stLooksLikePng', 'stBuildImportDraft']) {
    assert.equal(typeof legacy[fn], 'function', fn + ' 缺失');
  }
});

// ---------- 2. 内置 DEFLATE 解压 ----------
console.log('\n[2] 内置 DEFLATE 解压（老 WebView 没有 DecompressionStream）');
const payloads = [
  ['空数据', Buffer.alloc(0)],
  ['单字节', Buffer.from('a')],
  ['高重复文本', Buffer.from('hello world '.repeat(2000))],
  ['中文 JSON', Buffer.from(JSON.stringify(cardJson), 'utf8')],
  ['200KB 伪随机字节', Buffer.from(Array.from({ length: 200000 }, (_, i) => (i * 1103515245 + 12345) % 256))]
];
const strategies = [
  ['level 0（stored 块）', { level: 0 }],
  ['level 1', { level: 1 }],
  ['level 9', { level: 9 }],
  ['Z_FIXED（固定 Huffman 表）', { strategy: zlib.constants.Z_FIXED }],
  ['Z_HUFFMAN_ONLY', { strategy: zlib.constants.Z_HUFFMAN_ONLY }],
  ['Z_RLE', { strategy: zlib.constants.Z_RLE }]
];
for (const [pname, payload] of payloads) {
  for (const [sname, opts] of strategies) {
    check(`${pname} / ${sname}`, () => {
      const packed = zlib.deflateSync(payload, opts);
      const out = toBuf(legacy.stInflateZlib(new Uint8Array(packed)));
      assert.ok(out.equals(payload), `解压结果不一致（原 ${payload.length}B → 得到 ${out.length}B）`);
    });
  }
}
check('raw deflate（无 zlib 头）也能解', () => {
  const payload = Buffer.from('raw deflate payload 中文 ' + 'x'.repeat(500));
  const packed = zlib.deflateRawSync(payload);
  const out = toBuf(legacy.stInflateZlib(new Uint8Array(packed)));
  assert.ok(out.equals(payload));
});
check('截断数据会抛出可读错误（而不是静默失败）', () => {
  const packed = zlib.deflateSync(Buffer.from('中文测试'.repeat(500)));
  assert.throws(() => legacy.stInflateZlib(new Uint8Array(packed.subarray(0, 20))), /压缩数据|不完整|损坏/);
});

// ---------- 3. stInflateDeflate 在无 DecompressionStream 时的异步兜底 ----------
console.log('\n[3] stInflateDeflate 兜底');
await checkAsync('无 DecompressionStream 时返回正确结果', async () => {
  const payload = Buffer.from(JSON.stringify(cardJson), 'utf8');
  const out = toBuf(await legacy.stInflateDeflate(new Uint8Array(zlib.deflateSync(payload))));
  assert.ok(out.equals(payload));
});

// ---------- 4. PNG 角色卡解析（tEXt / zTXt / iTXt 压缩块全覆盖） ----------
console.log('\n[4] PNG 角色卡解析');
const pngCases = {
  'tEXt（未压缩，ST 现用格式）': buildPng([
    chunk('tEXt', Buffer.concat([Buffer.from('chara', 'latin1'), Buffer.from([0]), Buffer.from(cardB64, 'latin1')]))
  ]),
  'zTXt（zlib 压缩）': buildPng([
    chunk('zTXt', Buffer.concat([
      Buffer.from('chara', 'latin1'), Buffer.from([0, 0]),
      zlib.deflateSync(Buffer.from(cardB64, 'latin1'))
    ]))
  ]),
  'iTXt（未压缩）': buildPng([
    chunk('iTXt', Buffer.concat([
      Buffer.from('chara', 'latin1'), Buffer.from([0, 0, 0]),
      Buffer.from([0]), Buffer.from([0]),
      Buffer.from(cardB64, 'latin1')
    ]))
  ]),
  'iTXt（压缩标记=1）': buildPng([
    chunk('iTXt', Buffer.concat([
      Buffer.from('chara', 'latin1'), Buffer.from([0, 1, 0]),
      Buffer.from([0]), Buffer.from([0]),
      zlib.deflateSync(Buffer.from(cardB64, 'latin1'))
    ]))
  ])
};
for (const [label, png] of Object.entries(pngCases)) {
  await checkAsync(`解析 ${label}`, async () => {
    const raw = await legacy.stExtractFromPng(new Uint8Array(png));
    assert.equal(raw.data.name, '兼容测试角色');
    assert.equal(raw.data.character_book.entries.length, 1);
  });
}
await checkAsync('传入 ArrayBuffer 也能解析（FileReader 回传的就是 ArrayBuffer）', async () => {
  const png = pngCases['zTXt（zlib 压缩）'];
  const ab = png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength);
  const raw = await legacy.stExtractFromPng(ab);
  assert.equal(raw.data.name, '兼容测试角色');
});

// ---------- 5. 文件读取兜底（老 WebView 没有 Blob.arrayBuffer） ----------
console.log('\n[5] 文件读取兜底');
const plainPng = pngCases['tEXt（未压缩，ST 现用格式）'];
await checkAsync('老 WebView（无 File.arrayBuffer）走 FileReader 读取 PNG 字节', async () => {
  const file = new LegacyFile('card.png', 'image/png', plainPng);
  assert.equal(typeof file.arrayBuffer, 'undefined');
  const bytes = await legacy.stReadFileAsArrayBuffer(file);
  assert.equal(bytes.byteLength, plainPng.length);
  const raw = await legacy.stExtractFromPng(bytes);
  assert.equal(raw.data.name, '兼容测试角色');
});
await checkAsync('新 WebView（有 File.arrayBuffer）也正常', async () => {
  const file = new ModernFile('card.png', 'image/png', plainPng);
  const bytes = await legacy.stReadFileAsArrayBuffer(file);
  assert.equal(bytes.byteLength, plainPng.length);
});
await checkAsync('file.arrayBuffer() 抛错时自动回退 FileReader', async () => {
  class BrokenFile extends LegacyFile {
    arrayBuffer() { return Promise.reject(new Error('NotReadableError')); }
  }
  const bytes = await legacy.stReadFileAsArrayBuffer(new BrokenFile('card.png', 'image/png', plainPng));
  assert.equal(bytes.byteLength, plainPng.length);
});

// ---------- 6. 文件类型识别与整体草稿构建 ----------
console.log('\n[6] 文件类型识别 / 草稿构建');
check('PNG 文件头识别（安卓文件管理器可能不给 type/后缀）', () => {
  assert.equal(legacy.stLooksLikePng(new Uint8Array(plainPng)), true);
  assert.equal(legacy.stLooksLikePng(new Uint8Array(Buffer.from('{"name":"x"}'))), false);
});
await checkAsync('文件名没有后缀也能按文件头识别并导入', async () => {
  const draft = await legacy.stBuildImportDraft([new LegacyFile('角色卡', '', plainPng)]);
  assert.equal(draft.cards.length, 1);
  assert.equal(draft.cards[0].card.name, '兼容测试角色');
});
await checkAsync('UTF-8 JSON 文件（bytes → 文本，不依赖 File.text）', async () => {
  const json = Buffer.from(JSON.stringify(cardJson), 'utf8');
  const draft = await legacy.stBuildImportDraft([new LegacyFile('card.json', 'application/json', json)]);
  assert.equal(draft.cards[0].card.name, '兼容测试角色');
  assert.equal(draft.allEntries, 1);
});
await checkAsync('带 BOM 的 JSON 也能导入', async () => {
  const json = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(JSON.stringify(cardJson), 'utf8')]);
  const draft = await legacy.stBuildImportDraft([new LegacyFile('card.json', '', json)]);
  assert.equal(draft.cards[0].card.name, '兼容测试角色');
});
await checkAsync('损坏文件给出明确中文错误', async () => {
  await assert.rejects(
    legacy.stBuildImportDraft([new LegacyFile('broken.png', 'image/png', Buffer.from('not a png at all'))]),
    /PNG/
  );
});

// ---------- 7. 现代环境（有 DecompressionStream）同样可用 ----------
console.log('\n[7] 现代 WebView 环境');
if (typeof DecompressionStream === 'function') {
  const modern = load(makeSandbox({ modern: true }));
  await checkAsync('有 DecompressionStream 时走原生解压', async () => {
    const payload = Buffer.from(JSON.stringify(cardJson), 'utf8');
    const out = toBuf(await modern.stInflateDeflate(new Uint8Array(zlib.deflateSync(payload))));
    assert.ok(out.equals(payload));
  });
  await checkAsync('现代环境解析 zTXt 卡片', async () => {
    const raw = await modern.stExtractFromPng(new Uint8Array(pngCases['zTXt（zlib 压缩）']));
    assert.equal(raw.data.name, '兼容测试角色');
  });
} else {
  console.log('  skip 当前 Node 没有 DecompressionStream');
}

// ---------- 汇总 ----------
console.log('\n============================');
console.log(`通过 ${pass} 项，失败 ${failures.length} 项`);
if (failures.length) {
  failures.forEach((f) => console.log('  - ' + f));
  process.exit(1);
}
console.log('ST 导入兼容层全部通过 ✅');
process.exit(0);


