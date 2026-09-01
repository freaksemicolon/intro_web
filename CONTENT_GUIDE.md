# 포트폴리오 프로젝트 Markdown 관리 가이드

이 문서는 프로젝트, 수상, 교육, 대외활동, 인턴십 기록을 포트폴리오에 추가하는 방법을 설명합니다.

## 1. 파일을 넣는 위치

한국어 원문은 `data/specs/`에 넣습니다. 영문 문서는 한국어 파일과 **완전히 같은 파일명**으로 `data/specs/en/`에 넣습니다.

```text
data/specs/18_새로운프로젝트.md
data/specs/en/18_새로운프로젝트.md
```

영문 파일은 `data/specs/index.md`에 따로 등록하지 않습니다. 사이트가 현재 언어에 맞는 파일을 자동으로 불러옵니다.

## 2. 사용할 수 있는 카테고리

| 값 | 사용하는 경우 | 화면에 나오는 위치 |
| --- | --- | --- |
| `프로젝트` | 직접 개발한 제품, 연구 또는 개인·팀 프로젝트 | 프로젝트 필터, 카드, 이력서 프로젝트 |
| `수상` | 대회 수상, 교내상, 공모전 결과 | Experience 수상 그룹, 이력서 수상 경력 |
| `교육` | 강의, 부트캠프, 교육과정, 수료증 | Experience 교육 그룹, 이력서 교육 및 자격 |
| `대외활동` | 동아리, 기업 POC, 커뮤니티, 리더 활동 | Experience 대외활동 그룹, 이력서 대외활동 |
| `인턴십` | 회사 또는 연구기관 인턴 | Experience 인턴십 그룹, 이력서 경력 |

카테고리는 기술적으로 자유롭게 추가할 수 있습니다. `연구`, `창업`, `봉사활동`처럼 새 값을 쓰면 Experience에 새로운 그룹이 생깁니다. 같은 종류에는 항상 같은 표현을 사용하세요.

영문 파일에서는 다음 값을 권장합니다.

| 한국어 | 영어 |
| --- | --- |
| 프로젝트 | `Projects` |
| 수상 | `Awards` |
| 교육 | `Education` |
| 대외활동 | `Activities` |
| 인턴십 | `Internships` |

## 3. 프로젝트 상태값

`status`에는 아래 영문 코드만 입력합니다. 화면에서는 언어에 맞게 자동 표시됩니다.

| 입력값 | 한국어 표시 | 영어 표시 |
| --- | --- | --- |
| `development` | 개발 중 | In development |
| `completed` | 완료 | Completed |
| `operating` | 운영 중 | Operating |

수상·교육·종료된 활동은 일반적으로 `completed`를 사용합니다.

## 4. Frontmatter 항목

Markdown 가장 위의 `---` 사이에 프로젝트 정보를 입력합니다.

| 항목 | 필수 | 설명 | 예시 |
| --- | --- | --- | --- |
| `title` | 필수 | 카드와 상세 페이지 제목 | `AI 식물 관리 서비스` |
| `organization` | 필수 | 회사, 학교, 팀 또는 주최 기관 | `Rootive` |
| `category` | 필수 | 프로젝트 분류 | `프로젝트` |
| `date` | 필수 | 시작일 또는 대표 날짜 | `2026-09-02` |
| `updated` | 권장 | 마지막 수정일 | `2026-09-02` |
| `status` | 권장 | 개발·완료·운영 상태 | `operating` |
| `featured` | 선택 | 홈에서 우선 노출할지 여부 | `true` 또는 `false` |
| `short_description` | 권장 | 카드와 상세 상단의 한 문장 | `AI로 식물 상태를 분석하는 서비스` |
| `tags` | 선택 | 쉼표로 구분한 기술·분야 | `React, FastAPI, AI` |
| `image` | 선택 | 대표 이미지 | `data/specs/img/example.webp` |
| `github` | 선택 | GitHub 주소 | `https://github.com/...` |
| `demo` | 선택 | 서비스·데모 주소 | `https://example.com` |
| `award_link` | 선택 | 수상 결과·증빙 주소 | `https://example.com/award` |
| `link` | 선택 | 기타 관련 페이지 | `https://example.com/article` |
| `link_label` | 선택 | `link` 버튼 이름 | `관련 기사` |

`featured: true`인 문서는 자동 정렬할 때 일반 문서보다 먼저 배치됩니다.

## 5. 한국어 프로젝트 전체 예시

```md
---
title: AI 식물 관리 서비스
organization: Rootive
category: 프로젝트
date: 2026-09-02
updated: 2026-09-02
status: operating
featured: true
short_description: 사진과 센서 데이터를 활용해 식물 상태를 분석하고 관리 방법을 안내하는 서비스
tags: React Native, FastAPI, Python, Computer Vision
image: data/specs/img/plant-service.webp
github: https://github.com/아이디/저장소
demo: https://example.com
award_link: https://example.com/award
link: https://example.com/article
link_label: 관련 기사
---

# 프로젝트 개요

사용자가 식물 사진을 촬영하면 식물 종류와 현재 상태를 분석하고,
관리 방법과 기록 기능을 제공하는 모바일 서비스입니다.

## 시작 배경과 문제

식물 관리 정보가 여러 사이트에 흩어져 있어 사용자가 현재 상태에 맞는
행동을 결정하기 어렵다는 문제를 발견했습니다.

## 참여 인원과 담당 역할

- 참여 인원: 4명
- 담당 역할: 개발 리더, 앱과 백엔드 개발
- 직접 구현한 부분: 화면 구조, API, 분석 결과 표시, 배포 환경

## 구현한 기능

- 식물 사진 업로드와 종류 인식
- 상태 및 질병 가능성 분석
- 분석 결과 기반 관리 방법 추천
- 식물별 관리 기록 저장

## 사용 기술

- React Native: iOS·Android 앱 화면 개발
- FastAPI: 분석 API와 앱 데이터 연동
- Python: 이미지 전처리와 모델 추론

## 문제 해결 과정

분석 결과가 사용자에게 어렵게 보이는 문제가 있었습니다. 모델의 원시 결과를
그대로 보여주지 않고 상태, 원인, 권장 행동의 세 단계로 다시 구성했습니다.

## 결과 및 성과

- 핵심 사용자 흐름을 실제 작동하는 앱으로 구현
- 분석부터 관리 기록까지 하나의 서비스로 연결
- 대회에서 우수상 수상

## 배운 점

높은 모델 정확도뿐 아니라 사용자가 결과를 이해하고 다음 행동을 선택할 수 있게
설계하는 것이 제품에서 중요하다는 점을 배웠습니다.
```

본문 제목은 자유롭게 바꿀 수 있습니다. 상세 페이지의 자동 목차는 `#`, `##`, `###` 제목을 기준으로 생성됩니다.

## 6. 같은 프로젝트의 영문 예시

영어 모드에 한국어가 나타나지 않게 하려면 영문 파일의 제목, 기관, 카테고리, 한 줄 설명과 본문을 영어로 작성합니다.

```md
---
title: AI Plant Care Service
organization: Rootive
category: Projects
short_description: A service that analyzes plant health and recommends care actions
link_label: Related article
---

# Overview

This mobile service identifies a plant and analyzes its condition from a photo,
then provides care guidance and a personal management history.

## Problem

Plant-care information is fragmented across multiple sources, making it difficult
for users to choose the right action for the plant's current condition.

## Team and Role

- Team size: 4
- Role: Development lead, mobile and backend developer
- Contribution: Interface architecture, APIs, analysis results, and deployment

## Key Features

- Plant-image upload and species recognition
- Health and possible-disease analysis
- Personalized care recommendations
- Plant-specific care history

## Technologies

- React Native for the iOS and Android application
- FastAPI for analysis APIs and application data
- Python for image preprocessing and model inference

## Problem-Solving Process

Raw model output was difficult to understand. I reorganized it into three clear
layers: condition, possible cause, and recommended action.

## Outcome

- Delivered a working end-to-end mobile experience
- Connected analysis, guidance, and care history in one service
- Received an Excellence Award
```

영문 파일에서는 날짜, 상태, 이미지, GitHub 등의 값을 생략해도 한국어 원문의 값이 유지됩니다. 영어 화면에서 바뀌어야 하는 텍스트만 다시 작성하면 됩니다.

## 7. 이미지 추가 방법

이미지는 `data/specs/img/`에 넣는 것을 권장합니다.

대표 이미지:

```yaml
image: data/specs/img/plant-service.webp
```

본문 이미지:

```md
![식물 분석 결과 화면](data/specs/img/plant-result.webp)
```

권장 사항:

- 가능하면 WebP 사용
- 파일명에는 공백보다 `-` 또는 `_` 사용
- 큰 원본은 웹용 크기로 축소
- 한국어와 영어 문서에서 같은 이미지 재사용 가능
- 이미지 이름을 바꾸면 Markdown 경로도 함께 변경

## 8. 목록 등록과 자동 정렬

파일 추가 후 프로젝트 폴더에서 실행합니다.

```powershell
npm run content:fix
```

`data/specs/index.md`가 다음 순서로 자동 생성됩니다.

1. `featured: true`
2. 최신 `date`
3. 파일명

`updated`가 없으면 실제 파일 수정일이 입력되고, `status`가 없으면 `completed`가 입력됩니다.

직접 등록하려면 `data/specs/index.md`에 다음처럼 추가합니다.

```md
- [AI 식물 관리 서비스](18_새로운프로젝트.md)
```

## 9. 검사 명령

```powershell
npm run check
```

다음을 검사합니다.

- `title`, `organization`, `category`, `date` 누락
- `status`, `updated` 누락
- 대표 이미지와 본문 이미지·내부 링크 오류
- 같은 이름의 영문 문서 누락

추가 명령:

| 명령 | 기능 |
| --- | --- |
| `npm run content:fix` | 수정일 입력 및 프로젝트 목록 자동 정렬 |
| `npm run content:links` | 외부 링크 상태까지 검사 |
| `$env:SITE_URL="https://www.jangsw.com"; npm run sitemap` | sitemap과 robots 파일 생성 |

## 10. 추가하면 자동으로 나타나는 위치

- 홈의 선택 프로젝트 카드
- Experience의 카테고리별 타임라인
- 프로젝트 목록과 카테고리 필터
- 프로젝트 상세 페이지와 자동 목차
- 상태 배지
- 이전·다음 프로젝트 이동
- GitHub, Demo, Award, 관련 페이지 버튼
- 카테고리에 따른 이력서 영역

## 11. 자주 발생하는 오류

### 카드가 나타나지 않음

- `data/specs/index.md` 등록 여부 확인
- 또는 `npm run content:fix` 실행
- 실제 파일명과 링크가 같은지 확인

### 상세 페이지에서 404가 나옴

- `index.md` 파일명 오타 확인
- 확장자가 `.md`인지 확인
- 파일명 끝의 불필요한 공백 확인

### 영어 모드에서 한국어가 보임

- `data/specs/en`에 같은 파일명의 영문 문서가 있는지 확인
- 영문 제목, 기관, 카테고리, 한 줄 설명과 본문 확인

### 이미지가 보이지 않음

- 대소문자를 포함해 실제 이미지 이름과 경로가 같은지 확인
- `data/specs/img/파일명.webp` 형식인지 확인
- `npm run check` 실행

## 12. 가장 간단한 추가 순서

1. 기존 프로젝트 Markdown 하나를 복사합니다.
2. 파일명을 `18_프로젝트명.md`처럼 변경합니다.
3. frontmatter와 한국어 본문을 수정합니다.
4. 같은 파일명으로 `data/specs/en`에 영문 문서를 만듭니다.
5. 이미지를 `data/specs/img`에 넣습니다.
6. `npm run content:fix`를 실행합니다.
7. `npm run check` 결과가 오류 0인지 확인합니다.
8. 로컬 사이트에서 한국어와 영어 모드를 각각 확인합니다.
