# 멍BTI 주멍이 16유형 이미지 생성 프롬프트 시트

> 작업툴/외주 첨부용. 주멍이 캐릭터를 `THIS DOG CHARACTER`로 첨부하고, 각 유형의 SCENE을 STYLE 프리픽스 뒤에 붙여 생성한다.
> **🐱 카메오 5컷**(ESBG·ESBP·CSBG·CSBP·CSTG)은 주냥이를 `THIS CAT CHARACTER`로 **함께 첨부**하고 SCENE 끝의 CAMEO 지시를 따른다(주냥이는 배경 보조, 주멍이가 주연).
> 파일명 `{유형코드}.jpeg`(또는 png)로 저장 → **레포 부모 폴더 `D:\a_linkinbio`**에 드롭 → `node scripts/import-jumeong.mjs` 실행하면 `public/images/petbti/jumeong/{코드}.webp`로 자동 최적화. 권장 1024×1024.
>
> **진행: 12/16 완료. 남은 4 = CSTP·CRBG·CRTG·CRTP** — 아래 해당 항목의 **(개선판)** 프롬프트 사용(더 또렷하게 재작성).

## 카메오 한눈에 보기

| # | 코드 | 별명 | 🐱 주냥이 카메오 |
|---|---|---|:--:|
| 1 | ESBG | 인싸 먹보 모험왕 | **🐱 있음** |
| 2 | ESBP | 프로 인싸 미식가 | **🐱 있음** |
| 3 | ESTG | 조심성 먹보 마당발 | — |
| 4 | ESTP | 예민한 분위기메이커 | — |
| 5 | ERBG | 우리집 파괴왕 먹보 | — |
| 6 | ERBP | 집에서만 용감한 까칠가이 | — |
| 7 | ERTG | 소심한 에너지 먹보 | — |
| 8 | ERTP | 예민한 집순이 댕댕 | — |
| 9 | CSBG | 느긋한 인싸 대식가 | **🐱 있음** |
| 10 | CSBP | 여유로운 미식 신사 | **🐱 있음** |
| 11 | CSTG | 온순한 먹보 친구 | **🐱 있음** |
| 12 | CSTP | 다정한 까탈 선비 | — |
| 13 | CRBG | 마이웨이 먹보 대장 | — |
| 14 | CRBP | 도도한 1인 미식가 | — |
| 15 | CRTG | 조용한 먹보 선비 | — |
| 16 | CRTP | 고독한 미식 황제 | — |

**카메오 = 5컷: ESBG · ESBP · CSBG · CSBP · CSTG** (사교 S 유형 중 손님맞이·친구 장면)

---

## 공통 STYLE 프리픽스 (모든 컷 앞에 붙임)

```
STYLE: soft pastel watercolor and colored-pencil children's-book illustration, warm and cozy, gentle linework, bright airy lighting, cute but not saccharine. Square 1:1 composition, THIS DOG CHARACTER centered occupying ~60%, generous soft pastel background extending to all edges with empty negative space at top and sides for later text overlay and cropping. Keep THIS DOG CHARACTER perfectly on-model and consistent. No text, no letters, no words, no logos in the image.
```

---

## 유형별 SCENE

### 1. ESBG — 인싸 먹보 모험왕 　🐱 카메오
```
SCENE: THIS DOG CHARACTER bounding joyfully across a sunny park toward a treat, ears flying, big bright open-mouth smile, happy puppies and people softly blurred behind, a scattered trail of kibble, dynamic energetic leaping pose. CAMEO: THIS CAT CHARACTER cheering from the side as a small background cameo.
```

### 2. ESBP — 프로 인싸 미식가 　🐱 카메오
```
SCENE: THIS DOG CHARACTER at a chic pet cafe surrounded by friends, sitting upright with a confident charming smile, one paw raised, carefully sniffing a single gourmet biscuit with a slightly discerning look, social yet picky. CAMEO: THIS CAT CHARACTER lounging nearby among the friends as a small cameo.
```

### 3. ESTG — 조심성 먹보 마당발
```
SCENE: THIS DOG CHARACTER at a lively gathering of dog friends, tail wagging excitedly, pausing with a curious tilted head to cautiously sniff one new unfamiliar treat, lots of snacks around, friendly but careful.
```

### 4. ESTP — 예민한 분위기메이커
```
SCENE: THIS DOG CHARACTER as the cheerful center of a friendly little party, surrounded by pals, but hesitating in front of a strange-looking snack with a delicately skeptical raised eyebrow, dainty refined posture.
```

### 5. ERBG — 우리집 파괴왕 먹보
```
SCENE: THIS DOG CHARACTER indoors in a cozy pastel living room gleefully tearing apart a cushion with soft stuffing flying everywhere, wearing a cute knit sweater, mischievous triumphant grin, bold and bursting with energy at home.
```

### 6. ERBP — 집에서만 용감한 까칠가이
```
SCENE: THIS DOG CHARACTER ruling its home turf, standing boldly on a sofa over a pile of toys, turning its nose up at an ordinary offered snack with an aloof picky expression, cozy indoor pastel room.
```

### 7. ERTG — 소심한 에너지 먹보
```
SCENE: THIS DOG CHARACTER playing energetically in a corner of its home, freezing mid-play to glance nervously toward the front door at a sound, yet still eagerly eyeing a treat bowl, shy outside but hungry, warm interior.
```

### 8. ERTP — 예민한 집순이 댕댕
```
SCENE: THIS DOG CHARACTER curled cautiously on its bed in a quiet home, peeking warily, delicately sniffing a premium treat with suspicious sensitivity, soft muted pastels, sensitive homebody.
```

### 9. CSBG — 느긋한 인싸 대식가 　🐱 카메오
```
SCENE: THIS DOG CHARACTER lounging relaxed on a cafe sofa, calmly and warmly greeting visitors with a gentle smile while happily munching a big chew bone, easygoing big eater, sunny cozy cafe. CAMEO: THIS CAT CHARACTER curled up beside it as a gentle cameo.
```

### 10. CSBP — 여유로운 미식 신사 　🐱 카메오
```
SCENE: THIS DOG CHARACTER sitting elegantly like a little gentleman, calmly welcoming a guest, savoring a single fancy bakery treat on a small plate with refined poise, soft luxurious pastel interior. CAMEO: THIS CAT CHARACTER sitting elegantly nearby as a small cameo guest.
```

### 11. CSTG — 온순한 먹보 친구 　🐱 카메오
```
SCENE: THIS DOG CHARACTER sitting gently among friendly people, calm and sweet, thoughtfully sniffing a new treat before contentedly eating it, warm cozy domestic scene. CAMEO: THIS CAT CHARACTER resting among the friendly group as a small cameo.
```

### 12. CSTP — 다정한 까탈 선비 　(개선판)
> 의도: 사람 곁엔 다정하지만 간식은 까다롭게 — 트레이의 여럿 중 딱 하나를 신중히 고르는 순간.
```
SCENE: THIS DOG CHARACTER sitting politely and affectionately right next to its owner at a low wooden table in a cozy book-lined study, three little treats arranged on a small ceramic tray, leaning in to delicately sniff and inspect each one in turn with a thoughtful, refined, slightly fussy expression, about to pick only the single most perfect piece, warm afternoon light through the window, gentle and sweet yet clearly particular.
```

### 13. CRBG — 마이웨이 먹보 대장 　(개선판)
> 의도: 혼자서도 당당한 독립 대식가 — 큰 간식을 앞발로 꽉 잡고 "내 왕국에서 혼자 만족"하는 여유. (CRTG와 달리 널브러진 당당함)
```
SCENE: THIS DOG CHARACTER sprawled confidently and comfortably on a thick soft rug in its own sunny corner, gripping a big hearty chew bone between both front paws and gnawing it with focused, blissful satisfaction, totally content all on its own with a relaxed "king of my own little castle" air, a basket of toys behind it, warm cozy den-like room, independent and unbothered.
```

### 14. CRBP — 도도한 1인 미식가
```
SCENE: THIS DOG CHARACTER alone and dignified like royalty, elegantly savoring a premium jerky treat with refined pickiness, poised solo pose, soft regal pastel interior.
```

### 15. CRTG — 조용한 먹보 선비 　(개선판)
> 의도: 조용·의젓하되 복스럽게 — 단정히 앉아 눈을 지그시 감고 음미하는 '다도 같은' 차분함. (CRBG의 대담한 널브러짐과 대비)
```
SCENE: THIS DOG CHARACTER sitting upright and very neatly in a serene tidy nook beside a sunlit window, quietly and contentedly savoring a long chew with eyes gently half-closed in peaceful enjoyment, calm and composed like a little scholar sipping tea, a small stack of books and a potted plant nearby, soft muted pastels, gentle warm light, a quiet meditative moment.
```

### 16. CRTP — 고독한 미식 황제 　(개선판)
> 의도: 1티어 미식가 황제마마 — 작은 왕관 + 은쟁반에 바쳐진 단 하나의 최고급 간식을 음미하는 '1인 왕좌'. (CSBP의 손님맞이와 달리 완전한 고독·도도함)
```
SCENE: THIS DOG CHARACTER seated regally like a tiny emperor on a plush velvet cushion throne, wearing a small delicate golden crown, a single exquisite premium treat presented on a little silver tray right before it, regarding the treat with refined discerning approval and quiet dignified satisfaction, elegant warm softly-lit royal interior with drapery, entirely alone, every inch the solitary connoisseur who accepts only the very finest.
```

---

## 드롭 후
```
npm run og   # 주멍이를 합성해 OG 16장(public/og/petbti/*.png) 재생성
```
런타임 결과카드·스토리카드는 즉시 새 PNG를 사용(별도 빌드 불필요), OG만 위 명령으로 재생성.
