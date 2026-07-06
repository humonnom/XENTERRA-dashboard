import { defineConfig } from 'vitest/config'

// core 순수 함수 테스트 전용 설정 (JSX/React 불필요, node 환경)
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
