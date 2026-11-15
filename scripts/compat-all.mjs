#!/usr/bin/env node
/**
 * 跑一遍本仓库 plugins/ 下所有插件仓库的宿主接口检查，给出总表。
 *
 * 探针（scripts/compat-probe.mjs）留在各插件仓库里，跟着那个仓库的版本走；
 * 这里只负责发现、逐个跑、汇总、给一个退出码。
 *
 * 发现规则：
 *   1. `git submodule status` 登记的路径——没 init 的子模块会以 MISSING 出现，
 *      而不是静默消失（静默跳过等于假装通过）。
 *   2. plugins/ 下任何带 scripts/compat-probe.mjs 的目录——兼容直接拷贝进来的仓库。
 *   3. `--also <路径>` 补上还没挂成子模块的本地仓库。
 *
 * 退出码取最严重者：30（无法判定）> 20（会被拒载）> 10（接口变了）> 0。
 *
 * 用法：
 *
 *   node scripts/compat-all.mjs                 人类可读总表
 *   node scripts/compat-all.mjs --json          机器可读
 *   node scripts/compat-all.mjs --quiet         只在有仓库需要处理时输出
 *   node scripts/compat-all.mjs --also ..\dsh-taskoutsource
 *   node scripts/compat-all.mjs --roots <目录>   换一个插件目录
 */
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.dirname(HERE)

/** 结论到严重度，用来在多仓库之间取最严重的那个。 */
const SEVERITY = { UNCHANGED: 0, 'NO-BASELINE': 1, DRIFT: 2, 'OUT-OF-RANGE': 3, UNVERIFIABLE: 4, MISSING: 4 }

const argv = process.argv.slice(2)
const asJson = argv.includes('--json')
const quiet = argv.includes('--quiet')

function takeArg(name) {
  const values = []
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === name && argv[i + 1] !== undefined) values.push(argv[i + 1])
  }
  return values
}

const pluginsRoot = path.resolve(REPO_ROOT, takeArg('--roots')[0] ?? 'plugins')
const extraDirs = takeArg('--also').map((value) => path.resolve(REPO_ROOT, value))

/** 子模块登记表；拿不到 git 就当没有（退回目录发现）。 */
function declaredSubmodules() {
  const run = spawnSync('git', ['-C', REPO_ROOT, 'submodule', 'status'], { encoding: 'utf8' })
  if (run.status !== 0 || typeof run.stdout !== 'string') return []
  return run.stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-+U ]?[0-9a-f]+ /, '').split(' ')[0])
}

function readdirDirs(dir) {
  try {
    return fs
      .readdirSync(dir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
  } catch {
    return []
  }
}

/** name -> 绝对目录。同一个目录只收一次。 */
const targets = new Map()
function addTarget(name, dir) {
  const resolved = path.resolve(dir)
  if ([...targets.values()].includes(resolved)) return
  targets.set(name, resolved)
}

for (const sub of declaredSubmodules()) {
  const relative = path.relative(pluginsRoot, path.resolve(REPO_ROOT, sub))
  if (relative.startsWith('..') || path.isAbsolute(relative)) continue
  addTarget(path.basename(sub), path.resolve(REPO_ROOT, sub))
}

for (const name of readdirDirs(pluginsRoot)) {
  const dir = path.join(pluginsRoot, name)
  if (fs.existsSync(path.join(dir, 'scripts', 'compat-probe.mjs'))) addTarget(name, dir)
}

for (const dir of extraDirs) addTarget(path.basename(dir), dir)

function probe(name, dir) {
  const script = path.join(dir, 'scripts', 'compat-probe.mjs')
  if (!fs.existsSync(script)) {
    return { repo: name, path: dir, verdict: 'MISSING', exitCode: 30, summary: '没有 compat-probe.mjs（子模块没 init？）' }
  }

  const run = spawnSync(process.execPath, [script, '--json'], {
    cwd: dir,
    encoding: 'utf8',
    timeout: 180_000,
  })
  const exitCode = run.status ?? 30
  let parsed
  try {
    parsed = JSON.parse(run.stdout)
  } catch {
    return {
      repo: name,
      path: dir,
      verdict: 'UNVERIFIABLE',
      exitCode,
      summary: `探针没有输出可解析的结果（exit=${exitCode}）`,
    }
  }

  const summary =
    parsed.verdict === 'UNVERIFIED' || parsed.verdict === 'UNVERIFIABLE'
      ? (parsed.reason ?? '无法判定')
      : parsed.verdict === 'OUT-OF-RANGE'
        ? Object.entries(parsed.range?.unmet ?? {})
            .map(([pkg, range]) => `${pkg} 要求 ${range}`)
            .join('；')
        : parsed.verdict === 'DRIFT'
          ? parsed.changes.join('；')
          : parsed.runtime?.version !== undefined
            ? `宿主 ${parsed.runtime.version}`
            : ''

  return {
    repo: name,
    path: dir,
    verdict: parsed.verdict ?? 'UNVERIFIABLE',
    exitCode,
    runtime: parsed.runtime?.version,
    baseline: parsed.baseline?.runtime,
    summary,
    versionOnly: parsed.versionOnly?.length ?? 0,
    changes: parsed.changes ?? [],
  }
}

const results = [...targets.entries()]
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([name, dir]) => probe(name, dir))

const worst = results.reduce((acc, item) => Math.max(acc, SEVERITY[item.verdict] ?? 4), 0)
const needsAttention = results.filter((item) => item.verdict !== 'UNCHANGED')

if (asJson) {
  process.stdout.write(`${JSON.stringify({ root: pluginsRoot, worst, results }, null, 2)}\n`)
} else if (quiet && needsAttention.length === 0) {
  const runtime = results.find((item) => item.runtime !== undefined)?.runtime ?? '未知'
  process.stdout.write(`全部正常（宿主 ${runtime}，${results.length} 个插件仓库接口未变）\n`)
} else {
  console.log(`检查目录  ${pluginsRoot}`)
  console.log('')
  for (const item of results) {
    const badge = item.verdict.padEnd(14)
    console.log(`${badge} ${item.repo}`)
    if (item.summary.length > 0) console.log(`               ${item.summary}`)
    if (item.versionOnly > 0 && item.verdict === 'UNCHANGED') {
      console.log(`               （宿主 ${item.baseline} → ${item.runtime}，${item.versionOnly} 个包版本号变了，接口未变）`)
    }
  }
  console.log('')
  console.log(
    needsAttention.length === 0
      ? `结论：${results.length} 个仓库都不需要适配。`
      : `结论：${needsAttention.map((item) => item.repo).join('、')} 需要处理。`,
  )
}

const exitCode =
  worst >= SEVERITY.UNVERIFIABLE ? 30 : worst === SEVERITY['OUT-OF-RANGE'] ? 20 : worst >= SEVERITY.DRIFT ? 10 : 0
process.exitCode = exitCode
