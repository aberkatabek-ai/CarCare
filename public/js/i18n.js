(function initializeCarCareI18n() {
    const STORAGE_KEY = "carcare.locale";
    const supportedLocales = ["tr", "en", "ru", "es"];
    const localeLabels = {
        tr: "Türkçe",
        en: "English",
        ru: "Русский",
        es: "Español"
    };
    const intlLocaleMap = {
        tr: "tr-TR",
        en: "en-US",
        ru: "ru-RU",
        es: "es-ES"
    };
    const dictionaries = {
        tr: {
            exact: {
                "Dashboard": "Gösterge Paneli",
                "Maintenance": "Bakım",
                "Health center": "Sağlık Merkezi",
                "Service history": "Servis Geçmişi",
                "Documents": "Belgeler",
                "Settings": "Ayarlar",
                "Costs": "Masraflar",
                "Log out": "Çıkış yap",
                "Logging out...": "Çıkış yapılıyor...",
                "Vehicle Intelligence": "Araç Zekası",
                "Welcome back": "Tekrar hoş geldin",
                "Log in to manage your vehicles and maintenance plans.": "Araçlarını ve bakım planlarını yönetmek için giriş yap.",
                "Email address": "E-posta adresi",
                "Password": "Şifre",
                "Show": "Göster",
                "Hide": "Gizle",
                "Show password": "Şifreyi göster",
                "Hide password": "Şifreyi gizle",
                "Forgot password?": "Şifreni mi unuttun?",
                "Log in": "Giriş yap",
                "Do not have an account?": "Hesabın yok mu?",
                "Create an account": "Hesap oluştur",
                "Create your account": "Hesabını oluştur",
                "Start tracking your vehicles and maintenance history.": "Araçlarını ve bakım geçmişini takip etmeye başla.",
                "Full name": "Ad soyad",
                "Confirm password": "Şifreyi doğrula",
                "Confirm new password": "Yeni şifreyi doğrula",
                "Use at least 8 characters, including uppercase, lowercase, a number, and a special character, with no spaces.": "En az 8 karakter kullan; büyük harf, küçük harf, rakam ve özel karakter içersin, boşluk olmasın.",
                "Your account was created successfully.": "Hesabın başarıyla oluşturuldu.",
                "Passwords do not match.": "Şifreler eşleşmiyor.",
                "Login successful.": "Giriş başarılı.",
                "Please wait...": "Lütfen bekleyin...",
                "Reset your password": "Şifreni sıfırla",
                "Enter your email to receive a 6-digit verification code.": "6 haneli doğrulama kodunu almak için e-postanı gir.",
                "Send verification code": "Doğrulama kodu gönder",
                "Enter code and new password": "Kodu ve yeni şifreyi gir",
                "Use the code from your email to finish the reset.": "Sıfırlamayı tamamlamak için e-postandaki kodu kullan.",
                "Verification code": "Doğrulama kodu",
                "New password": "Yeni şifre",
                "Reset password": "Şifreyi sıfırla",
                "Back to login": "Girişe dön",
                "Your dashboard": "Senin panelin",
                "Welcome,": "Hoş geldin,",
                "Loading account...": "Hesap yükleniyor...",
                "Upload documents": "Belge yükle",
                "Loading status...": "Durum yükleniyor...",
                "Garage intelligence": "Garaj zekası",
                "Vehicle overview": "Araç genel görünümü",
                "Where the budget is going": "Bütçenin nereye gittiği",
                "Biggest category": "En büyük kategori",
                "Budget heaviest vehicle": "Bütçeyi en çok zorlayan araç",
                "Account center": "Hesap merkezi",
                "Profile and security settings": "Profil ve güvenlik ayarları",
                "Update your visible account details, preferred display name and password.": "Görünür hesap bilgilerini, tercih ettiğin görünen adı ve şifreni güncelle.",
                "Profile": "Profil",
                "Public account details": "Hesap bilgileri",
                "Preferred name": "Tercih edilen ad",
                "Optional": "İsteğe bağlı",
                "Email": "E-posta",
                "Save profile": "Profili kaydet",
                "Security": "Güvenlik",
                "Change password": "Şifre değiştir",
                "Current password": "Mevcut şifre",
                "Update password": "Şifreyi güncelle",
                "Reminders": "Hatırlatmalar",
                "Email notifications": "E-posta bildirimleri",
                "Email reminder digest": "E-posta hatırlatma özeti",
                "CarCare can send you document expiry and maintenance alerts by email.": "CarCare, belge süresi dolumu ve bakım uyarılarını sana e-posta ile gönderebilir.",
                "Save reminder settings": "Hatırlatma ayarlarını kaydet",
                "Danger zone": "Tehlikeli bölge",
                "Delete account": "Hesabı sil",
                "Delete this account permanently": "Bu hesabı kalıcı olarak sil",
                "This removes your profile, vehicles, documents, issue photos and related history. This action cannot be undone.": "Bu işlem profilini, araçlarını, belgelerini, sorun fotoğraflarını ve ilgili geçmişi siler. Bu işlem geri alınamaz.",
                "Loading...": "Yükleniyor...",
                "Unknown date": "Tarih bilinmiyor",
                "Not specified": "Belirtilmedi",
                "Not scheduled": "Planlanmadı",
                "Date not recorded": "Tarih kaydedilmedi",
                "Saving...": "Kaydediliyor...",
                "Maintenance center": "Bakım merkezi",
                "Maintenance plans": "Bakım planları",
                "Plan upcoming service work and identify urgent maintenance.": "Yaklaşan servis işlerini planla ve acil bakımları belirle.",
                "New maintenance plan": "Yeni bakım planı",
                "Create a plan": "Plan oluştur",
                "Enter either a mileage interval, a month interval, or both.": "Kilometre aralığı, ay aralığı veya ikisini birden gir.",
                "No vehicle found.": "Araç bulunamadı.",
                "Add a vehicle from the dashboard before creating a maintenance plan.": "Bakım planı oluşturmadan önce gösterge panelinden bir araç ekle.",
                "Go to dashboard": "Gösterge paneline git",
                "Select a vehicle": "Bir araç seç",
                "All vehicles": "Tüm araçlar",
                "Select a category": "Bir kategori seç",
                "Engine": "Motor",
                "Brakes": "Frenler",
                "Transmission": "Şanzıman",
                "Electrical": "Elektrik",
                "Suspension": "Süspansiyon",
                "Tires": "Lastikler",
                "Fluids": "Sıvılar",
                "Filters": "Filtreler",
                "Other": "Diğer",
                "COST INTELLIGENCE CENTER": "MASRAF ANALİZ MERKEZİ",
                "Know what your car really costs": "Aracının gerçekten ne kadara mal olduğunu bil",
                "Track fuel consumption, service spending and daily ownership expenses in one place.": "Yakıt tüketimini, servis harcamalarını ve günlük sahiplik giderlerini tek yerde takip et.",
                "Total ownership cost": "Toplam sahiplik maliyeti",
                "Fuel, services and additional expenses": "Yakıt, servis ve ek giderler",
                "Fuel spending": "Yakıt harcaması",
                "Service spending": "Servis harcaması",
                "Other expenses": "Diğer giderler",
                "MONTHLY TREND": "AYLIK EĞİLİM",
                "Ownership cost over time": "Zaman içindeki sahiplik maliyeti",
                "Track how total spend has changed month by month across fuel, service and other expenses.": "Yakıt, servis ve diğer giderlerde toplam harcamanın aydan aya nasıl değiştiğini takip et.",
                "Building monthly trend...": "Aylık eğilim hazırlanıyor...",
                "COST MIX": "MASRAF DAĞILIMI",
                "Category breakdown": "Kategori dağılımı",
                "See which cost categories are taking the biggest share of your ownership budget.": "Sahiplik bütçenin en büyük payını hangi masraf kategorilerinin aldığını gör.",
                "Building category breakdown...": "Kategori dağılımı hazırlanıyor...",
                "VEHICLE COMPARISON": "ARAÇ KARŞILAŞTIRMASI",
                "Which vehicle costs the most": "En çok hangi araç masraf çıkarıyor",
                "Compare active vehicles by their total tracked ownership spend.": "Aktif araçları toplam izlenen sahiplik harcamasına göre karşılaştır.",
                "Comparing vehicle spend...": "Araç harcamaları karşılaştırılıyor...",
                "Add a vehicle from the dashboard before recording fuel or expenses.": "Yakıt veya gider kaydetmeden önce gösterge panelinden bir araç ekle.",
                "FUEL LOG": "YAKIT KAYDI",
                "Add a fill-up": "Yakıt alımı ekle",
                "Fill-up date": "Yakıt alım tarihi",
                "Odometer": "Kilometre sayacı",
                "Litres": "Litre",
                "Total cost": "Toplam maliyet",
                "Fuel station": "Yakıt istasyonu",
                "Notes": "Notlar",
                "Full tank": "Depo dolu",
                "Full-tank entries allow CarCare to calculate average fuel consumption.": "Tam depo kayıtları CarCare'in ortalama yakıt tüketimini hesaplamasını sağlar.",
                "Use this entry when the tank was completely filled.": "Depo tamamen doldurulduğunda bu kaydı kullan.",
                "Enter litres and total cost to calculate the unit price.": "Birim fiyatı hesaplamak için litre ve toplam maliyeti gir.",
                "Add fuel, service or expense records to start seeing the monthly ownership trend.": "Aylık sahiplik eğilimini görmeye başlamak için yakıt, servis veya gider kayıtları ekle.",
                "Add fuel entry": "Yakıt kaydı ekle",
                "Add expense": "Gider ekle",
                "Select an expense type": "Bir gider türü seç",
                "Vehicle issues": "Araç sorunları",
                "Service history": "Servis geçmişi",
                "Your documents": "Belgelerin",
                "Cost Center": "Masraf Merkezi",
                "Fuel and expenses": "Yakıt ve giderler",
                "CarCare API Docs": "CarCare API Dokümanları",
                "Open costs": "Masrafları aç",
                "Service": "Servis",
                "Fuel": "Yakıt",
                "Vehicle": "Araç",
                "No data": "Veri yok",
                "Health": "Sağlık",
                "Vehicle records": "Araç kayıtları",
                "Review completed maintenance work, expenses and service information.": "Tamamlanan bakım işlerini, masrafları ve servis bilgilerini incele.",
                "Completed services": "Tamamlanan servisler",
                "Total actual cost": "Toplam gerçek maliyet",
                "Maintenance records": "Bakım kayıtları",
                "Completed work": "Tamamlanan işler",
                "Filter by vehicle": "Araca göre filtrele",
                "Loading service history...": "Servis geçmişi yükleniyor...",
                "Loading shared vehicle profile...": "Paylaşılan araç profili yükleniyor...",
                "Profile unavailable": "Profil kullanılamıyor",
                "This shared link could not be opened.": "Bu paylaşılan bağlantı açılamadı.",
                "Shared vehicle profile": "Paylaşılan araç profili",
                "Loading summary...": "Özet yükleniyor...",
                "Services": "Servisler",
                "Tracked costs": "İzlenen masraflar",
                "Buyer confidence": "Alıcı güveni",
                "Sale readiness snapshot": "Satışa hazırlık özeti",
                "Readiness": "Hazırlık",
                "Loading readiness...": "Hazırlık yükleniyor...",
                "Trust signals": "Güven sinyalleri",
                "Why this profile feels credible": "Bu profil neden güven veriyor",
                "Snapshot": "Genel bakış",
                "Vehicle details": "Araç detayları",
                "Recent activity": "Son hareketler",
                "Latest timeline": "Son zaman akışı",
                "Preparing buyer handoff report...": "Alıcı teslim raporu hazırlanıyor...",
                "Report could not be prepared": "Rapor hazırlanamadı",
                "The buyer handoff report is unavailable.": "Alıcı teslim raporu kullanılamıyor.",
                "Return to dashboard": "Gösterge paneline dön",
                "CarCare buyer handoff report": "CarCare alıcı teslim raporu",
                "Vehicle handoff": "Araç teslimi",
                "Vehicle summary report": "Araç özet raporu",
                "Back to vehicle": "Araca dön",
                "Plate": "Plaka",
                "Vehicle status": "Araç durumu",
                "Report ID": "Rapor ID",
                "Recorded mileage": "Kaydedilen kilometre",
                "Recorded costs": "Kaydedilen masraflar",
                "Vehicle snapshot": "Araç özeti",
                "Summary": "Özet",
                "Ownership": "Sahiplik",
                "Verification status": "Doğrulama durumu",
                "Workshop records": "Servis kayıtları",
                "Legal records": "Yasal kayıtlar",
                "Issue history": "Sorun geçmişi",
                "Reported issues": "Bildirilen sorunlar",
                "Operating cost": "İşletme maliyeti",
                "Fuel records": "Yakıt kayıtları",
                "Ownership cost": "Sahiplik maliyeti",
                "Login first with": "Önce giriş yapın:",
                "If the page fails to render, your browser is likely blocking the Swagger UI CDN.": "Sayfa yüklenmezse tarayıcın Swagger UI CDN'ini engelliyor olabilir.",
                "DOCUMENT & RENEWAL CENTER": "BELGE VE YENİLEME MERKEZİ",
                "Never miss a renewal": "Hiçbir yenilemeyi kaçırma",
                "Track inspections, insurance, emission tests and other important vehicle deadlines.": "Muayene, sigorta, emisyon testleri ve diğer önemli araç son tarihlerini takip et.",
                "Total records": "Toplam kayıt",
                "Currently valid": "Şu anda geçerli",
                "Due soon": "Yakında dolacak",
                "Expired": "Süresi dolmuş",
                "DOCUMENT ENTRY": "BELGE GİRİŞİ",
                "Add a document record": "Belge kaydı ekle",
                "Save the document itself here, then configure when CarCare should warn you about renewal.": "Belgenin kendisini buraya kaydet, ardından CarCare'in yenileme konusunda seni ne zaman uyarması gerektiğini ayarla.",
                "Add a vehicle from the dashboard before creating a document reminder.": "Belge hatırlatması oluşturmadan önce gösterge panelinden bir araç ekle.",
                "Document details": "Belge detayları",
                "Information about the actual file or official record.": "Gerçek dosya veya resmi kayıt hakkındaki bilgiler.",
                "Document type": "Belge türü",
                "Select a type": "Bir tür seç",
                "Vehicle inspection": "Araç muayenesi",
                "Traffic insurance": "Trafik sigortası",
                "Comprehensive insurance": "Kasko",
                "Emission inspection": "Emisyon muayenesi",
                "Vehicle tax": "Araç vergisi",
                "Warranty": "Garanti",
                "Reminder title": "Hatırlatma başlığı",
                "Provider": "Sağlayıcı",
                "Document number": "Belge numarası",
                "Upload file": "Dosya yükle",
                "No file selected.": "Dosya seçilmedi.",
                "Auto-fill from file": "Dosyadan otomatik doldur",
                "Renewal alert settings": "Yenileme uyarı ayarları",
                "Decide when CarCare should remind you before this document expires.": "Bu belgenin süresi dolmadan önce CarCare'in seni ne zaman uyarması gerektiğine karar ver.",
                "Reminder lead time": "Hatırlatma süresi",
                "Vehicle Health Center": "Araç Sağlık Merkezi",
                "Understand a problem before visiting the workshop.": "Servise gitmeden önce sorunu anla.",
                "Record symptoms, assess urgency and keep the complete repair journey connected to your vehicle.": "Belirtileri kaydet, aciliyeti değerlendir ve tamir sürecinin tamamını aracınla bağlantılı tut.",
                "Signed in as": "Giriş yapan",
                "Open issues": "Açık sorunlar",
                "Waiting for diagnosis or repair": "Teşhis veya onarım bekliyor",
                "High risk": "Yüksek risk",
                "Issues requiring urgent attention": "Acil ilgi gerektiren sorunlar",
                "Needs inspection": "Kontrol gerekiyor",
                "Issues that should be checked soon": "Yakında kontrol edilmesi gereken sorunlar",
                "Repaired": "Onarıldı",
                "Problems marked as resolved": "Çözüldü olarak işaretlenen sorunlar",
                "Report a symptom": "Belirti bildir",
                "What did you notice?": "Ne fark ettin?",
                "Describe what the vehicle is doing. CarCare will calculate an initial urgency level.": "Aracın ne yaptığını açıkla. CarCare ilk aciliyet seviyesini hesaplayacak.",
                "Add a vehicle from the Dashboard before reporting an issue.": "Sorun bildirmeden önce Gösterge Paneli'nden bir araç ekle.",
                "Short issue title": "Kısa sorun başlığı",
                "Category": "Kategori",
                "Steering": "Direksiyon",
                "Cooling system": "Soğutma sistemi",
                "Exhaust": "Egzoz",
                "Body": "Kaporta",
                "Symptom severity": "Belirti şiddeti",
                "Mild": "Hafif",
                "Moderate": "Orta",
                "Severe": "Şiddetli",
                "Dashboard warning light": "Gösterge uyarı ışığı",
                "No warning light": "Uyarı ışığı yok",
                "Yellow warning light": "Sarı uyarı ışığı",
                "Red warning light": "Kırmızı uyarı ışığı",
                "When does it happen?": "Ne zaman oluyor?",
                "CarCare Vehicle Passport": "CarCare Araç Pasaportu",
                "Loading vehicle passport...": "Araç pasaportu yükleniyor...",
                "Vehicle could not be loaded": "Araç yüklenemedi",
                "The requested vehicle was not found.": "İstenen araç bulunamadı.",
                "Back to garage": "Garaja dön",
                "Vehicle Passport ready": "Araç Pasaportu hazır",
                "Buyer handoff report": "Alıcı teslim raporu",
                "Copy share link": "Paylaşım bağlantısını kopyala",
                "Print / Save PDF": "Yazdır / PDF kaydet",
                "Loading vehicle...": "Araç yükleniyor...",
                "Model year not specified": "Model yılı belirtilmedi",
                "License plate not specified": "Plaka belirtilmedi",
                "Current mileage": "Güncel kilometre",
                "Odometer reductions are not permitted": "Kilometre düşürmeye izin verilmez",
                "Owner": "Sahip",
                "Report generated": "Rapor oluşturuldu",
                "Record status": "Kayıt durumu",
                "Live database record": "Canlı veritabanı kaydı",
                "Status summary": "Durum özeti",
                "How this vehicle looks today": "Bu araç bugün nasıl görünüyor",
                "Mechanical confidence": "Mekanik güven",
                "Analysing issues and service history...": "Sorunlar ve servis geçmişi analiz ediliyor...",
                "Maintenance discipline": "Bakım disiplini",
                "Reviewing active plans...": "Aktif planlar inceleniyor...",
                "Document readiness": "Belge hazırlığı",
                "Checking document and ownership status...": "Belge ve sahiplik durumu kontrol ediliyor...",
                "Adding vehicle...": "Araç ekleniyor...",
                "Add vehicle": "Araç ekle",
                "Mileage must be greater than": "Kilometre şu değerden büyük olmalıdır:",
                "You are changing the mileage from": "Kilometreyi şu değerden değiştiriyorsun:",
                "This change cannot be reversed. Continue?": "Bu değişiklik geri alınamaz. Devam edilsin mi?",
                "Updating...": "Güncelleniyor...",
                "Confirm mileage": "Kilometreyi onayla",
                "Save changes": "Değişiklikleri kaydet",
                "This will release the license plate for a future owner and remove the vehicle from your active garage.": "Bu işlem plakayı gelecekteki sahibi için boşa çıkarır ve aracı aktif garajından kaldırır.",
                "permanently?": "kalıcı olarak silinsin mi?",
                "This removes the archived vehicle record from your account.": "Bu işlem arşivlenmiş araç kaydını hesabından kaldırır.",
                "Update document record": "Belge kaydını güncelle",
                "Change the document details or adjust its renewal alert settings.": "Belge detaylarını değiştir veya yenileme uyarı ayarlarını düzenle.",
                "Save document": "Belgeyi kaydet",
                "Current file:": "Mevcut dosya:",
                "Select a document file before using auto-fill.": "Otomatik doldurmayı kullanmadan önce bir belge dosyası seç.",
                "Reading file...": "Dosya okunuyor...",
                "Auto-fill found plate": "Otomatik doldurma şu plakayı buldu:",
                "You may want to save it on the vehicle record too.": "Bunu araç kaydına da kaydetmek isteyebilirsin.",
                "The file was read, but no reliable field could be extracted.": "Dosya okundu ancak güvenilir bir alan çıkarılamadı.",
                "field extracted from the file.": "alan dosyadan çıkarıldı.",
                "fields extracted from the file.": "alan dosyadan çıkarıldı.",
                "Run OCR ownership verification for": "Şunun için OCR sahiplik doğrulaması çalıştırılsın:",
                "Use a clear registration image for the best result.": "En iyi sonuç için net bir ruhsat görseli kullan.",
                "Score:": "Skor:",
                "Delete": "Sil",
                "This document record and its renewal alert will be permanently removed.": "Bu belge kaydı ve yenileme uyarısı kalıcı olarak kaldırılacak.",
                "No new file selected. Existing file will be kept.": "Yeni dosya seçilmedi. Mevcut dosya korunacak.",
                "Uploaded file must be 5 MB or smaller.": "Yüklenen dosya 5 MB veya daha küçük olmalı.",
                "Selected file could not be read.": "Seçilen dosya okunamadı.",
                "The server returned an invalid response.": "Sunucu geçersiz bir yanıt döndürdü.",
                "Session refresh failed.": "Oturum yenileme başarısız oldu.",
                "Request failed.": "İstek başarısız oldu.",
                "You must log in.": "Giriş yapmalısın.",
                "Your session is invalid or has expired.": "Oturumun geçersiz veya süresi dolmuş.",
                "Account created successfully.": "Hesap başarıyla oluşturuldu.",
                "Email and password are required.": "E-posta ve şifre zorunludur.",
                "Email or password is incorrect.": "E-posta veya şifre hatalı.",
                "Logout successful.": "Çıkış başarılı.",
                "User was not found.": "Kullanıcı bulunamadı.",
                "Profile settings updated successfully.": "Profil ayarları başarıyla güncellendi.",
                "Password updated successfully. Please log in again.": "Şifre başarıyla güncellendi. Lütfen tekrar giriş yap.",
                "Email reminders enabled.": "E-posta hatırlatmaları açıldı.",
                "Email reminders paused.": "E-posta hatırlatmaları duraklatıldı.",
                "Account deleted successfully.": "Hesap başarıyla silindi.",
                "Password has been reset successfully.": "Şifre başarıyla sıfırlandı.",
                "If that email exists, a verification code has been sent.": "Bu e-posta kayıtlıysa doğrulama kodu gönderildi.",
                "Another account already uses this email address.": "Bu e-posta adresi başka bir hesap tarafından kullanılıyor.",
                "An account already exists with this email.": "Bu e-posta ile zaten bir hesap var.",
                "Vehicle added successfully.": "Araç başarıyla eklendi."
            },
            titles: {
                "Dashboard | CarCare": "Gösterge Paneli | CarCare",
                "Login | CarCare": "Giriş | CarCare",
                "Register | CarCare": "Kayıt Ol | CarCare",
                "Forgot Password | CarCare": "Şifremi Unuttum | CarCare",
                "Settings | CarCare": "Ayarlar | CarCare",
                "Maintenance | CarCare": "Bakım | CarCare",
                "Health Center | CarCare": "Sağlık Merkezi | CarCare",
                "Service History | CarCare": "Servis Geçmişi | CarCare",
                "Documents | CarCare": "Belgeler | CarCare",
                "Cost Center | CarCare": "Masraf Merkezi | CarCare",
                "Vehicle Details | CarCare": "Araç Detayları | CarCare",
                "Buyer Handoff Report | CarCare": "Alıcı Teslim Raporu | CarCare",
                "Shared Vehicle Profile | CarCare": "Paylaşılan Araç Profili | CarCare",
                "CarCare API Docs": "CarCare API Dokümanları"
            }
        },
        ru: {
            exact: {
                "Dashboard": "Панель",
                "Maintenance": "Обслуживание",
                "Health center": "Центр состояния",
                "Service history": "История сервиса",
                "Documents": "Документы",
                "Settings": "Настройки",
                "Costs": "Расходы",
                "Log out": "Выйти",
                "Logging out...": "Выход...",
                "Vehicle Intelligence": "Аналитика автомобиля",
                "Welcome back": "С возвращением",
                "Log in to manage your vehicles and maintenance plans.": "Войдите, чтобы управлять автомобилями и планами обслуживания.",
                "Email address": "Электронная почта",
                "Password": "Пароль",
                "Show": "Показать",
                "Hide": "Скрыть",
                "Show password": "Показать пароль",
                "Hide password": "Скрыть пароль",
                "Forgot password?": "Забыли пароль?",
                "Log in": "Войти",
                "Do not have an account?": "Нет аккаунта?",
                "Create an account": "Создать аккаунт",
                "Create your account": "Создайте аккаунт",
                "Start tracking your vehicles and maintenance history.": "Начните отслеживать свои автомобили и историю обслуживания.",
                "Full name": "Полное имя",
                "Confirm password": "Подтвердите пароль",
                "Confirm new password": "Подтвердите новый пароль",
                "Use at least 8 characters, including uppercase, lowercase, a number, and a special character, with no spaces.": "Используйте не менее 8 символов: заглавные, строчные буквы, цифру и специальный символ, без пробелов.",
                "Your account was created successfully.": "Ваш аккаунт успешно создан.",
                "Passwords do not match.": "Пароли не совпадают.",
                "Please wait...": "Пожалуйста, подождите...",
                "Reset your password": "Сбросьте пароль",
                "Enter your email to receive a 6-digit verification code.": "Введите email, чтобы получить 6-значный код подтверждения.",
                "Send verification code": "Отправить код подтверждения",
                "Enter code and new password": "Введите код и новый пароль",
                "Use the code from your email to finish the reset.": "Используйте код из письма, чтобы завершить сброс.",
                "Verification code": "Код подтверждения",
                "New password": "Новый пароль",
                "Reset password": "Сбросить пароль",
                "Back to login": "Вернуться ко входу",
                "Your dashboard": "Ваша панель",
                "Welcome,": "Добро пожаловать,",
                "Loading account...": "Загрузка аккаунта...",
                "Upload documents": "Загрузить документы",
                "Loading status...": "Загрузка статуса...",
                "Garage intelligence": "Аналитика гаража",
                "Vehicle overview": "Обзор автомобиля",
                "Where the budget is going": "Куда уходит бюджет",
                "Biggest category": "Крупнейшая категория",
                "Budget heaviest vehicle": "Самый затратный автомобиль",
                "Account center": "Центр аккаунта",
                "Profile and security settings": "Настройки профиля и безопасности",
                "Update your visible account details, preferred display name and password.": "Обновите видимые данные аккаунта, отображаемое имя и пароль.",
                "Profile": "Профиль",
                "Public account details": "Данные аккаунта",
                "Preferred name": "Предпочитаемое имя",
                "Optional": "Необязательно",
                "Email": "Электронная почта",
                "Save profile": "Сохранить профиль",
                "Security": "Безопасность",
                "Change password": "Сменить пароль",
                "Current password": "Текущий пароль",
                "Update password": "Обновить пароль",
                "Reminders": "Напоминания",
                "Email notifications": "Уведомления по почте",
                "Email reminder digest": "Сводка напоминаний по почте",
                "CarCare can send you document expiry and maintenance alerts by email.": "CarCare может отправлять по почте напоминания об истечении документов и обслуживании.",
                "Save reminder settings": "Сохранить напоминания",
                "Danger zone": "Опасная зона",
                "Delete account": "Удалить аккаунт",
                "Delete this account permanently": "Удалить этот аккаунт навсегда",
                "This removes your profile, vehicles, documents, issue photos and related history. This action cannot be undone.": "Это удалит ваш профиль, автомобили, документы, фотографии неисправностей и связанную историю. Это действие нельзя отменить.",
                "Loading...": "Загрузка...",
                "Unknown date": "Дата неизвестна",
                "Not specified": "Не указано",
                "Not scheduled": "Не запланировано",
                "Date not recorded": "Дата не указана",
                "Saving...": "Сохранение...",
                "Maintenance center": "Центр обслуживания",
                "Maintenance plans": "Планы обслуживания",
                "Plan upcoming service work and identify urgent maintenance.": "Планируйте предстоящее обслуживание и определяйте срочные работы.",
                "New maintenance plan": "Новый план обслуживания",
                "Create a plan": "Создать план",
                "Enter either a mileage interval, a month interval, or both.": "Укажите интервал пробега, интервал месяцев или оба значения.",
                "No vehicle found.": "Автомобиль не найден.",
                "Add a vehicle from the dashboard before creating a maintenance plan.": "Добавьте автомобиль с панели управления перед созданием плана обслуживания.",
                "Go to dashboard": "Перейти на панель",
                "Select a vehicle": "Выберите автомобиль",
                "All vehicles": "Все автомобили",
                "Select a category": "Выберите категорию",
                "Engine": "Двигатель",
                "Brakes": "Тормоза",
                "Transmission": "Трансмиссия",
                "Electrical": "Электрика",
                "Suspension": "Подвеска",
                "Tires": "Шины",
                "Fluids": "Жидкости",
                "Filters": "Фильтры",
                "Other": "Другое",
                "COST INTELLIGENCE CENTER": "ЦЕНТР АНАЛИЗА РАСХОДОВ",
                "Know what your car really costs": "Узнайте, сколько на самом деле стоит ваш автомобиль",
                "Track fuel consumption, service spending and daily ownership expenses in one place.": "Отслеживайте расход топлива, затраты на сервис и ежедневные расходы владения в одном месте.",
                "Total ownership cost": "Общая стоимость владения",
                "Fuel, services and additional expenses": "Топливо, сервис и дополнительные расходы",
                "Fuel spending": "Расходы на топливо",
                "Service spending": "Расходы на сервис",
                "Other expenses": "Прочие расходы",
                "MONTHLY TREND": "МЕСЯЧНАЯ ДИНАМИКА",
                "Ownership cost over time": "Динамика стоимости владения",
                "Track how total spend has changed month by month across fuel, service and other expenses.": "Отслеживайте, как менялись общие затраты по месяцам на топливо, сервис и прочие расходы.",
                "Building monthly trend...": "Строим месячную динамику...",
                "COST MIX": "СТРУКТУРА РАСХОДОВ",
                "Category breakdown": "Разбивка по категориям",
                "See which cost categories are taking the biggest share of your ownership budget.": "Посмотрите, какие категории расходов занимают наибольшую долю вашего бюджета владения.",
                "Building category breakdown...": "Строим разбивку по категориям...",
                "VEHICLE COMPARISON": "СРАВНЕНИЕ АВТОМОБИЛЕЙ",
                "Which vehicle costs the most": "Какой автомобиль обходится дороже всего",
                "Compare active vehicles by their total tracked ownership spend.": "Сравнивайте активные автомобили по суммарным отслеживаемым расходам на владение.",
                "Comparing vehicle spend...": "Сравниваем расходы по автомобилям...",
                "Add a vehicle from the dashboard before recording fuel or expenses.": "Добавьте автомобиль с панели управления, прежде чем записывать топливо или расходы.",
                "FUEL LOG": "ЖУРНАЛ ТОПЛИВА",
                "Add a fill-up": "Добавить заправку",
                "Fill-up date": "Дата заправки",
                "Odometer": "Одометр",
                "Litres": "Литры",
                "Total cost": "Общая стоимость",
                "Fuel station": "АЗС",
                "Notes": "Заметки",
                "Full tank": "Полный бак",
                "Full-tank entries allow CarCare to calculate average fuel consumption.": "Записи о полном баке позволяют CarCare рассчитать средний расход топлива.",
                "Use this entry when the tank was completely filled.": "Используйте эту запись, когда бак был полностью заправлен.",
                "Enter litres and total cost to calculate the unit price.": "Введите литры и общую стоимость, чтобы рассчитать цену за единицу.",
                "Add fuel, service or expense records to start seeing the monthly ownership trend.": "Добавьте записи о топливе, сервисе или расходах, чтобы увидеть месячную динамику владения.",
                "Add fuel entry": "Добавить запись о топливе",
                "Add expense": "Добавить расход",
                "Select an expense type": "Выберите тип расхода",
                "Cost Center": "Центр расходов",
                "Fuel and expenses": "Топливо и расходы",
                "CarCare API Docs": "Документация API CarCare",
                "Open costs": "Открыть расходы",
                "Service": "Сервис",
                "Fuel": "Топливо",
                "Vehicle": "Автомобиль",
                "No data": "Нет данных",
                "Health": "Состояние",
                "Vehicle records": "Записи об автомобиле",
                "Review completed maintenance work, expenses and service information.": "Просматривайте выполненные работы по обслуживанию, расходы и сервисную информацию.",
                "Completed services": "Завершённые сервисы",
                "Total actual cost": "Общая фактическая стоимость",
                "Maintenance records": "Записи обслуживания",
                "Completed work": "Выполненные работы",
                "Filter by vehicle": "Фильтр по автомобилю",
                "Loading service history...": "Загрузка истории сервиса...",
                "Loading shared vehicle profile...": "Загрузка общего профиля автомобиля...",
                "Profile unavailable": "Профиль недоступен",
                "This shared link could not be opened.": "Эта общая ссылка не может быть открыта.",
                "Shared vehicle profile": "Общий профиль автомобиля",
                "Loading summary...": "Загрузка сводки...",
                "Services": "Сервисы",
                "Tracked costs": "Отслеживаемые расходы",
                "Buyer confidence": "Доверие покупателя",
                "Sale readiness snapshot": "Снимок готовности к продаже",
                "Readiness": "Готовность",
                "Loading readiness...": "Загрузка готовности...",
                "Trust signals": "Сигналы доверия",
                "Why this profile feels credible": "Почему этот профиль выглядит надёжным",
                "Snapshot": "Снимок",
                "Vehicle details": "Детали автомобиля",
                "Recent activity": "Недавняя активность",
                "Latest timeline": "Последняя хронология",
                "Preparing buyer handoff report...": "Подготовка отчёта для передачи покупателю...",
                "Report could not be prepared": "Не удалось подготовить отчёт",
                "The buyer handoff report is unavailable.": "Отчёт для передачи покупателю недоступен.",
                "Return to dashboard": "Вернуться на панель",
                "CarCare buyer handoff report": "Отчёт CarCare для передачи покупателю",
                "Vehicle handoff": "Передача автомобиля",
                "Vehicle summary report": "Сводный отчёт по автомобилю",
                "Back to vehicle": "Назад к автомобилю",
                "Plate": "Номер",
                "Vehicle status": "Статус автомобиля",
                "Report ID": "ID отчёта",
                "Recorded mileage": "Зафиксированный пробег",
                "Recorded costs": "Зафиксированные расходы",
                "Vehicle snapshot": "Снимок автомобиля",
                "Summary": "Сводка",
                "Ownership": "Собственность",
                "Verification status": "Статус проверки",
                "Workshop records": "Записи мастерской",
                "Legal records": "Юридические записи",
                "Issue history": "История проблем",
                "Reported issues": "Сообщённые проблемы",
                "Operating cost": "Эксплуатационные расходы",
                "Fuel records": "Записи топлива",
                "Ownership cost": "Стоимость владения",
                "Login first with": "Сначала войдите через",
                "If the page fails to render, your browser is likely blocking the Swagger UI CDN.": "Если страница не отображается, ваш браузер, вероятно, блокирует Swagger UI CDN."
            },
            titles: {
                "Dashboard | CarCare": "Панель | CarCare",
                "Login | CarCare": "Вход | CarCare",
                "Register | CarCare": "Регистрация | CarCare",
                "Forgot Password | CarCare": "Забыли пароль | CarCare",
                "Settings | CarCare": "Настройки | CarCare",
                "Maintenance | CarCare": "Обслуживание | CarCare",
                "Health Center | CarCare": "Центр состояния | CarCare",
                "Service History | CarCare": "История сервиса | CarCare",
                "Documents | CarCare": "Документы | CarCare",
                "Cost Center | CarCare": "Центр расходов | CarCare",
                "Vehicle Details | CarCare": "Детали автомобиля | CarCare",
                "Buyer Handoff Report | CarCare": "Отчёт для передачи покупателю | CarCare",
                "Shared Vehicle Profile | CarCare": "Общий профиль автомобиля | CarCare",
                "CarCare API Docs": "Документация API CarCare"
            }
        },
        es: {
            exact: {
                "Dashboard": "Panel",
                "Maintenance": "Mantenimiento",
                "Health center": "Centro de estado",
                "Service history": "Historial de servicio",
                "Documents": "Documentos",
                "Settings": "Configuración",
                "Costs": "Costes",
                "Log out": "Cerrar sesión",
                "Logging out...": "Cerrando sesión...",
                "Vehicle Intelligence": "Inteligencia del vehículo",
                "Welcome back": "Bienvenido de nuevo",
                "Log in to manage your vehicles and maintenance plans.": "Inicia sesión para gestionar tus vehículos y planes de mantenimiento.",
                "Email address": "Correo electrónico",
                "Password": "Contraseña",
                "Show": "Mostrar",
                "Hide": "Ocultar",
                "Show password": "Mostrar contraseña",
                "Hide password": "Ocultar contraseña",
                "Forgot password?": "¿Olvidaste la contraseña?",
                "Log in": "Iniciar sesión",
                "Do not have an account?": "¿No tienes una cuenta?",
                "Create an account": "Crear una cuenta",
                "Create your account": "Crea tu cuenta",
                "Start tracking your vehicles and maintenance history.": "Empieza a seguir tus vehículos y su historial de mantenimiento.",
                "Full name": "Nombre completo",
                "Confirm password": "Confirmar contraseña",
                "Confirm new password": "Confirmar nueva contraseña",
                "Use at least 8 characters, including uppercase, lowercase, a number, and a special character, with no spaces.": "Usa al menos 8 caracteres, con mayúsculas, minúsculas, un número y un carácter especial, sin espacios.",
                "Your account was created successfully.": "Tu cuenta se ha creado correctamente.",
                "Passwords do not match.": "Las contraseñas no coinciden.",
                "Please wait...": "Espera un momento...",
                "Reset your password": "Restablece tu contraseña",
                "Enter your email to receive a 6-digit verification code.": "Introduce tu correo para recibir un código de verificación de 6 dígitos.",
                "Send verification code": "Enviar código de verificación",
                "Enter code and new password": "Introduce el código y la nueva contraseña",
                "Use the code from your email to finish the reset.": "Usa el código de tu correo para completar el restablecimiento.",
                "Verification code": "Código de verificación",
                "New password": "Nueva contraseña",
                "Reset password": "Restablecer contraseña",
                "Back to login": "Volver al inicio de sesión",
                "Your dashboard": "Tu panel",
                "Welcome,": "Bienvenido,",
                "Loading account...": "Cargando cuenta...",
                "Upload documents": "Subir documentos",
                "Loading status...": "Cargando estado...",
                "Garage intelligence": "Inteligencia del garaje",
                "Vehicle overview": "Resumen del vehículo",
                "Where the budget is going": "A dónde va el presupuesto",
                "Biggest category": "Categoría principal",
                "Budget heaviest vehicle": "Vehículo con mayor gasto",
                "Account center": "Centro de cuenta",
                "Profile and security settings": "Configuración de perfil y seguridad",
                "Update your visible account details, preferred display name and password.": "Actualiza los datos visibles de tu cuenta, el nombre mostrado y la contraseña.",
                "Profile": "Perfil",
                "Public account details": "Datos públicos de la cuenta",
                "Preferred name": "Nombre preferido",
                "Optional": "Opcional",
                "Email": "Correo",
                "Save profile": "Guardar perfil",
                "Security": "Seguridad",
                "Change password": "Cambiar contraseña",
                "Current password": "Contraseña actual",
                "Update password": "Actualizar contraseña",
                "Reminders": "Recordatorios",
                "Email notifications": "Notificaciones por correo",
                "Email reminder digest": "Resumen de recordatorios por correo",
                "CarCare can send you document expiry and maintenance alerts by email.": "CarCare puede enviarte por correo alertas de vencimiento de documentos y mantenimiento.",
                "Save reminder settings": "Guardar recordatorios",
                "Danger zone": "Zona de peligro",
                "Delete account": "Eliminar cuenta",
                "Delete this account permanently": "Eliminar esta cuenta de forma permanente",
                "This removes your profile, vehicles, documents, issue photos and related history. This action cannot be undone.": "Esto elimina tu perfil, vehículos, documentos, fotos de incidencias y el historial relacionado. Esta acción no se puede deshacer.",
                "Loading...": "Cargando...",
                "Unknown date": "Fecha desconocida",
                "Not specified": "No especificado",
                "Not scheduled": "No programado",
                "Date not recorded": "Fecha no registrada",
                "Saving...": "Guardando...",
                "Maintenance center": "Centro de mantenimiento",
                "Maintenance plans": "Planes de mantenimiento",
                "Plan upcoming service work and identify urgent maintenance.": "Planifica el servicio próximo e identifica el mantenimiento urgente.",
                "New maintenance plan": "Nuevo plan de mantenimiento",
                "Create a plan": "Crear un plan",
                "Enter either a mileage interval, a month interval, or both.": "Introduce un intervalo de kilometraje, de meses o ambos.",
                "No vehicle found.": "No se encontró ningún vehículo.",
                "Add a vehicle from the dashboard before creating a maintenance plan.": "Añade un vehículo desde el panel antes de crear un plan de mantenimiento.",
                "Go to dashboard": "Ir al panel",
                "Select a vehicle": "Selecciona un vehículo",
                "All vehicles": "Todos los vehículos",
                "Select a category": "Selecciona una categoría",
                "Engine": "Motor",
                "Brakes": "Frenos",
                "Transmission": "Transmisión",
                "Electrical": "Eléctrico",
                "Suspension": "Suspensión",
                "Tires": "Neumáticos",
                "Fluids": "Fluidos",
                "Filters": "Filtros",
                "Other": "Otro",
                "COST INTELLIGENCE CENTER": "CENTRO DE INTELIGENCIA DE COSTES",
                "Know what your car really costs": "Conoce cuánto cuesta realmente tu coche",
                "Track fuel consumption, service spending and daily ownership expenses in one place.": "Sigue el consumo de combustible, el gasto en servicio y los costes diarios de uso en un solo lugar.",
                "Total ownership cost": "Coste total de propiedad",
                "Fuel, services and additional expenses": "Combustible, servicios y gastos adicionales",
                "Fuel spending": "Gasto en combustible",
                "Service spending": "Gasto en servicio",
                "Other expenses": "Otros gastos",
                "MONTHLY TREND": "TENDENCIA MENSUAL",
                "Ownership cost over time": "Coste de propiedad a lo largo del tiempo",
                "Track how total spend has changed month by month across fuel, service and other expenses.": "Sigue cómo ha cambiado el gasto total mes a mes entre combustible, servicio y otros gastos.",
                "Building monthly trend...": "Generando tendencia mensual...",
                "COST MIX": "MEZCLA DE COSTES",
                "Category breakdown": "Desglose por categorías",
                "See which cost categories are taking the biggest share of your ownership budget.": "Consulta qué categorías de costes se llevan la mayor parte de tu presupuesto de propiedad.",
                "Building category breakdown...": "Generando desglose por categorías...",
                "VEHICLE COMPARISON": "COMPARACIÓN DE VEHÍCULOS",
                "Which vehicle costs the most": "Qué vehículo cuesta más",
                "Compare active vehicles by their total tracked ownership spend.": "Compara los vehículos activos según su gasto total de propiedad registrado.",
                "Comparing vehicle spend...": "Comparando gasto por vehículo...",
                "Add a vehicle from the dashboard before recording fuel or expenses.": "Añade un vehículo desde el panel antes de registrar combustible o gastos.",
                "FUEL LOG": "REGISTRO DE COMBUSTIBLE",
                "Add a fill-up": "Añadir repostaje",
                "Fill-up date": "Fecha del repostaje",
                "Odometer": "Odómetro",
                "Litres": "Litros",
                "Total cost": "Coste total",
                "Fuel station": "Gasolinera",
                "Notes": "Notas",
                "Full tank": "Depósito lleno",
                "Cost Center": "Centro de costes",
                "Full-tank entries allow CarCare to calculate average fuel consumption.": "Las entradas de depósito lleno permiten a CarCare calcular el consumo medio de combustible.",
                "Use this entry when the tank was completely filled.": "Usa esta entrada cuando el depósito se haya llenado por completo.",
                "Enter litres and total cost to calculate the unit price.": "Introduce los litros y el coste total para calcular el precio unitario.",
                "Add fuel, service or expense records to start seeing the monthly ownership trend.": "Añade registros de combustible, servicio o gastos para empezar a ver la tendencia mensual de propiedad.",
                "Add fuel entry": "Añadir registro de combustible",
                "Add expense": "Añadir gasto",
                "Select an expense type": "Selecciona un tipo de gasto",
                "Fuel and expenses": "Combustible y gastos",
                "CarCare API Docs": "Documentación API de CarCare",
                "Open costs": "Abrir costes",
                "Service": "Servicio",
                "Fuel": "Combustible",
                "Vehicle": "Vehículo",
                "No data": "Sin datos",
                "Health": "Estado",
                "Vehicle records": "Registros del vehículo",
                "Review completed maintenance work, expenses and service information.": "Revisa el mantenimiento completado, los gastos y la información de servicio.",
                "Completed services": "Servicios completados",
                "Total actual cost": "Coste real total",
                "Maintenance records": "Registros de mantenimiento",
                "Completed work": "Trabajo completado",
                "Filter by vehicle": "Filtrar por vehículo",
                "Loading service history...": "Cargando historial de servicio...",
                "Loading shared vehicle profile...": "Cargando perfil compartido del vehículo...",
                "Profile unavailable": "Perfil no disponible",
                "This shared link could not be opened.": "No se pudo abrir este enlace compartido.",
                "Shared vehicle profile": "Perfil compartido del vehículo",
                "Loading summary...": "Cargando resumen...",
                "Services": "Servicios",
                "Tracked costs": "Costes registrados",
                "Buyer confidence": "Confianza del comprador",
                "Sale readiness snapshot": "Resumen de preparación para la venta",
                "Readiness": "Preparación",
                "Loading readiness...": "Cargando preparación...",
                "Trust signals": "Señales de confianza",
                "Why this profile feels credible": "Por qué este perfil parece creíble",
                "Snapshot": "Resumen",
                "Vehicle details": "Detalles del vehículo",
                "Recent activity": "Actividad reciente",
                "Latest timeline": "Última cronología",
                "Preparing buyer handoff report...": "Preparando informe de entrega al comprador...",
                "Report could not be prepared": "No se pudo preparar el informe",
                "The buyer handoff report is unavailable.": "El informe de entrega al comprador no está disponible.",
                "Return to dashboard": "Volver al panel",
                "CarCare buyer handoff report": "Informe de entrega al comprador de CarCare",
                "Vehicle handoff": "Entrega del vehículo",
                "Vehicle summary report": "Informe resumido del vehículo",
                "Back to vehicle": "Volver al vehículo",
                "Plate": "Matrícula",
                "Vehicle status": "Estado del vehículo",
                "Report ID": "ID del informe",
                "Recorded mileage": "Kilometraje registrado",
                "Recorded costs": "Costes registrados",
                "Vehicle snapshot": "Resumen del vehículo",
                "Summary": "Resumen",
                "Ownership": "Propiedad",
                "Verification status": "Estado de verificación",
                "Workshop records": "Registros del taller",
                "Legal records": "Registros legales",
                "Issue history": "Historial de incidencias",
                "Reported issues": "Incidencias registradas",
                "Operating cost": "Coste operativo",
                "Fuel records": "Registros de combustible",
                "Ownership cost": "Coste de propiedad",
                "Login first with": "Primero inicia sesión con",
                "If the page fails to render, your browser is likely blocking the Swagger UI CDN.": "Si la página no se muestra, es probable que tu navegador esté bloqueando el CDN de Swagger UI."
            },
            titles: {
                "Dashboard | CarCare": "Panel | CarCare",
                "Login | CarCare": "Iniciar sesión | CarCare",
                "Register | CarCare": "Registro | CarCare",
                "Forgot Password | CarCare": "Olvidé la contraseña | CarCare",
                "Settings | CarCare": "Configuración | CarCare",
                "Maintenance | CarCare": "Mantenimiento | CarCare",
                "Health Center | CarCare": "Centro de estado | CarCare",
                "Service History | CarCare": "Historial de servicio | CarCare",
                "Documents | CarCare": "Documentos | CarCare",
                "Cost Center | CarCare": "Centro de costes | CarCare",
                "Vehicle Details | CarCare": "Detalles del vehículo | CarCare",
                "Buyer Handoff Report | CarCare": "Informe de entrega al comprador | CarCare",
                "Shared Vehicle Profile | CarCare": "Perfil compartido del vehículo | CarCare",
                "CarCare API Docs": "Documentación API de CarCare"
            }
        },
        en: {
            exact: {},
            titles: {}
        }
    };
    const fragmentTranslations = {
        tr: {
            "Dashboard could not be loaded.": "Gösterge paneli yüklenemedi.",
            "Settings page could not be loaded.": "Ayarlar sayfası yüklenemedi.",
            "Health center could not be loaded.": "Sağlık merkezi yüklenemedi.",
            "Service history could not be loaded.": "Servis geçmişi yüklenemedi.",
            "Vehicle information could not be loaded.": "Araç bilgileri yüklenemedi.",
            "No service history": "Servis geçmişi yok",
            "Complete a maintenance plan to create your first service record.": "İlk servis kaydını oluşturmak için bir bakım planı tamamla.",
            "Completed mileage": "Tamamlanan kilometre",
            "Estimated cost": "Tahmini maliyet",
            "Actual cost": "Gerçek maliyet",
            "Service provider": "Servis sağlayıcı",
            "Maintenance": "Bakım",
            "Notes": "Notlar",
            "Add diagnosis": "Teşhis ekle",
            "Update diagnosis": "Teşhisi güncelle",
            "Mark as repaired": "Onarıldı olarak işaretle",
            "View vehicle": "Aracı görüntüle",
            "Assessing issue...": "Sorun değerlendiriliyor...",
            "Report issue": "Sorun bildir",
            "You can upload up to 5 issue photos.": "En fazla 5 sorun fotoğrafı yükleyebilirsin.",
            "Selected issue photo could not be read.": "Seçilen sorun fotoğrafı okunamadı.",
            "photo(s) selected.": "fotoğraf seçildi.",
            "Repair notes": "Onarım notları",
            "Recurring issue": "Tekrarlayan sorun",
            "similar record": "benzer kayıt",
            "similar records": "benzer kayıt",
            "were reported before this issue.": "bu sorundan önce bildirildi.",
            "Reported ": "Bildirildi: ",
            "Saving diagnosis...": "Teşhis kaydediliyor...",
            "Save diagnosis": "Teşhisi kaydet",
            "Completing repair...": "Onarım tamamlanıyor...",
            "Complete repair": "Onarımı tamamla",
            "This issue record will be permanently removed.": "Bu sorun kaydı kalıcı olarak kaldırılacak.",
            "Preparing...": "Hazırlanıyor...",
            "Link copied": "Bağlantı kopyalandı",
            "Current registration image:": "Mevcut ruhsat görseli:",
            "selected": "seçildi",
            "Verifying...": "Doğrulanıyor...",
            "Verify ownership": "Sahipliği doğrula",
            "No shared activity is available yet.": "Henüz paylaşılmış etkinlik yok.",
            "Shared read-only summary": "Paylaşılan salt okunur özet",
            "Strong buyer-facing record with no obvious credibility blocker in the shared data.": "Paylaşılan verilerde görünür bir güven engeli olmayan güçlü bir alıcı profili.",
            "This shared profile still shows": "Bu paylaşılan profil hâlâ şunları gösteriyor:",
            "open issue": "açık sorun",
            "expired document": "süresi dolmuş belge",
            "no service history": "servis geçmişi yok",
            "ownership not verified": "sahiplik doğrulanmadı",
            "Model year": "Model yılı",
            "License plate": "Plaka",
            "Status": "Durum",
            "Service records": "Servis kayıtları",
            "Shared on": "Paylaşım tarihi",
            "No service history is visible yet.": "Henüz görünür servis geçmişi yok.",
            "No tracked documents are included yet.": "Henüz izlenen belge eklenmemiş.",
            "No document appears close to expiry in the shared profile.": "Paylaşılan profilde süresi yaklaşan belge görünmüyor.",
            "No unresolved issue is visible in this shared view.": "Bu paylaşılan görünümde çözümlenmemiş sorun görünmüyor.",
            "are visible.": "görünür.",
            "are included.": "dahil edildi.",
            "are approaching soon.": "yakında yaklaşacak.",
            "are still visible in the shared record.": "paylaşılan kayıtta hâlâ görünüyor.",
            "Service": "Servis",
            "Document": "Belge",
            "Issue": "Sorun",
            "Adding fill-up...": "Yakıt alımı ekleniyor...",
            "Adding expense...": "Gider ekleniyor...",
            "Delete this fuel entry?": "Bu yakıt kaydı silinsin mi?",
            "The vehicle mileage will not be reduced.": "Araç kilometresi düşürülmeyecek.",
            "Delete this expense record?": "Bu gider kaydı silinsin mi?"
        },
        ru: {
            "Dashboard could not be loaded.": "Панель не удалось загрузить.",
            "Settings page could not be loaded.": "Страница настроек не загрузилась.",
            "Health center could not be loaded.": "Центр состояния не удалось загрузить.",
            "Service history could not be loaded.": "Историю сервиса не удалось загрузить.",
            "Vehicle information could not be loaded.": "Информацию об автомобиле не удалось загрузить.",
            "No service history": "Нет истории сервиса",
            "Complete a maintenance plan to create your first service record.": "Завершите план обслуживания, чтобы создать первую сервисную запись.",
            "Completed mileage": "Пробег при завершении",
            "Estimated cost": "Оценочная стоимость",
            "Actual cost": "Фактическая стоимость",
            "Service provider": "Сервисный центр",
            "Notes": "Заметки",
            "Add diagnosis": "Добавить диагноз",
            "Update diagnosis": "Обновить диагноз",
            "Mark as repaired": "Отметить как отремонтированное",
            "View vehicle": "Открыть автомобиль",
            "Assessing issue...": "Оценка проблемы...",
            "Report issue": "Сообщить о проблеме",
            "You can upload up to 5 issue photos.": "Можно загрузить до 5 фото проблемы.",
            "Selected issue photo could not be read.": "Не удалось прочитать выбранное фото проблемы.",
            "photo(s) selected.": "фото выбрано.",
            "Repair notes": "Заметки по ремонту",
            "Recurring issue": "Повторяющаяся проблема",
            "similar record": "похожая запись",
            "similar records": "похожие записи",
            "were reported before this issue.": "были зарегистрированы до этой проблемы.",
            "Reported ": "Сообщено: ",
            "Saving diagnosis...": "Сохранение диагноза...",
            "Save diagnosis": "Сохранить диагноз",
            "Completing repair...": "Завершение ремонта...",
            "Complete repair": "Завершить ремонт",
            "This issue record will be permanently removed.": "Эта запись о проблеме будет удалена навсегда.",
            "Preparing...": "Подготовка...",
            "Link copied": "Ссылка скопирована",
            "Current registration image:": "Текущее изображение документа:",
            "selected": "выбрано",
            "Verifying...": "Проверка...",
            "Verify ownership": "Проверить владение",
            "No shared activity is available yet.": "Пока нет общей активности.",
            "Shared read-only summary": "Общий доступ только для чтения",
            "Strong buyer-facing record with no obvious credibility blocker in the shared data.": "Сильная запись для покупателя без явных проблем доверия в общих данных.",
            "This shared profile still shows": "Этот общий профиль всё ещё показывает",
            "open issue": "открытую проблему",
            "expired document": "просроченный документ",
            "no service history": "отсутствие истории сервиса",
            "ownership not verified": "владение не подтверждено",
            "Model year": "Год модели",
            "License plate": "Номерной знак",
            "Status": "Статус",
            "Service records": "Сервисные записи",
            "Shared on": "Поделились",
            "No service history is visible yet.": "История сервиса пока не видна.",
            "No tracked documents are included yet.": "Отслеживаемые документы пока не добавлены.",
            "No document appears close to expiry in the shared profile.": "В общем профиле нет документов с близким сроком окончания.",
            "No unresolved issue is visible in this shared view.": "В этом общем представлении нет нерешённых проблем.",
            "are visible.": "видны.",
            "are included.": "включены.",
            "are approaching soon.": "скоро наступят.",
            "are still visible in the shared record.": "всё ещё видны в общей записи.",
            "Adding fill-up...": "Добавление заправки...",
            "Adding expense...": "Добавление расхода...",
            "Delete this fuel entry?": "Удалить эту запись о топливе?",
            "The vehicle mileage will not be reduced.": "Пробег автомобиля не будет уменьшен.",
            "Delete this expense record?": "Удалить эту запись о расходе?"
        },
        es: {
            "Dashboard could not be loaded.": "No se pudo cargar el panel.",
            "Settings page could not be loaded.": "No se pudo cargar la página de configuración.",
            "Health center could not be loaded.": "No se pudo cargar el centro de estado.",
            "Service history could not be loaded.": "No se pudo cargar el historial de servicio.",
            "Vehicle information could not be loaded.": "No se pudo cargar la información del vehículo.",
            "No service history": "No hay historial de servicio",
            "Complete a maintenance plan to create your first service record.": "Completa un plan de mantenimiento para crear tu primer registro de servicio.",
            "Completed mileage": "Kilometraje completado",
            "Estimated cost": "Coste estimado",
            "Actual cost": "Coste real",
            "Service provider": "Proveedor del servicio",
            "Notes": "Notas",
            "Add diagnosis": "Añadir diagnóstico",
            "Update diagnosis": "Actualizar diagnóstico",
            "Mark as repaired": "Marcar como reparado",
            "View vehicle": "Ver vehículo",
            "Assessing issue...": "Evaluando incidencia...",
            "Report issue": "Registrar incidencia",
            "You can upload up to 5 issue photos.": "Puedes subir hasta 5 fotos de la incidencia.",
            "Selected issue photo could not be read.": "No se pudo leer la foto seleccionada.",
            "photo(s) selected.": "foto(s) seleccionada(s).",
            "Repair notes": "Notas de reparación",
            "Recurring issue": "Incidencia recurrente",
            "similar record": "registro similar",
            "similar records": "registros similares",
            "were reported before this issue.": "fueron registrados antes de esta incidencia.",
            "Reported ": "Registrado: ",
            "Saving diagnosis...": "Guardando diagnóstico...",
            "Save diagnosis": "Guardar diagnóstico",
            "Completing repair...": "Completando reparación...",
            "Complete repair": "Completar reparación",
            "This issue record will be permanently removed.": "Este registro de incidencia se eliminará de forma permanente.",
            "Preparing...": "Preparando...",
            "Link copied": "Enlace copiado",
            "Current registration image:": "Imagen actual del documento:",
            "selected": "seleccionado",
            "Verifying...": "Verificando...",
            "Verify ownership": "Verificar propiedad",
            "No shared activity is available yet.": "Aún no hay actividad compartida disponible.",
            "Shared read-only summary": "Resumen compartido de solo lectura",
            "Strong buyer-facing record with no obvious credibility blocker in the shared data.": "Registro sólido para compradores sin bloqueos evidentes de credibilidad en los datos compartidos.",
            "This shared profile still shows": "Este perfil compartido todavía muestra",
            "open issue": "incidencia abierta",
            "expired document": "documento caducado",
            "no service history": "sin historial de servicio",
            "ownership not verified": "propiedad no verificada",
            "Model year": "Año del modelo",
            "License plate": "Matrícula",
            "Status": "Estado",
            "Service records": "Registros de servicio",
            "Shared on": "Compartido el",
            "No service history is visible yet.": "Todavía no hay historial de servicio visible.",
            "No tracked documents are included yet.": "Todavía no se incluyen documentos registrados.",
            "No document appears close to expiry in the shared profile.": "Ningún documento parece cercano a caducar en el perfil compartido.",
            "No unresolved issue is visible in this shared view.": "No hay incidencias sin resolver visibles en esta vista compartida.",
            "are visible.": "son visibles.",
            "are included.": "están incluidos.",
            "are approaching soon.": "se acercan pronto.",
            "are still visible in the shared record.": "siguen visibles en el registro compartido.",
            "Adding fill-up...": "Añadiendo repostaje...",
            "Adding expense...": "Añadiendo gasto...",
            "Delete this fuel entry?": "¿Eliminar este registro de combustible?",
            "The vehicle mileage will not be reduced.": "El kilometraje del vehículo no se reducirá.",
            "Delete this expense record?": "¿Eliminar este registro de gasto?"
        },
        en: {}
    };
    const dynamicPatterns = {
        tr: [
            [/^(\d+) completed services$/u, "$1 tamamlanan servis"],
            [/^(\d+) additional expenses$/u, "$1 ek gider"],
            [/^(\d+) fill-ups [•·] (.+) litres$/u, "$1 yakıt alımı • $2 litre"],
            [/^(\d+) entries$/u, "$1 kayıt"],
            [/^(\d+) entry$/u, "$1 kayıt"]
        ],
        ru: [
            [/^(\d+) completed services$/u, "$1 завершённых сервисов"],
            [/^(\d+) additional expenses$/u, "$1 дополнительных расходов"],
            [/^(\d+) fill-ups [•·] (.+) litres$/u, "$1 заправок • $2 литров"],
            [/^(\d+) entries$/u, "$1 записей"],
            [/^(\d+) entry$/u, "$1 запись"]
        ],
        es: [
            [/^(\d+) completed services$/u, "$1 servicios completados"],
            [/^(\d+) additional expenses$/u, "$1 gastos adicionales"],
            [/^(\d+) fill-ups [•·] (.+) litres$/u, "$1 repostajes • $2 litros"],
            [/^(\d+) entries$/u, "$1 registros"],
            [/^(\d+) entry$/u, "$1 registro"]
        ],
        en: []
    };

    function getStoredLocale() {
        const storedLocale = window.localStorage.getItem(STORAGE_KEY);

        if (supportedLocales.includes(storedLocale)) {
            return storedLocale;
        }

        const browserLanguage = String(window.navigator.language || "").toLowerCase().slice(0, 2);

        if (supportedLocales.includes(browserLanguage)) {
            return browserLanguage;
        }

        return "tr";
    }

    function getActiveLocale() {
        const locale = window.currentLocale || getStoredLocale();

        if (supportedLocales.includes(locale)) {
            return locale;
        }

        return "en";
    }

    function getIntlLocale() {
        return intlLocaleMap[getActiveLocale()] || "en-US";
    }

    function translateText(text) {
        const locale = window.currentLocale || "en";

        if (locale === "en" || typeof text !== "string") {
            return text;
        }

        const normalizedText = text.replace(/\s+/g, " ").trim();

        if (!normalizedText) {
            return text;
        }

        const exactTranslation = dictionaries[locale]?.exact?.[normalizedText];

        if (exactTranslation) {
            return exactTranslation;
        }

        let fragmentTranslatedText = text;
        const localeFragments =
            fragmentTranslations[locale] || {};
        const sortedFragments =
            Object.keys(localeFragments).sort(
                (left, right) =>
                    right.length - left.length
            );

        sortedFragments.forEach((fragment) => {
            if (fragmentTranslatedText.includes(fragment)) {
                fragmentTranslatedText =
                    fragmentTranslatedText.replaceAll(
                        fragment,
                        localeFragments[fragment]
                    );
            }
        });

        if (fragmentTranslatedText !== text) {
            return fragmentTranslatedText;
        }

        for (const [expression, replacement] of dynamicPatterns[locale] || []) {
            if (expression.test(normalizedText)) {
                return normalizedText.replace(expression, replacement);
            }
        }

        return text;
    }

    function translateNodeText(node) {
        if (!node || node.nodeType !== Node.TEXT_NODE) {
            return;
        }

        const translatedText = translateText(node.textContent);

        if (translatedText !== node.textContent && translatedText) {
            node.textContent = translatedText;
        }
    }

    function translateAttributes(element) {
        ["placeholder", "aria-label", "title"].forEach((attributeName) => {
            const attributeValue = element.getAttribute(attributeName);

            if (!attributeValue) {
                return;
            }

            const translatedValue = translateText(attributeValue);

            if (translatedValue !== attributeValue) {
                element.setAttribute(attributeName, translatedValue);
            }
        });
    }

    function translateTree(root) {
        if (!root || window.currentLocale === "en") {
            return;
        }

        if (root.nodeType === Node.TEXT_NODE) {
            translateNodeText(root);
            return;
        }

        if (root.nodeType !== Node.ELEMENT_NODE) {
            return;
        }

        translateAttributes(root);
        Array.from(root.childNodes).forEach((childNode) => {
            if (childNode.nodeType === Node.TEXT_NODE) {
                translateNodeText(childNode);
            } else {
                translateTree(childNode);
            }
        });
    }

    function applyTitleTranslation() {
        const locale = window.currentLocale || "en";
        const translatedTitle = dictionaries[locale]?.titles?.[document.title];

        if (translatedTitle) {
            document.title = translatedTitle;
        }
    }

    function translateMessageLines(message) {
        return String(message)
            .split("\n")
            .map((line) => translateText(line))
            .join("\n");
    }

    function injectLanguageSelector() {
        if (document.querySelector("#language-switcher")) {
            return;
        }

        const style = document.createElement("style");
        style.textContent = `
            .language-switcher {
                position: fixed;
                top: 16px;
                right: 16px;
                z-index: 9999;
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 8px 10px;
                border-radius: 999px;
                background: rgba(255, 248, 236, 0.92);
                border: 1px solid rgba(88, 72, 47, 0.18);
                box-shadow: 0 10px 28px rgba(33, 28, 18, 0.08);
                backdrop-filter: blur(8px);
            }
            .language-switcher select {
                border: none;
                background: transparent;
                color: #254f46;
                font: 600 14px/1.2 "Segoe UI", sans-serif;
                outline: none;
                cursor: pointer;
            }
            .language-switcher label {
                color: #5b5546;
                font: 600 12px/1 "Segoe UI", sans-serif;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }
        `;
        document.head.append(style);

        const wrapper = document.createElement("div");
        wrapper.id = "language-switcher";
        wrapper.className = "language-switcher";

        const label = document.createElement("label");
        label.setAttribute("for", "locale-select");
        label.textContent = "Lang";

        const select = document.createElement("select");
        select.id = "locale-select";

        supportedLocales.forEach((locale) => {
            const option = document.createElement("option");
            option.value = locale;
            option.textContent = localeLabels[locale];
            option.selected = locale === window.currentLocale;
            select.append(option);
        });

        select.addEventListener("change", (event) => {
            window.localStorage.setItem(STORAGE_KEY, event.target.value);
            window.location.reload();
        });

        wrapper.append(label, select);
        document.body.append(wrapper);
    }

    function observeTranslations() {
        if (window.currentLocale === "en") {
            return;
        }

        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "characterData") {
                    translateNodeText(mutation.target);
                    return;
                }

                mutation.addedNodes.forEach((addedNode) => {
                    translateTree(addedNode);
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    function observeTitleTranslation() {
        const titleElement =
            document.querySelector("title");

        if (!titleElement) {
            return;
        }

        const observer = new MutationObserver(() => {
            applyTitleTranslation();
        });

        observer.observe(titleElement, {
            childList: true,
            subtree: true,
            characterData: true
        });
    }

    window.currentLocale = getStoredLocale();
    window.translateAppText = translateText;
    window.getAppLocale = getActiveLocale;
    window.getAppIntlLocale = getIntlLocale;
    window.formatAppNumber = (
        value,
        options = {}
    ) =>
        Number(value || 0).toLocaleString(
            getIntlLocale(),
            options
        );
    window.formatAppCurrency = (
        value,
        options = {}
    ) =>
        new Intl.NumberFormat(getIntlLocale(), {
            style: "currency",
            currency: "TRY",
            maximumFractionDigits: 2,
            ...options
        }).format(Number(value) || 0);
    window.formatAppDate = (
        value,
        options = {}
    ) =>
        new Date(value).toLocaleDateString(
            getIntlLocale(),
            options
        );
    window.formatAppDateTime = (
        value,
        options = {}
    ) =>
        new Date(value).toLocaleString(
            getIntlLocale(),
            options
        );
    const originalAlert = window.alert.bind(window);
    const originalConfirm = window.confirm.bind(
        window
    );
    window.alert = (message) =>
        originalAlert(translateMessageLines(message));
    window.confirm = (message) =>
        originalConfirm(
            translateMessageLines(message)
        );

    document.addEventListener("DOMContentLoaded", () => {
        document.documentElement.lang = window.currentLocale;
        applyTitleTranslation();
        translateTree(document.body);
        injectLanguageSelector();
        observeTranslations();
        observeTitleTranslation();
    });
})();
