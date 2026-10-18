# I CAN DO!

디자인 작업 중인 정적 사이트. 팀 엠블럼과 I CAN DO! 텍스트를 나란히 배치한 헤더, 스크롤에 따라 우주에서 지상으로 이어지는 전체 화면 배경을 구현했습니다.

- `index.html`: 첫 화면의 질문, 프로젝트 시작 동기, 다섯 개 스크롤 구간과 헤더
- `styles.css`: 고정 배경, 반응형 로고, 스크롤 안내와 행성 구간 표식
- `scene.js`: 우주·지상 Canvas 렌더링, 태양 → 행성 → 지구 구간 표식의 위치와 현재 구간 갱신
- `assets/team-emblem-transparent.png`: 외부 흰 배경을 투명하게 처리한 엠블럼 (헤더·파비콘)
- `assets/team-emblem.png`: 사용자가 제공한 CAN-SAT 2026 엠블럼 원본
- `assets/i-can-do-logo.svg`: 보관한 CAN 캔위성 로고 시안
- `assets/i-can-do-cansat-logo.svg`: 캔위성 로고 작업본
- `CNAME`: 기존 도메인 설정

로컬 미리보기: `python3 -m http.server 8765 --bind 127.0.0.1`

전체 배경은 외부 이미지나 라이브러리 없이 코드로 그리는 시각 연출입니다. 천체 크기와 위치, 지형은 실제 태양계나 지구의 축척을 표현하지 않습니다. 스크롤·화면 크기가 바뀔 때만 다시 그리며, 지속 애니메이션이나 네트워크 요청은 없습니다. 동작 줄이기 설정에서는 앵커 이동을 즉시 수행합니다.

캔버스 크기는 실제 해상도가 바뀔 때만 갱신합니다. 별 배경은 저장한 이미지를 재사용하고, 별도의 캔버스에 장면을 완성한 뒤 화면에 한 번에 표시합니다. 배경 해상도는 약 400만 픽셀 이내로 제한해 큰 화면의 그래픽 메모리 부담을 줄입니다. 현재 구간 표시는 구간이 바뀔 때만 갱신하며, 작은 캔위성이 진행 위치를 나타냅니다. 캔 위의 낙하산은 하강 진행률에 따라 펼쳐지고, 위로 스크롤하면 다시 접힙니다. 줄과 천은 캔 바로 위의 연결점을 기준으로 함께 움직입니다.

## 엠블럼 투명화

- 도구: 내장 Imagegen 편집
- 출력: `assets/team-emblem-transparent.png` (실제 알파 채널 포함)
- 입력: `assets/team-emblem.png`
- 사용 프롬프트:

> Use case: background-extraction. Edit target: supplied CAN-SAT 2026 crest. Remove ONLY the outside white rectangular background and exterior negative-space gaps between the crossed implements, laurel leaves and the circular crest. Make these exterior regions genuinely transparent alpha. Preserve the whole original emblem exactly: its navy circle, cream ribbon interiors, cream leaves, outlines, all three parachuting CanSats, the exact text CAN-SAT and 2026, crossed pen nib and paintbrush, colors, proportions and fine line work. The cream/white regions INSIDE the emblem are part of the artwork and must remain opaque. Do not redraw, redesign, add a border, shadow, glow or background. Output a clean sharp transparent PNG cutout suitable for a dark website header.
