/* WORK 경험 타임라인 — 열 개의 스톱.
   사진은 public/images/florilegium/ 에 두었다(빌드 없이 URL로 서빙).
   7번과 10번의 파일 스왑은 원본 구성: 다크 올리움이 마지막 스톱. */
export type Plate = {
  src: string
  title: string
  note: string
  tint: string
  focus?: string
}

/* 틴트는 사이트 팔레트의 쿨한 아쿠아 래더(surface-2 / line / bg / fg)로
   맞춘 값들이다. */
export const PLATES: Plate[] = [
  { src: '/images/florilegium/stem-01.webp', title: 'Anemone, first light', note: 'Window, east', tint: '#e3eef0' },
  { src: '/images/florilegium/stem-02.webp', title: 'Jasmine before breakfast', note: 'Kitchen table', tint: '#2f4a4f' },
  { src: '/images/florilegium/stem-03.webp', title: 'Cosmos in the stairwell', note: 'Landing', tint: '#d9e6e8' },
  { src: '/images/florilegium/stem-04.webp', title: 'Peony, half asleep', note: 'Study', tint: '#0f2a2d' },
  { src: '/images/florilegium/stem-05.webp', title: 'Poppy, in grey', note: 'Hallway', tint: '#f7fbfb' },
  { src: '/images/florilegium/stem-06.webp', title: 'Lily at noon', note: 'Garden room', tint: '#cfe0e3' },
  // plate 7 — 유리잔 (스왑: stem-10.webp)
  { src: '/images/florilegium/stem-10.webp', title: 'A stem in glass', note: 'Bathroom sill', tint: '#eef5f6' },
  { src: '/images/florilegium/stem-08.webp', title: 'Anemone, again', note: 'Window, west', tint: '#d3e2e4' },
  { src: '/images/florilegium/stem-09.webp', title: 'Everlasting', note: 'Mantelpiece', tint: '#bed2d6' },
  // plate 10 — 다크 올리움 (스왑: stem-07.webp)
  { src: '/images/florilegium/stem-07.webp', title: 'Allium after dark', note: 'Bedside', tint: '#0b1c1e', focus: '50% 68%' },
]

/* 날짜는 임시로 71일 간격, 22.01.01 부터. 실제 포트폴리오 이력으로 바꿀 때는
   PLATE_DAYS 의 값을 날짜별 실제 일수로 바꾸기만 하면 클록 보간과 스냅 스톱이
   그대로 따라간다. (하단 레인지의 끝 26.11.06 은 현재 고정 표기) */
export const DATE_STEP_DAYS = 71
export const PLATE_DAYS = PLATES.map((_, i) => i * DATE_STEP_DAYS)

const DAY_MS = 86_400_000
const START_MS = Date.UTC(2022, 0, 1)

/** 달력 타일용 조각: 연/월/일을 각각(예: 2022 / 01 / 01). */
export const fmtCalendar = (days: number) => {
  const d = new Date(START_MS + Math.round(days) * DAY_MS)
  return {
    year: String(d.getUTCFullYear()),
    month: String(d.getUTCMonth() + 1).padStart(2, '0'),
    day: String(d.getUTCDate()).padStart(2, '0'),
  }
}
