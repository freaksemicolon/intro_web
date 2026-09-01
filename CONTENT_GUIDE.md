# 포트폴리오 콘텐츠 관리

프로젝트 문서는 `data/specs`에 추가하고 `npm run content:fix`를 실행하면 `featured` 우선, 최신 날짜순으로 `index.md`가 다시 만들어집니다.

권장 frontmatter:

```yaml
---
title: 프로젝트 이름
organization: 팀 또는 기관
category: 프로젝트
date: 2026-08-27
updated: 2026-08-27
featured: true
status: development # development, completed, operating
tags: React, Python, AI
image: data/specs/img/example.webp
github: https://github.com/...
demo: https://...
award_link: https://...
---
```

- `npm run check`: 필수 항목, 이미지·내부 링크, 영문 번역 누락 검사
- `npm run content:fix`: 프로젝트 목록 자동 정렬
- `npm run content:links`: 외부 링크까지 확인(인터넷 필요)
- `$env:SITE_URL="https://아이디.github.io"; npm run sitemap`: 배포 주소에 맞는 sitemap과 robots 생성

이미지는 브라우저에서 원본 비율로 표시됩니다. WebP 변환은 원본 손실과 품질 선택이 필요하므로 자동 덮어쓰지 않습니다. 배포 전 이미지 도구에서 WebP로 내보낸 뒤 `image` 경로를 변경하세요.
