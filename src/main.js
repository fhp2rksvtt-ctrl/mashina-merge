import Matter from 'matter-js'
import './style.css'

const { Engine, Render, Runner, Bodies, Body, Composite, Events } = Matter

// O'yin maydoni o'lchami (telefon ekraniga o'xshash tik to'rtburchak)
const ENI = 400
const BOYI = 600
const DEVOR = 20
const TASHLASH_Y = 60 // qo'ldagi doira turadigan balandlik
const KUTISH = 500 // tashlagandan keyin yangisi chiqquncha kutish (ms)
const CHIZIQ_Y = 110 // qizil chiziq: doiralar bundan yuqorida uzoq tursa o'yin tugaydi
const CHIZIQ_VAQTI = 2000 // chiziqdan yuqorida necha ms tursa yutqaziladi

// Mashina darajalari: nomi, doira o'lchami, rangi va kuzov shakli
const darajalar = [
  { nom: 'Tico', radius: 16, rang: '#f2c14e', shakl: 'xetchbek' },
  { nom: 'Matiz', radius: 22, rang: '#e76f51', shakl: 'xetchbek' },
  { nom: 'Damas', radius: 28, rang: '#2a9d8f', shakl: 'furgon' },
  { nom: 'Spark', radius: 34, rang: '#8ab4f8', shakl: 'xetchbek' },
  { nom: 'Nexia', radius: 42, rang: '#c77dff', shakl: 'sedan' },
  { nom: 'Cobalt', radius: 50, rang: '#ff6b6b', shakl: 'sedan' },
  { nom: 'Gentra', radius: 58, rang: '#4ecdc4', shakl: 'sedan' },
  { nom: 'Onix', radius: 68, rang: '#ffa94d', shakl: 'sedan' },
  { nom: 'Tracker', radius: 78, rang: '#74c0fc', shakl: 'jip' },
  { nom: 'Malibu', radius: 90, rang: '#b197fc', shakl: 'sedan' },
  { nom: 'Tahoe', radius: 104, rang: '#69db7c', shakl: 'jip' },
]

// Kuzov shakllari. O'lchamlar doira radiusiga nisbatan (1 = radius).
// tom = tomning chap va o'ng cheti, oyna = oynalar pastki qismining chap va o'ng cheti
const shakllar = {
  xetchbek: { tom: [-0.42, 0.22], oyna: [-0.6, 0.5], tomY: -0.42, gildirak: 0.15 },
  sedan: { tom: [-0.25, 0.2], oyna: [-0.52, 0.5], tomY: -0.38, gildirak: 0.15 },
  furgon: { tom: [-0.66, 0.42], oyna: [-0.7, 0.62], tomY: -0.52, gildirak: 0.14 },
  jip: { tom: [-0.55, 0.3], oyna: [-0.66, 0.55], tomY: -0.52, gildirak: 0.19 },
}
const TUSHADIGAN_DARAJALAR = 5 // tepadan faqat birinchi 5 ta daraja tushadi

// Ekrandagi yozuvlar: tepada ochko va keyingi doira, ustida "O'yin tugadi" oynasi
const app = document.querySelector('#app')
app.innerHTML = `
  <div class="panel">
    <div>Ochko: <b id="ochko">0</b></div>
    <div>Rekord: <b id="rekord">0</b></div>
    <div class="keyingi">Keyingi: <b id="keyingiNom"></b><span id="keyingi"></span></div>
  </div>
  <div id="tugadi" class="tugadi" hidden>
    <h2>O'yin tugadi</h2>
    <p>Ochko: <b id="yakuniyOchko">0</b></p>
    <p id="yangiRekord" class="yangi-rekord" hidden>Yangi rekord!</p>
    <button id="qayta">Qayta boshlash</button>
  </div>
`
const ochkoYozuvi = document.querySelector('#ochko')
const rekordYozuvi = document.querySelector('#rekord')
const keyingiBelgi = document.querySelector('#keyingi')
const keyingiNom = document.querySelector('#keyingiNom')
const tugadiOynasi = document.querySelector('#tugadi')

// Engine = fizika "dvigateli": tortishish, urilish va dumalashni hisoblaydi
const engine = Engine.create()

// Render = hisoblangan narsani ekranga chizadi
const render = Render.create({
  element: app,
  engine: engine,
  options: {
    width: ENI,
    height: BOYI,
    wireframes: false,
    background: '#1e2433',
  },
})

// Quti: pol va ikki devor. isStatic = qimirlamaydi
const devorUslubi = { isStatic: true, render: { fillStyle: '#4a5570' } }
const pol = Bodies.rectangle(ENI / 2, BOYI - DEVOR / 2, ENI, DEVOR, devorUslubi)
const chapDevor = Bodies.rectangle(DEVOR / 2, BOYI / 2, DEVOR, BOYI, devorUslubi)
const ongDevor = Bodies.rectangle(ENI - DEVOR / 2, BOYI / 2, DEVOR, BOYI, devorUslubi)
Composite.add(engine.world, [pol, chapDevor, ongDevor])

// Berilgan darajadagi doirani yasaydi. qotgan = true bo'lsa tushmaydi va hech narsaga urilmaydi
function doiraYasa(x, y, daraja, qotgan) {
  const d = darajalar[daraja]
  const doira = Bodies.circle(x, y, d.radius, {
    isStatic: qotgan,
    isSensor: qotgan,
    restitution: 0.3, // sakrashi: 0 = umuman sakramaydi, 1 = to'pdek sakraydi
    render: { fillStyle: d.rang },
  })
  doira.daraja = daraja
  return doira
}

// Rekord brauzer xotirasida (localStorage) saqlanadi: sahifa yopilsa ham yo'qolmaydi.
// Ba'zi brauzerlarda (masalan maxfiy rejimda) xotira yopiq bo'lishi mumkin, shuning uchun try/catch
const REKORD_KALITI = 'mashina-merge-rekord'

function rekordniOqi() {
  try {
    return Number(localStorage.getItem(REKORD_KALITI)) || 0
  } catch {
    return 0
  }
}

function rekordniSaqla(qiymat) {
  try {
    localStorage.setItem(REKORD_KALITI, qiymat)
  } catch {
    // saqlab bo'lmasa ham o'yin davom etaveradi
  }
}

// O'yin holati
let rekord = rekordniOqi()
let rekordYangilandi = false // shu o'yinda rekord yangilandimi
rekordYozuvi.textContent = rekord
let ochko = 0
let tugadi = false
let keyingiDaraja = tasodifiyDaraja()

// Qo'ldagi doira: tepada turadi, o'yinchi uni chap-o'ngga suradi
let qoldagi = null
let qolX = ENI / 2

function tasodifiyDaraja() {
  return Math.floor(Math.random() * TUSHADIGAN_DARAJALAR)
}

function ochkoQosh(soni) {
  ochko += soni
  ochkoYozuvi.textContent = ochko

  if (ochko > rekord) {
    rekord = ochko
    rekordYangilandi = true
    rekordYozuvi.textContent = rekord
    rekordniSaqla(rekord)
  }
}

// Paneldagi "Keyingi" belgisini keyingi doiraning rangi va o'lchamiga moslaydi
function keyingiKorsat() {
  const d = darajalar[keyingiDaraja]
  keyingiNom.textContent = d.nom
  keyingiBelgi.style.background = d.rang
  keyingiBelgi.style.width = d.radius + 'px'
  keyingiBelgi.style.height = d.radius + 'px'
}

// x ni doira devordan chiqib ketmaydigan qilib cheklaydi
function chegarala(x, radius) {
  const chap = DEVOR + radius
  const ong = ENI - DEVOR - radius
  return Math.max(chap, Math.min(ong, x))
}

function yangiQoldagi() {
  if (tugadi || qoldagi) return

  // Oldindan ko'rsatilgan doira qo'lga o'tadi, o'rniga yangi "keyingi" tanlanadi
  const daraja = keyingiDaraja
  keyingiDaraja = tasodifiyDaraja()
  keyingiKorsat()

  const x = chegarala(qolX, darajalar[daraja].radius)
  qoldagi = doiraYasa(x, TASHLASH_Y, daraja, true)
  Composite.add(engine.world, qoldagi)
}

function sur(x) {
  qolX = x
  if (!qoldagi) return
  Body.setPosition(qoldagi, {
    x: chegarala(x, qoldagi.circleRadius),
    y: TASHLASH_Y,
  })
}

function tashla() {
  if (!qoldagi) return

  // Qotgan doirani olib tashlab, o'rniga xuddi shunday tushadiganini qo'yamiz
  const tushadigan = doiraYasa(qoldagi.position.x, TASHLASH_Y, qoldagi.daraja, false)
  Composite.remove(engine.world, qoldagi)
  Composite.add(engine.world, tushadigan)
  qoldagi = null

  setTimeout(yangiQoldagi, KUTISH)
}

// Sichqoncha yoki barmoq ekrandagi qayerda ekanini o'yin maydoni o'lchamiga o'giradi
function oyinX(e) {
  const joy = render.canvas.getBoundingClientRect()
  return ((e.clientX - joy.left) / joy.width) * ENI
}

render.canvas.addEventListener('pointerdown', (e) => {
  ovozniYoq()
  sur(oyinX(e))
})
render.canvas.addEventListener('pointermove', (e) => sur(oyinX(e)))
render.canvas.addEventListener('pointerup', (e) => {
  sur(oyinX(e))
  tashla()
})

// Ovoz: brauzer faqat o'yinchi birinchi marta bosgandan keyin ovoz chiqarishga ruxsat beradi
let audio = null

function ovozniYoq() {
  if (!audio) audio = new AudioContext()
}

// Qisqa "pik" tovushi. Daraja qancha katta bo'lsa, tovush shuncha baland
function ovozChal(daraja) {
  if (!audio) return

  const tovush = audio.createOscillator()
  const balandlik = audio.createGain()
  const hozir = audio.currentTime

  tovush.frequency.value = 280 + daraja * 55
  balandlik.gain.setValueAtTime(0.2, hozir)
  balandlik.gain.exponentialRampToValueAtTime(0.001, hozir + 0.18)

  tovush.connect(balandlik)
  balandlik.connect(audio.destination)
  tovush.start(hozir)
  tovush.stop(hozir + 0.18)
}

// "Puf" effektlari: birlashgan joyda kengayib yo'qoladigan halqa
const EFFEKT_UMRI = 350 // ms
let effektlar = []

// Birlashish: ikkita bir xil darajali doira tegsa, o'rnida bitta kattarog'i paydo bo'ladi
function birlashtir(a, b) {
  // Bir doira bir vaqtda ikki marta birlashib ketmasligi uchun belgilab qo'yamiz
  a.birlashgan = true
  b.birlashgan = true
  Composite.remove(engine.world, [a, b])

  // Ochko: daraja qancha katta bo'lsa shuncha ko'p (1, 3, 6, 10, 15 ...)
  const yangiDaraja = a.daraja + 1
  ochkoQosh((yangiDaraja * (yangiDaraja + 1)) / 2)

  // Yangi doira ikkalasining o'rtasida paydo bo'ladi
  const x = (a.position.x + b.position.x) / 2
  const y = (a.position.y + b.position.y) / 2

  ovozChal(yangiDaraja)
  effektlar.push({ x, y, radius: a.circleRadius, rang: darajalar[a.daraja].rang, boshlandi: performance.now() })

  // Eng katta daraja bo'lsa, ikkalasi shunchaki yo'qoladi
  if (yangiDaraja >= darajalar.length) return

  Composite.add(engine.world, doiraYasa(x, y, yangiDaraja, false))
}

// Fizika dvigateli har safar ikki jism bir-biriga tekkanida shu yerga xabar beradi
Events.on(engine, 'collisionStart', (hodisa) => {
  for (const juft of hodisa.pairs) {
    const a = juft.bodyA
    const b = juft.bodyB

    if (a.daraja === undefined || b.daraja === undefined) continue // devor yoki pol
    if (a.isSensor || b.isSensor) continue // qo'ldagi doira
    if (a.birlashgan || b.birlashgan) continue
    if (a.daraja !== b.daraja) continue

    birlashtir(a, b)
  }
})

// Qutidagi hamma tushgan doiralar (devorlar va qo'ldagi doira kirmaydi)
function tushganDoiralar() {
  return Composite.allBodies(engine.world).filter(
    (jism) => jism.daraja !== undefined && !jism.isSensor
  )
}

// Har fizika qadamidan keyin: biror doira qizil chiziqdan yuqorida uzoq turib qoldimi?
Events.on(engine, 'afterUpdate', (hodisa) => {
  if (tugadi) return

  for (const doira of tushganDoiralar()) {
    const tepasi = doira.position.y - doira.circleRadius
    if (tepasi < CHIZIQ_Y) {
      doira.yuqoriVaqt = (doira.yuqoriVaqt || 0) + hodisa.delta
      if (doira.yuqoriVaqt > CHIZIQ_VAQTI) {
        oyinTugadi()
        return
      }
    } else {
      doira.yuqoriVaqt = 0
    }
  }
})

function oyinTugadi() {
  tugadi = true
  if (qoldagi) {
    Composite.remove(engine.world, qoldagi)
    qoldagi = null
  }
  document.querySelector('#yakuniyOchko').textContent = ochko
  document.querySelector('#yangiRekord').hidden = !rekordYangilandi
  tugadiOynasi.hidden = false
}

function qaytaBoshla() {
  Composite.remove(engine.world, tushganDoiralar())
  ochko = 0
  ochkoYozuvi.textContent = 0
  rekordYangilandi = false
  tugadi = false
  tugadiOynasi.hidden = true
  yangiQoldagi()
}

document.querySelector('#qayta').addEventListener('click', qaytaBoshla)

// Doira ichiga mashina chizadi. Chizishdan oldin qalam doira markaziga ko'chirilgan
// va radiusga kattalashtirilgan bo'ladi, shuning uchun bu yerdagi sonlar -1 dan 1 gacha
function mashinaChiz(c, daraja) {
  const d = darajalar[daraja]
  const sh = shakllar[d.shakl]
  const jip = d.shakl === 'jip'
  const kuzovTepa = jip ? -0.12 : -0.05
  const kuzovPast = 0.3

  // Kabina (tom va ustunlar)
  c.fillStyle = '#f5f7fa'
  c.beginPath()
  c.moveTo(sh.oyna[0], kuzovTepa)
  c.lineTo(sh.tom[0], sh.tomY)
  c.lineTo(sh.tom[1], sh.tomY)
  c.lineTo(sh.oyna[1], kuzovTepa)
  c.closePath()
  c.fill()

  // Oynalar: kabinaning ichkariroq, qoraroq nusxasi
  c.fillStyle = '#2b3550'
  c.beginPath()
  c.moveTo(sh.oyna[0] + 0.09, kuzovTepa)
  c.lineTo(sh.tom[0] + 0.04, sh.tomY + 0.07)
  c.lineTo(sh.tom[1] - 0.04, sh.tomY + 0.07)
  c.lineTo(sh.oyna[1] - 0.09, kuzovTepa)
  c.closePath()
  c.fill()

  // O'rta ustun
  c.fillStyle = '#f5f7fa'
  c.fillRect((sh.tom[0] + sh.tom[1]) / 2 - 0.03, sh.tomY, 0.06, kuzovTepa - sh.tomY)

  // Kuzov
  c.beginPath()
  c.roundRect(-0.74, kuzovTepa, 1.48, kuzovPast - kuzovTepa, 0.1)
  c.fill()

  // Old chiroq
  c.fillStyle = '#ffd43b'
  c.fillRect(0.64, kuzovTepa + 0.06, 0.1, 0.08)

  // G'ildiraklar
  for (const x of [-0.42, 0.42]) {
    c.fillStyle = '#11151f'
    c.beginPath()
    c.arc(x, kuzovPast, sh.gildirak, 0, Math.PI * 2)
    c.fill()
    c.fillStyle = '#9aa5bd'
    c.beginPath()
    c.arc(x, kuzovPast, sh.gildirak * 0.45, 0, Math.PI * 2)
    c.fill()
  }

  // Nomi: faqat yozuv sig'adigan kattaroq doiralarda
  if (d.radius >= 42) {
    // Juda mayda shrift xira chiqadi, shuning uchun yozuvni haqiqiy piksel o'lchamida chizamiz
    c.scale(1 / d.radius, 1 / d.radius)
    c.fillStyle = '#11151f'
    c.font = '600 ' + Math.round(d.radius * 0.26) + 'px system-ui, sans-serif'
    c.textAlign = 'center'
    c.fillText(d.nom, 0, d.radius * 0.78)
  }
}

// Har kadrda Matter doiralarni chizib bo'lgach, ustiga o'zimiznikini chizamiz
Events.on(render, 'afterRender', () => {
  const c = render.context

  // Mashinalar: har bir doira ustiga, doira bilan birga aylanadi
  for (const jism of Composite.allBodies(engine.world)) {
    if (jism.daraja === undefined) continue
    c.save()
    c.translate(jism.position.x, jism.position.y)
    c.rotate(jism.angle)
    c.scale(jism.circleRadius, jism.circleRadius)
    mashinaChiz(c, jism.daraja)
    c.restore()
  }

  // "Puf" halqalari: vaqt o'tgan sari kengayadi va xiralashadi
  const hozir = performance.now()
  effektlar = effektlar.filter((e) => hozir - e.boshlandi < EFFEKT_UMRI)
  for (const e of effektlar) {
    const t = (hozir - e.boshlandi) / EFFEKT_UMRI // 0 dan 1 gacha
    c.globalAlpha = 1 - t
    c.strokeStyle = e.rang
    c.lineWidth = 6 * (1 - t) + 1
    c.beginPath()
    c.arc(e.x, e.y, e.radius * (1 + t * 1.2), 0, Math.PI * 2)
    c.stroke()
  }
  c.globalAlpha = 1

  // Qizil chiziq
  c.setLineDash([8, 8])
  c.strokeStyle = 'rgba(255, 107, 107, 0.6)'
  c.lineWidth = 2
  c.beginPath()
  c.moveTo(DEVOR, CHIZIQ_Y)
  c.lineTo(ENI - DEVOR, CHIZIQ_Y)
  c.stroke()
  c.setLineDash([])
})

// Faqat ishlab chiqish paytida: brauzer konsolidan o'yin ichiga qarash uchun
if (import.meta.env.DEV) {
  window.oyin = { engine, darajalar, doiraYasa, Matter }
}

keyingiKorsat()
yangiQoldagi()

Render.run(render)
Runner.run(Runner.create(), engine)
