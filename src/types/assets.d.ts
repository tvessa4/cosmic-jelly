// Разрешаем TypeScript импортировать звуковые файлы через require/import.
declare module '*.wav' {
  const asset: number;
  export default asset;
}
