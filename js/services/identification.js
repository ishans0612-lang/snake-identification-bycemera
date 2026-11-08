export class SnakeIdentificationService {
  static isConfigured() {
    const config = window.__SNAKE_ID_CONFIG__ || {};
    return Boolean(config.modelEndpoint || config.apiKey || config.modelUrl);
  }

  async analyzeImage(file) {
    if (!SnakeIdentificationService.isConfigured()) {
      return {
        status: 'not-configured',
        message: 'Automated identification is not available yet. Please consult a qualified wildlife expert.',
        matches: []
      };
    }

    return {
      status: 'success',
      message: 'A valid model is configured, but this project stage does not connect to a live recognition service yet.',
      matches: []
    };
  }
}
