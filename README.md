# I CAN DO!

디자인 작업 중인 정적 사이트. 팀 엠블럼과 I CAN DO! 텍스트를 나란히 배치한 헤더, 스크롤에 따라 우주에서 지상으로 이어지는 전체 화면 배경을 구현했습니다.

- `index.html`: 첫 화면의 질문, 동아리 시작 동기, 활동 타임라인, 미래와 비전, 소개 영상, FAQ로 이어지는 여섯 개 스크롤 구간과 헤더
- `styles.css`: 고정 배경, 반응형 로고, 스크롤 안내와 행성 구간 표식
- `scene.js`: 우주·지상 Canvas 렌더링, 태양 → 행성 → 지구 구간 표식의 위치와 현재 구간 갱신
- `assets/team-emblem-transparent.png`: 외부 흰 배경을 투명하게 처리한 엠블럼 (헤더·파비콘)
- `assets/team-emblem.png`: 사용자가 제공한 CAN-SAT 2026 엠블럼 원본
- `assets/i-can-do-logo.svg`: 보관한 CAN 캔위성 로고 시안
- `assets/i-can-do-cansat-logo.svg`: 캔위성 로고 작업본
- `CNAME`: 기존 도메인 설정
- `assets/club-introduction.mp4`: 페이지 맨 아래에서 재생할 수 있는 동아리 소개 영상 (H.264/AAC, 약 5분 52초)
- `assets/club-introduction-poster.jpg`: 소개 영상의 재생 전 미리보기
- `assets/opencansat-model.png`: 페이지 맨 아래 3D 모델링 이미지. 출처: [OpenCanSat](https://github.com/CWS-2026/OpenCanSat/blob/main/hardware/mechanical/OpenCanSat.png). FAQ와 독립적으로 표시합니다.

로컬 미리보기: `python3 -m http.server 8765 --bind 127.0.0.1`

하단 지상 구간에는 반응형 소개 영상 플레이어가 있습니다. 재생 버튼을 누르면 소리와 함께 재생되며, 기본 재생 컨트롤과 전체화면, 모바일 인라인 재생을 지원합니다. 초기 로딩에서는 메타데이터만 요청하고, 영상을 직접 내려받는 링크도 제공합니다. MP4는 재인코딩 없이 메타데이터를 파일 앞쪽으로 옮겨 웹 재생 시작에 맞췄습니다.

## FAQ 카드뉴스

소개 영상 다음에는 제공된 FAQ 카드뉴스 90장을 한 장씩 넘겨 읽는 문서 뷰어로 표시합니다. 프로젝트 전반(35장), 설계와 기술(35장), 실험과 교육(20장) 분류와 질문 검색은 유지합니다. 검색·분류 결과에 해당하는 페이지만 순서대로 넘기며, 페이지 번호를 입력해 바로 이동할 수 있습니다.

- `assets/faq/*.jpg`: 제공된 1920×1080 JPG 원본 90장. 답변과 원본 문구는 변경하지 않았습니다.
- `assets/faq/icando-faq.pdf`: JPG 원본을 순서대로 담은 90페이지 가로형 PDF. 다운로드용이며 초기 로딩에서는 가져오지 않습니다.
- `assets/faq/cards.js`: 원본 카드와 연결되는 번호, 분류, 읽기 쉽게 줄인 질문 제목.
- `faq.html`: FAQ 헤더, 검색·분류, 문서 뷰어의 마크업. `faq.js`가 정적 파일로 불러옵니다.
- `faq.js`, `faq.css`: 검색·분류·한 장씩 넘기기·확대·전체화면. 외부 라이브러리나 서버 API는 사용하지 않습니다.

별도 팝업 없이 페이지 안에서 이전/다음 버튼으로 읽습니다. 뷰어에 포커스가 있을 때 좌우 화살표와 Home/End 키로도 넘길 수 있으며, 페이지 번호 입력 중에는 해당 단축키가 작동하지 않습니다. 모바일에서는 확대하지 않은 페이지를 좌우로 밀어 넘길 수 있습니다. 확대 상태에서는 가로·세로 스크롤로 글씨를 읽고, 지원되는 브라우저에서는 전체화면도 사용할 수 있습니다. 전체 PDF 다운로드와 현재 JPG 원본 열기를 제공합니다. JavaScript나 FAQ 마크업 로딩을 사용할 수 없어도 메인 페이지의 PDF 링크는 남습니다.

FAQ는 임시 기능으로 분리했습니다. 나중에 제거할 때는 `faq.html`, `faq.js`, `faq.css`, `assets/faq/`를 지우고 `index.html`에서 FAQ 스타일·모듈 참조, `#faq` 마운트, 영상 아래 FAQ 링크, FAQ 구간 이동 링크를 제거하면 됩니다. 마지막 EARTH 링크는 `#ground`로 돌립니다. 배경 렌더링(`scene.js`)과 기존 사이트 스타일(`styles.css`)에는 FAQ 로직을 넣지 않았습니다.

전체 배경은 외부 이미지나 라이브러리 없이 코드로 그리는 시각 연출입니다. 천체 크기와 위치, 지형은 실제 태양계나 지구의 축척을 표현하지 않습니다. 스크롤·화면 크기가 바뀔 때만 다시 그리며, 지속 애니메이션이나 네트워크 요청은 없습니다. 동작 줄이기 설정에서는 앵커 이동을 즉시 수행합니다.

캔버스 크기는 실제 해상도가 바뀔 때만 갱신합니다. 별 배경은 저장한 이미지를 재사용하고, 별도의 캔버스에 장면을 완성한 뒤 화면에 한 번에 표시합니다. 배경 해상도는 약 400만 픽셀 이내로 제한해 큰 화면의 그래픽 메모리 부담을 줄입니다. 현재 구간 표시는 구간이 바뀔 때만 갱신하며, 작은 캔위성이 진행 위치를 나타냅니다. 캔 위의 낙하산은 하강 진행률에 따라 펼쳐지고, 위로 스크롤하면 다시 접힙니다. 줄과 천은 캔 바로 위의 연결점을 기준으로 함께 움직입니다.

활동 타임라인은 지난 다섯 활동부터 ARES와의 추가 임무 구현까지 한 줄로 연결합니다. 충북진로교육원 교육기부와 추가 임무 구현 사이에 작은 화살표를 표시합니다. 넓은 화면에서는 가로선의 위아래에 내용을 배치하고, 좁은 화면에서는 세로선을 따라 읽도록 표시하며 화살표도 아래를 향합니다. 연결선은 CSS로 표시하며 추가 애니메이션이나 라이브러리를 사용하지 않습니다.

타임라인 다음에는 ‘우리의 미래와 비전’을 배치했습니다. ‘우주를 향한 호기심을, 함께 도전하는 힘으로.’라는 문구와 함께 더 깊이 탐구하기, 함께 성장하기, 배움을 나누기의 세 방향을 소개합니다. 오른쪽 구간 표시에서도 비전으로 이동할 수 있습니다.

지상 풍경은 사용자가 제공한 전라남도 고흥군 고흥읍 첨단미래로 291의 사진들을 참고해 그렸습니다. 낮은 산 능선, 잔디, 넓은 포장 구역과 바닥 이음선, 흰 천막, 격자형 발사대와 흰 로켓을 표현합니다. 1600×1000 캔버스에 한 번 그린 뒤 하강 구간에서 재사용하며, 세로 화면에서는 발사대를 중심으로 구도를 맞춥니다. 사진을 그대로 사용하거나 실제 시설의 측량·축척을 재현한 것은 아닙니다.

## 엠블럼 투명화

- 도구: 내장 Imagegen 편집
- 출력: `assets/team-emblem-transparent.png` (실제 알파 채널 포함)
- 입력: `assets/team-emblem.png`
- 사용 프롬프트:

> Use case: background-extraction. Edit target: supplied CAN-SAT 2026 crest. Remove ONLY the outside white rectangular background and exterior negative-space gaps between the crossed implements, laurel leaves and the circular crest. Make these exterior regions genuinely transparent alpha. Preserve the whole original emblem exactly: its navy circle, cream ribbon interiors, cream leaves, outlines, all three parachuting CanSats, the exact text CAN-SAT and 2026, crossed pen nib and paintbrush, colors, proportions and fine line work. The cream/white regions INSIDE the emblem are part of the artwork and must remain opaque. Do not redraw, redesign, add a border, shadow, glow or background. Output a clean sharp transparent PNG cutout suitable for a dark website header.
