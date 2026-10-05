// O'yindagi hamma yozuvlar uch tilda. Yangi til qo'shish uchun shu yerga yana bitta blok yoziladi
const matnlar = {
  uz: {
    ochko: 'Ochko',
    rekord: 'Rekord',
    keyingi: 'Keyingi',
    qoida1: 'Bir xil mashinalarni ustma-ust tashlang: ular birlashib kattasiga aylanadi.',
    qoida2: 'Qizil chiziqdan oshib ketmang!',
    boshlash: 'Boshlash',
    tugadi: "O'yin tugadi",
    yangiRekord: 'Yangi rekord!',
    davom: "Reklama ko'rib davom etish",
    qayta: 'Qayta boshlash',
    mashinalar: ['Mitti', 'Chaqqon', 'Furgon', 'Shahar', 'Sedan', 'Komfort', 'Biznes', 'Lyuks', 'Kross', 'Premium', 'Shoh'],
  },
  ru: {
    ochko: 'Очки',
    rekord: 'Рекорд',
    keyingi: 'Далее',
    qoida1: 'Бросайте одинаковые машины друг на друга: они сливаются в машину побольше.',
    qoida2: 'Не поднимайтесь выше красной линии!',
    boshlash: 'Играть',
    tugadi: 'Игра окончена',
    yangiRekord: 'Новый рекорд!',
    davom: 'Продолжить за рекламу',
    qayta: 'Начать заново',
    mashinalar: ['Малыш', 'Шустрый', 'Фургон', 'Город', 'Седан', 'Комфорт', 'Бизнес', 'Люкс', 'Кросс', 'Премиум', 'Король'],
  },
  en: {
    ochko: 'Score',
    rekord: 'Best',
    keyingi: 'Next',
    qoida1: 'Drop matching cars on each other: they merge into a bigger one.',
    qoida2: "Don't stack above the red line!",
    boshlash: 'Play',
    tugadi: 'Game over',
    yangiRekord: 'New record!',
    davom: 'Watch an ad to continue',
    qayta: 'Play again',
    mashinalar: ['Mini', 'Zippy', 'Van', 'City', 'Sedan', 'Comfort', 'Business', 'Luxe', 'Cross', 'Premium', 'King'],
  },
}

let til = 'uz'

// Til kodini ("ru", "en-US", "uz" ...) qabul qiladi. Bizda yo'q til bo'lsa zaxira til tanlanadi
export function tilTanla(kod, zaxira) {
  const qisqa = String(kod || '').slice(0, 2).toLowerCase()
  til = matnlar[qisqa] ? qisqa : zaxira
  document.documentElement.lang = til
}

export function hozirgiTil() {
  return til
}

// Kalit bo'yicha hozirgi tildagi yozuvni qaytaradi: t('boshlash') -> 'Boshlash'
export function t(kalit) {
  return matnlar[til][kalit]
}

export function mashinaNomi(daraja) {
  return matnlar[til].mashinalar[daraja]
}
