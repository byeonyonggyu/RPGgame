# 모바일 앱 패키징 준비

현재는 웹 게임과 Capacitor 설정이며 네이티브 프로젝트와 서명된 앱은 아직 생성하지 않았습니다.

1. npm run build로 dist/를 생성합니다. 웹 배포는 HTTPS 정적 호스팅을 사용합니다.
2. capacitor.config.json의 appId를 배포용 고유 식별자로 확정합니다.
3. 공식 가이드에 맞는 Node, Android Studio와 SDK를 준비합니다. iOS는 macOS와 Xcode가 필요합니다.
4. npm install @capacitor/core @capacitor/android @capacitor/ios 및 npm install -D @capacitor/cli로 동일 메이저 버전의 의존성을 설치하고 lockfile을 보관합니다.
5. npx cap add android (iOS는 npx cap add ios), npx cap sync를 실행합니다. add는 최초 한 번, 변경 후에는 build와 sync를 반복합니다.
6. Android MainActivity에 android:screenOrientation="sensorLandscape"를 설정합니다. iOS Supported Interface Orientations는 Landscape Left/Right로 지정하고 iPad 설정도 확인합니다. 웹 잠금 요청만으로 네이티브 방향 설정을 대신하지 않습니다.
7. npx cap open android 또는 npx cap open ios로 열어 실제 기기의 다중 터치·안전 영역·백그라운드 복귀·소리·저장·오프라인 시작을 검증합니다.
8. 플랫폼별 서명, 릴리스 빌드와 스토어 심사 자료를 준비합니다. 이 단계는 이번 작업에서 실행하지 않았습니다.

참고: [Capacitor 설정](https://capacitorjs.com/docs/config), [방향 API](https://capacitorjs.com/docs/apis/screen-orientation), [브라우저 잠금 제약](https://developer.mozilla.org/en-US/docs/Web/API/ScreenOrientation/lock).
