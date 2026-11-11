import { asset } from '../lib/asset'
/* WORK 경험 타임라인 — 열 개의 스톱.
   사진은 public/images/ 와 public/images/florilegium/ 에 두었다(빌드 없이 URL로 서빙).
   7번과 10번의 파일 스왑은 원본 구성: 다크 올리움이 마지막 스톱. */
export type Plate = {
  src: string
  title: string
  note: string
  tint: string
  focus?: string
  /* 판 이미지에 걸리는 1.22배 확대와 좌우 흔들림을 끈다 — 원본이 잘리지 않는다. */
  still?: boolean
  /* 보여 줄 날짜(YYYY-MM-DD). 없으면 71일 간격 그리드를 쓴다. 날짜는 판 사이를
     보간하므로 앞뒤 판보다 늦어야 한다(오름차순). */
  date?: string
  /* 판을 클릭해 열리는 설명 모달의 문단들. 없으면 날짜・제목만 보인다. */
  desc?: string[]
}

/* 틴트는 사이트 팔레트의 쿨한 아쿠아 래더(surface-2 / line / bg / fg)로
   맞춘 값들이다. */
export const PLATES: Plate[] = [
  { src: asset('/images/florilegium/stem-02.webp'), title: 'Jasmine before breakfast', note: 'Kitchen table', tint: '#2f4a4f' },
  { src: asset('/images/florilegium/stem-03.webp'), title: 'Cosmos in the stairwell', note: 'Landing', tint: '#d9e6e8' },
  {
    src: asset('/images/morajo-1100.webp'),
    title: '크라우드 리워드 앱 : 모라조',
    note: 'Brand keyvisual',
    tint: '#e3eef0',
    still: true,
    date: '2022-07-21',
    desc: [
      '크라우드 리워드 앱 MORAZO의 키비주얼입니다. 보라색 원형 캐릭터와 굵은 워드마크로 브랜드의 인상을 만들고, 흰 바탕에 여백을 넉넉히 두어 앱 화면과 인쇄물 어디에나 얹을 수 있게 했습니다.',
    ],
  },
  { src: asset('/images/florilegium/stem-04.webp'), title: 'Peony, half asleep', note: 'Study', tint: '#0f2a2d' },
  { src: asset('/images/florilegium/stem-05.webp'), title: 'Poppy, in grey', note: 'Hallway', tint: '#f7fbfb' },
  { src: asset('/images/florilegium/stem-06.webp'), title: 'Lily at noon', note: 'Garden room', tint: '#cfe0e3' },
  // plate 7 — 유리잔 (스왑: stem-10.webp)
  { src: asset('/images/florilegium/stem-10.webp'), title: 'A stem in glass', note: 'Bathroom sill', tint: '#eef5f6' },
  { src: asset('/images/florilegium/stem-08.webp'), title: 'Anemone, again', note: 'Window, west', tint: '#d3e2e4' },
  { src: asset('/images/florilegium/stem-09.webp'), title: 'Everlasting', note: 'Mantelpiece', tint: '#bed2d6' },
  // plate 10 — 다크 올리움 (스왑: stem-07.webp)
  { src: asset('/images/florilegium/stem-07.webp'), title: 'Allium after dark', note: 'Bedside', tint: '#0b1c1e', focus: '50% 68%' },
]

/* 날짜는 기본으로 71일 간격, 22.01.01 부터. 실제 날짜를 아는 판은 date 로
   덮어쓴다. (하단 레인지의 끝 26.11.06 은 현재 고정 표기) */
export const DATE_STEP_DAYS = 71
const DAY_MS = 86_400_000
const START_MS = Date.UTC(2022, 0, 1)
const daysFromStart = (iso: string) => Math.round((Date.parse(`${iso}T00:00:00Z`) - START_MS) / DAY_MS)

export const PLATE_DAYS = PLATES.map((plate, i) => (plate.date ? daysFromStart(plate.date) : i * DATE_STEP_DAYS))

/** 달력 타일용 조각: 연/월/일을 각각(예: 2022 / 01 / 01). */
export const fmtCalendar = (days: number) => {
  const d = new Date(START_MS + Math.round(days) * DAY_MS)
  return {
    year: String(d.getUTCFullYear()),
    month: String(d.getUTCMonth() + 1).padStart(2, '0'),
    day: String(d.getUTCDate()).padStart(2, '0'),
  }
}

/** 한 줄 표기 — 2022.07.21. */
export const fmtDate = (days: number) => {
  const { year, month, day } = fmtCalendar(days)
  return `${year}.${month}.${day}`
}
