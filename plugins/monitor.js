import Connection from '../lib/connection.js'
import { cpus as _cpus, totalmem, freemem, arch, homedir, hostname, networkInterfaces, platform, uptime as upt, machine } from 'os'
// import util from 'util'
import { performance } from 'perf_hooks'
import { sizeFormatter } from 'human-readable'
import { start } from 'repl'
import { uptime } from 'process'
let format = sizeFormatter({
  std: 'JEDEC', // 'SI' (default) | 'IEC' | 'JEDEC'
  decimalPlaces: 2,
  keepTrailingZeroes: false,
  render: (literal, symbol) => `${literal} ${symbol}B`,
})
let handler = async (m, { conn }) => {
  m.reply('Started at 9090')
  setInterval(async () => {
  const chats = Object.entries(Connection.store.chats).filter(([id, data]) => id && data.isChats)
  const groupsIn = chats.filter(([id]) => id.endsWith('@g.us')) //groups.filter(v => !v.read_only)
  const used = process.memoryUsage()
  const cpus = _cpus().map(cpu => {
    cpu.total = Object.keys(cpu.times).reduce((last, type) => last + cpu.times[type], 0)
    return cpu
  })
  const cpu = cpus.reduce((last, cpu, _, { length }) => {
    last.total += cpu.total
    last.speed += cpu.speed / length
    last.times.user += cpu.times.user
    last.times.nice += cpu.times.nice
    last.times.sys += cpu.times.sys
    last.times.idle += cpu.times.idle
    last.times.irq += cpu.times.irq
    return last
  }, {
    speed: 0,
    total: 0,
    times: {
      user: 0,
      nice: 0,
      sys: 0,
      idle: 0,
      irq: 0
    }
  })
  // let message = m.reply('Starting..')
  let old = performance.now()
  // await message
  let neww = performance.now()
  let speed = neww - old
  let nodeUse = '' + Object.keys(used).map((key, _, arr) => `${key.padEnd(Math.max(...arr.map(v => v.length)), ' ')}: ${format(used[key])}`).join('\n') + ''
  // m.reply('Succesfully Start Monitor At port 9090')
    let raw = await fetch('http://localhost:9090/data/', {
      method: "POST",
      body: JSON.stringify({
        "speed": speed,
        "groupCh": groupsIn.length,
        "groupJoin": groupsIn.length,
        "groupLeft": groupsIn.length - groupsIn.length,
        "personal": chats.length - groupsIn.length,
        "chat": chats.length,
        "ramTTL": totalmem() ,
        "ramFree": freemem(),
        "ramUsage": totalmem() - freemem(),
        "nodeUse": nodeUse,
        "cpuModel": cpus[0].model.trim(),
        "cpuSpeed": cpu.speed,
        "cpuTimes": cpu.times,
        "cpuTotal": cpu.total,
        "arch": arch(),
        "homeDir": homedir(),
        "hostName": hostname(),
        "network": networkInterfaces(),
        "platform": platform(),
        "upTime": upt(),
        "machine": machine()
      }),
      headers: {"Content-type": "application/json; charset=UTF-8"}
    })
  }, 2500);
}

handler.help = ['mnt', 'monitor']
handler.tags = ['owner']
handler.owner = true

handler.command = /^(monitor|mnt)$/i

export default handler