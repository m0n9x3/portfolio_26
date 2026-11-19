import { asset } from '../lib/asset'
/* WORK 경험 타임라인. 이미지는 public/images/에서 서빙한다. */
export type Plate = {
  /* URL 공유 주소 — /?plate=<slug> 로 이 판의 상세를 바로 연다. */
  slug: string
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
    link?: string
    linkLabel?: string
    /* 링크를 소개 문단이 아니라 2단 문단(columns) 안에 둔다 — 이 순번(0부터) 문단 뒤에 붙는다. */
    linkAfterColumn?: number
    /* 문서 전체 너비 이미지 */
    image?: string
    /* 소개 바로 아래(2단 문단 위)에 오는 영상. 아래 video 는 2단 문단 뒤에 온다. */
    topVideo?: string
    video?: string
    videoText?: string
    bottomImage?: string
    /* 앱 화면 슬라이드(세로 9:16) */
    slides?: string[]
    fullWidthSlides?: boolean
    promotionSlides?: string[][]
    promotionText?: string
    effectSlides?: string[]
    effectColumns?: string[]
    /* 문서 아래 2단 문단 */
    columns?: string[]
    /* 문서 하단 슬라이드 — 각 장이 제 비율대로 폭을 갖는다. */
    bottomSlides?: string[]
    /* 하단 슬라이드 아래 2단 문단 */
    bottomColumns?: string[]
    /* 2단 문단 뒤에 순서대로 오는 전폭 블록 — 이미지 또는 1단(전폭) 문단. */
    blocks?: { image?: string; text?: string }[]
  }
}

/* 틴트는 사이트 팔레트의 쿨한 아쿠아 래더(surface-2 / line / bg / fg)로
   맞춘 값들이다. */
export const PLATES: Plate[] = [
  {
    slug: 'portfolio-2022',
    src: asset('/images/portfolio-2022/thumb.jpg'),
    title: '22 UI/UX PORTFOLIO',
    note: 'UI/UX DESIGN & GRAPHIC',
    tint: '#2f4a4f',
    still: true,
    date: '2022-04-18',
    detail: {
      meta: 'UI/UX DESIGN & GRAPHIC',
      intro: [
        '2022년도의 UI/UX 디자인 및 그래픽 작업물을 총정리한 PDF를 디자인했습니다.',
        '동글동글 귀엽고 플랫한 캐릭터와 트렌디한 디자인으로 주목도를 잡았고, 주객전도 되지 않도록 \'디자인을 보여준다\'는 목적은 확실히 지키기 위해 노력해봤어요.',
        '이건 다른 이야기지만, 인쇄물로도 사용했었는데.. 프린터 잉크를 너무너무 많이 사용해서 ^_ㅠ... 인쇄물의 배경색은 최대한 자제해야 한다는 배움을 받기도 했었던 작업입니다.',
      ],
      link: 'https://m0n9x3.kr/porfolio/pdf/2022_ui_ux.pdf',
      linkLabel: '포트폴리오 PDF 보기 ↗',
      slides: [asset('/images/portfolio-2022/page-1.jpg'), asset('/images/portfolio-2022/page-2.jpg')],
      fullWidthSlides: true,
      columns: ['검은 바탕에 네온 톤의 색 사용으로 확 이목을 끌었습니다. 가장 기억에 각인되도록 한 메인 캐릭터의 디자인에 사용된 색을 전체 디자인과 섹션별 컬러로도 사용함으로써 전체적으로 스토리가 이어지는 느낌을 주고 싶었어요.'],
    },
  },
  {
    slug: 'design-my-life-v1',
    src: asset('/images/portfolio-v1/thumb.jpg'),
    title: 'DE:SIGN MY LIFE v1',
    note: 'UI/UX DESIGN / PUBLISHING',
    tint: '#d9e6e8',
    still: true,
    date: '2022-05-20',
    detail: {
      meta: 'UI/UX DESIGN / PUBLISHING',
      intro: [
        '첫 번째 포트폴리오 웹입니다.',
        '트렌디하고 감각적인 디자인, 쫀득한 인터랙션, 편하게 볼 수 있고 직관적인 디자인을 목표로 제작되었습니다.',
        '하늘에 흐려지는 듯한 히어로 섹션과, 모던한 레이아웃과 디자인 사이에서 과감하지만 절제된 색사용에 긍정적인 평가를 많이 받았던 작업물입니다.',
      ],
      link: 'https://m0n9x3.kr/porfolio/v1/',
      image: asset('/images/portfolio-v1/detail.jpg'),
      video: asset('/images/portfolio-v1/interaction.mp4'),
      bottomImage: asset('/images/portfolio-v1/gal_pf.jpg'),
      videoText: '히어로 섹션에서 은은하고 부드럽게 시작했지만, 이후의 인터랙션은 쫀득한 느낌으로 진행해보고 싶었어요. 멈춘 웹은 죽었다고 생각하거든요. 정적인 웹은 만들고 싶지 않았어요. 그래서 ScrollSpy를 이용해서 스크롤에 따라 약간의 반동을 겸한 인터랙션을 삽입해 보았습니다. 배경이 덮이며 쫀득하게 나타나는 인터랙션을 제가 생각한 대로 구현해서 너무 기뻤던 부분입니다! :)',
      columns: [
        '현재까지도 사용하는 DE:SIGN MY LIFE 라는 타이틀에 고려를 많이 했었습니다. \'삶을 디자인하다\' 라는 흔한 멘트로서도 보이지만, DE SIGN으로 "삶의 표지판을 세우다" 라는 의미로도 보이는걸 의도해봤어요.',
        '색감이 좋다는 이야기를 많이 듣곤 합니다. 첫 인상부터 많은 인터랙션 등으로 사로잡기 보다는, 아련하고 감각적인 느낌으로 기억에 각인되어 보고 싶었어요. 탁한 빛의 하늘에 은은한 노을이 지는 느낌, 애니메이션에서밖에 못 볼 법한 하늘의 모습으로 첫 인상을 만들었습니다.',
      ],
    },
  },
  {
    slug: 'morajo',
    src: asset('/images/morajo-1100.webp'),
    title: '크라우드 리워드 앱 : 모라조',
    note: 'BRAND KEY VISUAL',
    tint: '#e3eef0',
    still: true,
    date: '2022-07-21',
    detail: {
      thumb: asset('/images/morajo/detail.webp'),
      meta: 'BRANDING / PROMOTION DESIGN',
      intro: [
        '우주 최초 크라우드 리워드 앱! 모라조의 리브랜딩과 프로모션 디자인을 진행했습니다. 출시 전의 앱이었으나, 기존의 디자인이 브랜딩이 부족한 점에 브랜딩 위주의 개편 작업을 진행했습니다.',
        '배리에이션하기 좋은 동글동글, 귀여운 캐릭터를 이용해서 다양한 일러스트를 컨셉추얼하게 사용해 각인 효과와 친근함, 편안함을 유도하였습니다.',
      ],
      slides: [
        asset('/images/morajo/slide-1.webp'),
        asset('/images/morajo/slide-2.webp'),
        asset('/images/morajo/slide-3.webp'),
        asset('/images/morajo/slide-4.webp'),
      ],
      columns: [
        '모라조의 메인 컬러인 보라색과 [뭉치면 터진다]에서 생각한 포도알에서부터 시작한 디자인입니다. 소소한 표정 변화만으로 오밀조밀하고 귀여운, 친근한 느낌을 만들었습니다.',
        '컨셉추얼한 느낌을 주기 위해 극도로 절제하며 색을 사용하였습니다. 기쁘게도 수제 작업한 (...) 일러스트와 시너지가 되어 유니크한 스타일로 작업할 수 있었습니다.',
      ],
    },
  },
  {
    slug: 'point-cash',
    src: asset('/images/point-cash/thumb.jpg'),
    title: '포인트캐시',
    note: 'REBRANDING & UI/UX DESIGN & PUBLISHING',
    tint: '#e3eef0',
    still: true,
    date: '2023-04-27',
    detail: {
      meta: 'REBRANDING & UI/UX DESIGN & PUBLISHING',
      intro: ['포인트캐시 반응형 웹사이트의 리브랜딩 및 UI/UX 디자인, 퍼블리싱을 진행했습니다.'],
      image: asset('/images/point-cash/gal-07.jpg'),
      columns: [
        '포인트캐시 사이트는 포인트를 캐시로 바꿔주는 서비스입니다. 기존 사이트의 경우 1) 사용성이 고려되지 않은 UX 2) 오래된 디자인 3) 필요치 않은 적응형 레이아웃이 적용되어 있어 사용성, 유지보수, 디자인 면에서 모두 실질적인 문제가 있어 적극 제안해 시작했었던 작업입니다.',
        '작업에서 특히 고려했던 부분은 이미 안정적으로 운영이 되고 있던 서비스였기 때문에 기존 사용자의 실질적인 프로세스를 바꾸지 않고, 개발단에서 프로세스를 최대한 바꾸지 않으면서 UX를 개선해야 한다는 점이었습니다. 디자인적인 개선보다 이 부분에 가장 많은 시간 투자가 되었던 작업이었습니다.',
      ],
      blocks: [
        { image: asset('/images/point-cash/gal-07-01.jpg') },
        {
          text: '우선 메인에선 콘텐츠 공간 압축에 가장 신경을 썼습니다. 가장 큰 메인 테마로 잡은건 "기능이 한눈에 보이는, 기능형 웹사이트"였습니다. 맥락상 필요 없는 부분을 과감히 제거했고, 더 직관적인 버튼을 추가하는 방향으로 작업했습니다. 로그인의 경우에는 캡차 및 동작 인식을 통한 보안 과정이 추가된 별도의 로그인 페이지로 이동시키는 방향으로 프로세스를 바꿨고, 폰트 사이즈도 현대 웹 사용성에 맞도록 수정했습니다.',
        },
        { image: asset('/images/point-cash/gal-07-02.jpg') },
        {
          text: '서브페이지들에서도 전체적으로 프로세스를 점검하여 개발단 작업을 최소화한 사용성 개선 작업을 전체적으로 진행했습니다. 서브페이지에서의 목표로 잡은 건 "처음 봤을 때 무엇을 먼저 해야 하고, 어디로 시선을 이동해야 하는가"에 대해서 바로 이해할 수 있도록 변경하는 것이었습니다. 기존의 경우에는 사용자가 프로세스를 진행할 때 자연스러운 시선이동이 아닌, 스크롤을 이동해가며 확인해야 했던 부분을, 한 화면에서 자연스럽게 위에서부터 아래로 보며 사용할 수 있게 작업했습니다. (리뉴얼 후 버그 때문에 화가 날 지언정 사용하기 편해졌다는 피드백을 받았었던게 기억에 남습니다..^_^/)',
        },
      ],
    },
  },
  {
    slug: 'moviechart',
    src: asset('/images/moviechart/thumb.jpg'),
    title: '영화를 만나다 : 무비차트',
    note: 'BRANDING, UI/UX DESIGN, PUBLISHING',
    tint: '#e3eef0',
    still: true,
    date: '2023-06-07',
    detail: {
      meta: 'BRANDING, UI/UX DESIGN, PUBLISHING',
      intro: [
        '무비차트 사이트의 리뉴얼 작업을 진행했습니다.',
        '정체성과 오래된 디자인의 개편에 초점이 있었던 리뉴얼이기 때문에, 사용성은 약간의 개선 정도만 하면서 최대한 디자인 개편에 초점을 두고 작업했었던 리뉴얼 작업입니다.',
      ],
      image: asset('/images/moviechart/detail.jpg'),
      bottomSlides: [
        asset('/images/moviechart/sc01.jpg'),
        asset('/images/moviechart/sc02.webp'),
        asset('/images/moviechart/sc03.jpg'),
      ],
      bottomColumns: [
        '모바일의 경우 UI에 전체적으로 매거진 느낌이 나도록 작업해보았습니다. PC의 영상 스타일은 모바일 사용자 입장에서 데이터 소비량이 과하게 느껴질 수 있어 사용하지 않되, 단순히 나열로 느껴지지 않도록 전체적으로 이미지 매거진 스타일로 작업해보았습니다.',
        '사이트에서 직접적으로 목적하는 바가 사이트의 콘텐츠를 통해서 -> 영화 예매를 하도록 유도하는 것이기 때문에 사이트 어디에서도 영화 예매를 할 수 있는 플로팅 바를 띄우게 했고, 메뉴 바를 같이 이동하게 함으로서 영화 예매를 사이트 전체에서 접근하게 하면서도 화면이 무겁거나 복잡해보이는것을 예방했습니다.',
      ],
      columns: [
        '기존 사이트는 단순히 정보를 나열하는 것에 불과했고, 사용자의 행동에 반응하는 효과가 부족했습니다. 특히 사이트 메인에서 너무 다양한 정보를 보여주려 하다 보니 확실한 첫 인상이 없었고, 그 정보 제공도 딱히 체계적으로 진행되지 못했습니다. 브랜딩은 단순히 브랜드 이름을 나열하는 수준에 불과했습니다.',
        '리뉴얼에서는 \'무비차트\'라는 컨셉에 맞게 예매차트를 메인으로 한 히어로 섹션을 구성했습니다. 특히 차트인 되어있는 영화자료에 예고편의 유튜브 링크를 수집하고 있다는 사실을 확인하여, YouTube IFrame Player API와 Swiper를 이용해 히어로 섹션을 사용자의 클릭에 반응하는 영화관의 느낌으로 재구성했습니다.',
      ],
    },
  },
  {
    slug: '247-game',
    src: asset('/images/247-game/thumb.jpg'),
    title: '247GAME',
    note: 'BRANDING, GAME DEV, GAME UI/UX DESIGN, MOTION GRAPHIC DESIGN',
    tint: '#0b1c1e',
    still: true,
    date: '2024-10-25',
    detail: {
      meta: 'BRANDING, GAME DEV, GAME UI/UX DESIGN, MOTION GRAPHIC DESIGN',
      intro: ['247GAME의 브랜딩 및 인게임 UI/UX 디자인, 엔진 작업, 영상 디자인 등의 작업에 참여했습니다.'],
      slides: [
        asset('/images/247-game/slide-1.jpg'),
        asset('/images/247-game/slide-2.gif'),
        asset('/images/247-game/slide-3.png'),
        asset('/images/247-game/slide-4.png'),
      ],
      fullWidthSlides: true,
      promotionSlides: [
        [asset('/images/247-game/store-earth-1.png'), asset('/images/247-game/store-earth-2.png'), asset('/images/247-game/store-casino-1.png'), asset('/images/247-game/store-casino-2.png')],
        [asset('/images/247-game/promo-earth.webp'), asset('/images/247-game/promo-casino.webp')],
      ],
      effectSlides: [asset('/images/247-game/effect-02.webp'), asset('/images/247-game/effect-03.webp')],
      effectColumns: [
        '블록버스터류 게임에서 엔진을 이용한 이펙트 작업도 진행했습니다. 이펙트와 애니메이션만으로 배리에이션을 주는 형태의 작업이었기 때문에 다양한 이펙트를 고려했었던 기억이 납니다. 베이스 지식이 없던 상태에서 작업을 했었어서 도전적 시도를 하지 못했던게 아쉬웠습니다.',
        '엔진 특성상 웹 위에 얹어지는 CANVAS 기반으로 작동할 것을 고려해야 했기 때문에 과한 애니메이션보다는 광원과 파티클을 이용해서 샤랄라(?)한 느낌 위주로 진행했습니다.',
      ],
      promotionText: '프로모션 디자인도 진행하였으며, 관련해 영상도 제작하였습니다. 프로모션 디자인이나 프로모션 영상 양측 다 게임 내 리소스가 많은 편이 아니어서 별도 오브젝트를 제작하거나, 모션그래픽을 최대한 활용하며 작업했던 작업이었습니다. 타겟층이 확연하게 다른 두 게임이었기 때문에 작업하면서 스타일을 확실하게 바꿔보았는데, 목표한 타겟층에 어느 정도 일치하게 작업물이 나온 것 같아 만족스러웠던 작업입니다.',
      columns: [
        '247GAME의 브랜딩작업을 진행했습니다. 테크니컬/사이버펑크한 감성에 확장성을 위해 대중적인 느낌을 넣으며 작업했습니다. 실제로 247GAME 사(社)는 블록버스터류의 캐주얼 게임부터 우주테마의 게임이나 성인게임 등 다양한 컨셉의 게임을 작업했었던 게임 브랜드였습니다.',
        '젊고 트렌디한 느낌을 주기 위해 과감한 네온컬러를 많이 사용했고, 그러면서 피곤함을 덜하기 위해 서브컬러로는 확고한 흰색을 채용해보았습니다. 결과적으로 과하게 화려하지 않으면서, 심플하며 테크니컬/사이버펑크한 느낌을 트렌디하게 줄 수 있게 구성이 가능했습니다.',
      ],
    },
  },
  {
    slug: 'yuseunghan-naedeul',
    src: asset('/images/yuseunghan-naedeul/thumb.jpg'),
    title: '유승한내들',
    note: 'UI/UX DESIGN, PUBLISHING',
    tint: '#e3eef0',
    still: true,
    date: '2025-08-19',
    detail: {
      meta: 'UI/UX DESIGN, PUBLISHING',
      intro: ['유승한내들의 반응형 웹사이트 디자인 및 퍼블리싱을 진행했습니다.'],
      blocks: [
        { image: asset('/images/yuseunghan-naedeul/gal-08-01.jpg') },
        {
          text: '유승한내들의 반응형 웹사이트 디자인 및 퍼블리싱을 진행했습니다. 젊고, 건강하고, 푸르고, 살아있고, 생기있는 디자인을 만들어보고 싶다는 생각으로 도전적인 시도를 많이 해봤던 디자인입니다.',
        },
        { image: asset('/images/yuseunghan-naedeul/gal-08-02.jpg') },
      ],
    },
  },
  {
    slug: 'hanyang-iclass-yangju',
    src: asset('/images/hanyang-iclass-yangju/thumb.jpg'),
    title: '한양 아이클래스 양주',
    note: 'UI/UX DESIGN / PUBLISHING',
    tint: '#333f41',
    still: true,
    date: '2026-08-17',
    detail: {
      meta: 'UI/UX DESIGN / PUBLISHING',
      intro: ['한양 아이클래스 양주 반응형 웹사이트의 디자인 및 퍼블리싱을 진행했습니다.'],
      /* 35초 클립은 애니 WebP 로 뜨면 배포 한도를 넘어 MP4(무음 H.264)로 둔다. */
      topVideo: asset('/images/hanyang-iclass-yangju/scroll.mp4'),
      link: 'https://github.com/m0n9x3/fullscroll',
      linkLabel: 'fullScroll 라이브러리 (GitHub) ↗',
      /* fullScroll 을 설명하는 2단 문단 바로 뒤에 링크를 둔다. */
      linkAfterColumn: 1,
      columns: [
        '영상 AI와 자체 제작한 fullScroll 라이브러리를 적극 활용한 프로젝트입니다. 한양 아이클래스 양주의 \'프리미엄스러움\'을 보여주기 위해서 드론샷/타임랩스 스타일의 영상을 AI를 통해서 제작하여 채용했습니다.',
        '또한 fullScroll 라이브러리와 GSAP을 활용해 전환효과와 스크롤 이동에 부드러움과 변칙을 지속적으로 주어 사이트 자체가 프리미엄틱하게 보일 수 있도록 작업했습니다.',
      ],
    },
  },
  {
    slug: 'gh-biz-gwanggyo',
    src: asset('/images/gh-biz-gwanggyo/thumb.jpg'),
    title: 'GH BIZ&광교',
    note: 'UI/UX DESIGN & PUBLISHING',
    tint: '#e3eef0',
    still: true,
    date: '2026-10-21',
    detail: {
      meta: 'UI/UX DESIGN & PUBLISHING',
      intro: [
        'GH BIZ&광교 반응형 웹사이트의 UI/UX 디자인 및 퍼블리싱을 진행했습니다.',
        '자체적으로 제작한 fullScroll 라이브러리와 GSAP을 이용해 웹 인터랙션을 작업했습니다.',
      ],
      link: 'https://github.com/m0n9x3/fullscroll',
      linkLabel: 'fullScroll 라이브러리 (GitHub) ↗',
      /* fullScroll 을 설명하는 2단 문단 바로 뒤에 링크를 둔다. */
      linkAfterColumn: 1,
      /* 긴 21초 클립은 애니 WebP 로 뜨면 10MiB 배포 한도를 넘어 MP4(무음 H.264)로 둔다. */
      topVideo: asset('/images/gh-biz-gwanggyo/scroll.mp4'),
      columns: [
        '공공혜택이 많이 강조된 클라이언트의 자료를 기반하여 신뢰적인, 공공적인 느낌을 강조하면서 기술적인 느낌을 놓치지 않고 싶었어요. 고민한 끝에 레이아웃에 공공기관에서 많이 채용하는 KRDS 기반의 레이아웃 토큰을 채용하면서, 사이트 영역의 제한과, 보기 편하면서도 사용자 입장에서 각인될 수 있는 기술적인 느낌의 인터랙션을 채용했습니다. 특히 마지막 부분의 경우에는 레이아웃 전체가 축소되며/글래스모피즘 효과가 추가되고/마퀴 텍스트가 추가되며 피날레&푸터가 되는 레이아웃으로 작업해보았는데, 목표했던 \'기술적인\' 느낌을 확고하게 줄 수 있어서 좋았습니다.',
        '사이트를 작업할 때 프로젝트를 위해 별도로 제작한 fullScroll 라이브러리를 사용했어요. 유료 라이브러리인 fullPage.js를 대신해 사용할 수 있는 라이브러리로 Swiper와 GSAP에 종속성을 두고 제작되어 애니메이션이나 스크롤 스내핑 등을 자유롭게 할 수 있는 라이브러리로 현재 GitHub에 공개해둔 라이브러리입니다. GH BIZ&광교의 제한된 영역에서의 스크롤 스내핑 작업에서 큰 커스터마이징 없이 미려한 애니메이션을 만들 수 있어 큰 도움이 되었었어요.',
      ],
      /* 4초짜리 짧은 클립은 1000px·20fps WebP 1.6MB 로 가볍게 끝나 이미지처럼 바로 재생된다. */
      video: asset('/images/gh-biz-gwanggyo/slide.webp'),
      bottomColumns: [
        '작업하며 추가로 신경 썼던 부분은 공공적인/기술적인/신뢰적인 느낌에서도 감성적인 느낌을 놓치고 싶지 않은데? 였어요. 그래서 신경써봤던게 로고의 SVG 변형 애니메이션(으쌰! 하는 느낌!)과 공간을 가져오는 듯한 슬라이드였습니다.',
        '특히 슬라이드의 경우에는 작업하고 꽤나 만족했던 (^^ ) 결과물입니다. 흑백에서 - 컬러로 전환이 되며 공간을 가져오는 듯한 느낌이 사용자와 상호작용할 때 제법 감성적으로 느껴지는 사용자 경험을 주었다고 생각합니다.',
      ],
    },
  },
]

/* 날짜는 기본으로 71일 간격, 22.01.01 부터. 실제 날짜를 아는 판은 date 로
   덮어쓴다. (하단 레인지의 끝은 마지막 판의 날짜) */
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
