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
  /* 판을 클릭하면 열리는 문서형 상세. 없으면 날짜・제목・캡션만 나온다. */
  detail?: {
    /* 문서 좌측 썸네일. 없으면 판 이미지를 쓴다. */
    thumb?: string
    /* 제목 아래 작업 범위 */
    meta: string
    /* 썸네일 옆 소개 문단 */
    intro: string[]
    /* 문서 전체 너비 이미지 */
    image?: string
    video?: string
    videoText?: string
    /* 앱 화면 슬라이드(세로 9:16) */
    slides?: string[]
    /* 문서 아래 2단 문단 */
    columns?: string[]
  }
}

/* 틴트는 사이트 팔레트의 쿨한 아쿠아 래더(surface-2 / line / bg / fg)로
   맞춘 값들이다. */
export const PLATES: Plate[] = [
  { src: asset('/images/florilegium/stem-02.webp'), title: 'Jasmine before breakfast', note: 'Kitchen table', tint: '#2f4a4f' },
  {
    src: asset('/images/portfolio-v1/thumb.jpg'),
    title: 'DE:SIGN MY LIFE v1',
    note: 'UI,UX DESIGN / PUBLISHING',
    tint: '#d9e6e8',
    still: true,
    date: '2022-05-20',
    detail: {
      meta: 'UI,UX DESIGN / PUBLISHING',
      intro: [
        '첫번째 포트폴리오 웹입니다.',
        '트랜디하고 감각적인 디자인, 쫀득한 인터렉션, 편하게 볼 수 있고 직관적인 디자인을 목표로 제작되었습니다.',
        '하늘에 흐려지는듯한 히어로 섹션과, 모던한 레이아웃과 디자인 사이에서 과감하지만 절제된 색사용에 긍정적인 평가를 많이 받았던 작업물입니다.',
      ],
      image: asset('/images/portfolio-v1/detail.jpg'),
      video: asset('/images/portfolio-v1/interaction.mp4'),
      videoText: '히어로 섹션에서 은은하고 부드럽게 시작했지만, 이후의 인터렉션은 쫀득-한 느낌으로 진행해보고 싶었어요. 멈춘 웹은 죽었다고 생각하거든요. 정적인 웹은 만들고 싶지 않았어요. 그래서 스크롤스파이를 이용해서 스크롤에 따라 약간의 반동을 겸한 인터렉션을 삽입해 보았습니다. 배경이 덮이며 쫀득하게 나타나는 인터렉션을 제가 생각한대로 구현해서 너무 기뻤던 부분입니다! :)',
      columns: [
        '현재까지도 사용하는 DE:SIGN MY LIFE 라는 타이틀에 고려를 많이 했었습니다. \'삶을 디자인하다\' 라는 흔한 멘트로서도 보이지만, DE SIGN으로 "삶의 표지판을 세우다" 라는 의미로도 보이는걸 의도해봤어요.',
        '색감이 좋다는 이야기를 많이 듣곤 합니다. 첫 인상부터 많은 인터렉션 등으로 사로잡기 보다는, 아련하고 감각적인 느낌으로 기억에 각인되어 보고 싶었어요. 탁한 빛의 하늘에 은은한 노을이 지는 느낌, 애니메이션에서밖에 못 볼 법한 하늘의 모습으로 첫 인상을 만들었습니다.',
      ],
    },
  },
  {
    src: asset('/images/morajo-1100.webp'),
    title: '크라우드 리워드 앱 : 모라조',
    note: 'Brand keyvisual',
    tint: '#e3eef0',
    still: true,
    date: '2022-07-21',
    detail: {
      thumb: asset('/images/morajo/detail.webp'),
      meta: 'BRANDING / PROMOTION DESIGN',
      intro: [
        '우주 최초 크라우드 리워드 앱! 모라조의 리브랜딩과 프로모션 디자인을 진행했습니다. 출시 전의 앱이었으나, 기존의 디자인이 브랜딩이 부족한 점에 브랜딩 위주의 개편 작업을 진행했습니다.',
        '바리에이션 하기 좋은 동글동글, 귀여운 캐릭터를 이용해서 다양한 일러스트를 컨셉츄얼하게 사용해 각인효과와 친근함, 편안함을 유도하였습니다.',
      ],
      slides: [
        asset('/images/morajo/slide-1.webp'),
        asset('/images/morajo/slide-2.webp'),
        asset('/images/morajo/slide-3.webp'),
        asset('/images/morajo/slide-4.webp'),
      ],
      columns: [
        '모라조의 메인 컬러인 보라색과 [뭉치면 터진다]에서 생각한 포도알에서부터 시작한 디자인입니다. 소소한 표정 변화만으로 오밀조밀하고 귀여운, 친근한 느낌을 만들었습니다.',
        '컨셉츄얼한 느낌을 주기 위해 극도로 절제하며 색을 사용하였습니다. 기쁘게도 수제 작업한 (...) 일러스트와 시너지가 되어 유니크한 스타일로 작업할 수 있었습니다.',
      ],
    },
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
