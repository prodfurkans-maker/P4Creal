
# Empati Yapay Zeka – P4C Edition

Next Gen Lab için geliştirilmiş, 10-14 yaş grubu çocuklara yönelik felsefe temelli bir empati asistanıdır.

## 🚀 Hızlı Kurulum

1.  Proje klasöründe bağımlılıkları yükleyin:
    ```bash
    npm install
    ```
2.  `.env.local` dosyası oluşturun ve API anahtarınızı ekleyin:
    ```env
    API_KEY=google_ai_studio_anahtariniz
    ```
3.  Uygulamayı çalıştırın:
    ```bash
    npm run dev
    ```

## ☁️ Vercel Kurulum Rehberi (Öğretmenler İçin)

Uygulamayı internete yüklemek ve gerçek sınıfta kullanmak için şu adımları izleyin:

1.  **API Anahtarı Alın:** [Google AI Studio](https://aistudio.google.com/) adresine gidin ve ücretsiz bir API key alın.
2.  **Vercel'e Yükleyin:** Projenizi GitHub'a yükleyip Vercel'e bağlayın.
3.  **Ayarları Yapın:** Vercel panelinde `Settings` -> `Environment Variables` kısmına gelin.
    *   **Key:** `API_KEY`
    *   **Value:** (Google'dan aldığınız anahtar)
4.  **Deploy Et:** "Deploy" butonuna basın. Uygulamanız birkaç saniye içinde hazır olacak!

---
**NOT:** Bu uygulama bir terapi aracı değildir, felsefi düşünme ve empati kurma becerilerini geliştirmeye yönelik bir eğitim asistanıdır.
