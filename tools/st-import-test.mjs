/**
 * SillyTavern 角色卡导入回归测试
 * 本地静态服务器 + 无头 Edge(CDP)：真实走一遍 <input type="file"> → 解析 → 预览 → 落库
 * 用法：node tools/st-import-test.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { CDP, getPageWs, server, edge, sleep, PORT } from './qt-repro/lib.mjs';

const OUT = 'd:/a叙事诗/tools/st-import-test';
fs.mkdirSync(OUT, { recursive: true });

// ---------- 造一张最小可用的 SillyTavern PNG 角色卡 ----------
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(zlib.crc32(body) >>> 0, 0);
  return Buffer.concat([len, body, crc]);
}

const cardJson = {
  spec: 'chara_card_v2',
  spec_version: '2.0',
  data: {
    name: '测试角色',
    description: '一个用于回归测试的角色。',
    personality: '温和',
    scenario: '测试场景',
    first_mes: '你好呀。',
    creator: 'tester',
    tags: ['测试'],
    character_book: {
      entries: [
        {
          keys: ['测试', 'test'],
          secondary_keys: [],
          content: '这是一条世界书设定。',
          enabled: true,
          constant: false,
          comment: '测试条目',
          position: 'before_char',
          extensions: { probability: 80, useProbability: true, depth: 4 }
        }
      ]
    }
  }
};

function buildPngCard(obj) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(2, 0); // width
  ihdr.writeUInt32BE(2, 4); // height
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // RGBA
  const raw = Buffer.alloc((2 * 4 + 1) * 2); // 每行 filter byte + 2px RGBA
  const idat = zlib.deflateSync(raw);
  const b64 = Buffer.from(JSON.stringify(obj), 'utf8').toString('base64');
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('tEXt', Buffer.concat([Buffer.from('chara', 'latin1'), Buffer.from([0]), Buffer.from(b64, 'latin1')])),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
}

const pngPath = path.join(OUT, 'test-card.png');
fs.writeFileSync(pngPath, buildPngCard(cardJson));

const jsonPath = path.join(OUT, 'test-card.json');
fs.writeFileSync(jsonPath, JSON.stringify(cardJson, null, 2));

// ---------- 启动页面 ----------
const cdp = new CDP(await getPageWs());
await cdp.send('Runtime.enable');
await cdp.send('Log.enable');
await cdp.send('DOM.enable');
await cdp.send('Page.enable');
await cdp.send('Page.navigate', { url: `http://127.0.0.1:${PORT}/index.html` });
await sleep(5000);

const env = await cdp.eval(
  `({ dexie: typeof Dexie, openApp: typeof openApp, initArchiveApp: typeof initArchiveApp, btn: !!document.getElementById('btn-archive-st-import'), input: !!document.getElementById('file-archive-st-import') })`
);
console.log('环境:', env);

await cdp.eval(`(typeof openApp === 'function') ? openApp('archive') : initArchiveApp()`);
await sleep(1200);

async function getNodeId(selector) {
  const doc = await cdp.send('DOM.getDocument', { depth: -1 });
  const res = await cdp.send('DOM.querySelector', { nodeId: doc.root.nodeId, selector });
  return res.nodeId;
}

async function tryImport(filePath, label) {
  console.log(`\n===== ${label} =====`);
  const nodeId = await getNodeId('#file-archive-st-import');
  console.log('input nodeId =', nodeId);
  await cdp.send('DOM.setFileInputFiles', { files: [filePath], nodeId });
  await sleep(2500);
  const state = await cdp.eval(
    `({
      overlayClass: document.getElementById('st-import-overlay').className,
      stats: document.getElementById('st-import-stats').innerText,
      entryRows: document.getElementById('st-import-entry-list').children.length,
      groupValue: document.getElementById('st-import-group').value,
      filesCount: document.getElementById('file-archive-st-import').files.length,
      draftCards: (typeof stImportDraft !== 'undefined' && stImportDraft) ? stImportDraft.cards.length : null
    })`
  );
  console.log('预览状态:', state);

  await cdp.eval(`document.getElementById('btn-confirm-st-import').click()`);
  await sleep(1500);
  const after = await cdp.eval(
    `(async () => ({
      archives: await db.archives.count(),
      entries: await db.world_book_entries.count(),
      lastArchive: await db.archives.reverse().first(),
      lastEntry: await db.world_book_entries.reverse().first()
    }))()`,
    true
  );
  console.log('落库后:', JSON.stringify(after).slice(0, 900));
}

await tryImport(jsonPath, '导入 JSON 角色卡');
await tryImport(pngPath, '导入 PNG 角色卡');

console.log('\n===== 控制台日志 =====');
console.log(cdp.logs.slice(-40).join('\n'));
console.log('\n===== 页面异常 =====');
console.log(cdp.errors.slice(-20).join('\n') || '(无)');

cdp.close();
try { edge.kill(); } catch (e) {}
try { server.close(); } catch (e) {}
process.exit(0);
