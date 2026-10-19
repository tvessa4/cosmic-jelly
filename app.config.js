// Дополняет app.json настройками, которые зависят от окружения.
// EXPO_BASE_URL задаётся при сборке сайта для GitHub Pages: игра живёт по адресу
// https://<ник>.github.io/cosmic-jelly/, поэтому все файлы должны грузиться из /cosmic-jelly.
// При обычной разработке переменная пустая и ничего не меняется.

module.exports = ({ config }) => {
  const baseUrl = process.env.EXPO_BASE_URL;
  if (!baseUrl) return config;
  return { ...config, experiments: { ...config.experiments, baseUrl } };
};
