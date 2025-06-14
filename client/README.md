# Modern ve Minimalist Kulüp Yönetim Sistemi

Bu proje, modern ve minimalist bir tasarıma sahip kulüp yönetim sistemi için React tabanlı bir web uygulamasıdır.

## Özellikler

### Tasarım Prensipleri
- **Beyaz Alan Kullanımı**: Nefes alan, ferah bir layout
- **Pastel Renkler**: Yumuşak ve modern bir renk paleti
- **Modern Tipografi**: Gövde metni için Inter, başlıklar için Poppins
- **Yumuşak Animasyonlar**: Framer Motion ile sayfa geçişleri ve mikro etkileşimler

### Yapı ve Bileşenler
- **Responsive Tasarım**: Mobile-first yaklaşım
- **Modern Navbar**: Temiz tasarım ve mobil hamburger menü
- **Hero Section**: Gradient arka plan ve pattern
- **İçerik Kartları**: Kulüpler ve etkinlikler için modern kart tasarımı
- **Minimalist Footer**: Temiz footer ve sosyal medya linkleri

### Kullanılan Teknolojiler
- **React 18 ve Hooks**: En son React özellikleri
- **Tailwind CSS**: Utility-first styling
- **Styled Components**: Bileşene özel styling
- **Framer Motion**: Yumuşak animasyonlar
- **Koyu/Açık Tema**: ThemeContext API ile tam tema desteği

## Kurulum

1. **Bağımlılıkları Yükleyin**
   ```bash
   npm install
   ```

2. **Uygulamayı Başlatın**
   ```bash
   npm run dev
   ```

## Kullanım

- Uygulamada gezinmek için navbar'ı kullanın
- Açık/koyu tema arasında geçiş yapmak için navbar'daki tema düğmesini kullanın
- Bildirimler için zil ikonuna tıklayın
- Farklı cihaz boyutlarında responsive tasarımı test edin

## Proje Yapısı

- `src/components/ui/`: Yeniden kullanılabilir UI bileşenleri (Button, Card, Input)
- `src/components/`: Ana bileşenler (Navbar, Footer, Layout)
- `src/context/`: Context API'leri (ThemeContext)
- `src/pages/`: Uygulama sayfaları

## Tasarım Sistemi

### Renkler
- **Primary**: Mavi tonları (#0ea5e9)
- **Secondary**: Mor tonları (#d946ef)
- **Accent**: Turkuaz tonları (#14b8a6)
- **Neutral**: Gri tonları

### Tipografi
- **Başlıklar**: Poppins, semibold
- **Gövde Metni**: Inter, regular

### Bileşenler
- **Butonlar**: Primary, Secondary, Outline, Ghost varyantları
- **Kartlar**: Hover efektli, başlık, içerik ve footer bölümleri
- **Form Elemanları**: Modern input, select, checkbox tasarımları
