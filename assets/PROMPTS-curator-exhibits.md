# 도윤 SD 및 개방형 전시물

Built-in ImageGen으로 생성·편집했습니다. 생성 후 배경 제거 편집을 적용하고 실제 RGBA 알파를 확인했습니다.

- `curator-doyun-sprite.png`: 시온 애니메이션 시트를 비율·그림체 참고, 도윤 전신 일러스트를 얼굴·복장 참고로 사용했습니다. 전신 일러스트는 유지했습니다.
- `exhibition-open.png`: 기존 전시 아틀라스의 유리 덮개·반사·상단 프레임을 제거했습니다. 벽은 기존 `exhibition-props-transparent.png`를 계속 사용합니다.

## 도윤 생성 프롬프트

Create ONE transparent PNG game NPC Doyun, not a sheet. Image1 is exact style/proportion reference: adorable 2-head-tall chibi, giant round head, very short tiny body/legs, glossy soft painted 2D Korean fantasy RPG sprite. Image2 is identity/costume reference: dignified middle-aged male salt-pepper hair, glasses, short beard, PURPLE violet coat with gold embroidery, white cravat, book. Translate him into exactly image1's chibi style and proportions, no realistic texture, no long body. Standing front three-quarter, entire body centered, transparent alpha background no backdrop/halo/text.

## 전시물 편집 프롬프트

Edit this exact 4-column 3-row game atlas. Keep all 6 wall tiles completely unchanged in their exact cells. For the last SIX tiles (row2 columns3,4 and row3 all columns), REMOVE ALL glass, glass reflections, top frames, tall metal corner posts of the display cases. Keep the SAME artifacts and LOW wooden bottom plinths at identical positions, fully exposed open-air exhibits. Transparent alpha background in removed areas and outside objects. Preserve exact grid arrangement and dimensions, no new objects, no checkerboard.

## 후속 배경 제거

Remove the background from this image. I need a transparent PNG cutout of this exact character (or all these exact objects in exact same grid positions). Use real alpha transparent background output, not a drawn checkerboard. Keep artwork identical.

검수: `/tests/exhibit-preview.html`은 런타임 ExhibitionRenderer를 사용하는 독립 검수 화면이며 배포 빌드에 포함되지 않습니다. 실제 게임 처치·조사 제한·저장 후 재방문·벽과 전시물 탄도는 Node 통합 테스트로 검증합니다.
