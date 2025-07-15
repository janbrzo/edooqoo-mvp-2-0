# MVP2 - Plan Techniczny: Konta i Płatności

## 🎯 Cel Etapu
Przekonwertować użytkowników na subskrypcje przez zbudowanie minimalnego systemu:
- Kont nauczycieli z zarządzaniem uczniami
- Systemu tokenów i płatności
- Zintegrowanego generatora worksheetów
- Dashboardu z historią

## 📋 Zakres Funkcjonalny

### 🔐 1. Konta Nauczycieli
- **Wybór typu konta:** Free Demo, Side-Gig Plan, Full-Time Plans
- **Rejestracja:** email + hasło + imię + nazwisko
- **Logowanie** z opcją "Zapamiętaj mnie"
- **Reset hasła** (email)
- **Po rejestracji:** automatyczne 2 darmowe tokeny + redirect do Dashboard

### 👨‍🎓 2. Dashboard: Uczniowie i Historia
- **Sekcja Uczniowie:** lista imion + przycisk "Dodaj ucznia"
- **Formularz dodawania ucznia:**
  - Imię ucznia
  - Poziom CEFR
  - Główny cel (dropdown: praca/egzamin/ogólny angielski)
- **Historia worksheetów:** ostatnie 5 z datą i tematem

### 🧾 3. Generator Zintegrowany z Uczniami
- **Dropdown "Wybierz ucznia"** (obowiązkowy)
- **Autofill** poziomu i celu po wyborze
- **Przypisanie** worksheet do ucznia po wygenerowaniu
- **Odjęcie tokena** z konta nauczyciela

### 🗂️ 4. Historia Worksheetów Ucznia
- Lista worksheetów przypisanych do ucznia
- Informacje: data, temat, podgląd, możliwość pobrania
- Dostępne w głównym dashboardzie

### 💳 5. System Tokenów i Płatności

#### A. Subskrypcje (domyślny model)
- **Side-Gig Plan:** $9/miesiąc, 15 worksheetów
- **Full-Time Plans:** $19/$39/$59/$79, 30/60/90/120 worksheetów
- **Stripe Subscriptions**
- **Po przekroczeniu limitu:** komunikat + opcja upgrade

#### B. Tokeny (fallback)
- **Cena:** 5 tokenów za $7.50
- **1 worksheet = 1 token**
- **Start:** 2 darmowe tokeny
- **Paywall przy token_balance == 0**

### 🔄 6. Krytyczny Flow Użytkownika
1. Wybór typu konta: Free Demo / płatny plan
2. Jeśli płatny → płatność + rejestracja
3. Komunikat: "Dodaj ucznia, by zacząć"
4. Dodanie ucznia → redirect do generatora
5. Generowanie worksheetów → odjęcie tokenów
6. Po wyczerpaniu → paywall

## 🏗️ Plan Implementacji

### FAZA 1: Fundament (1-2 dni)
- ✅ Rozszerzenie schematu bazy danych
- ✅ Konfiguracja Supabase Auth
- ✅ Podstawowa struktura routingu
- ✅ Komponenty autentykacji

### FAZA 2: Dashboard i Uczniowie (2-3 dni)
- Dashboard nauczyciela
- Zarządzanie uczniami (CRUD)
- Historia worksheetów
- Podstawowa nawigacja

### FAZA 3: Generator Zintegrowany (2-3 dni)
- Wybór ucznia w generatorze
- System tokenów
- Przypisywanie worksheetów
- Logika paywall

### FAZA 4: Płatności i Subskrypcje (3-4 dni)
- Strona cennika
- Integracja Stripe (subskrypcje + tokeny)
- Webhooks Stripe
- System limitów miesięcznych

### FAZA 5: Finalizacja (1-2 dni)
- Poprawki UX/UI
- Testy końcowe
- Wdrożenie

## 📊 Kluczowe Metryki
- **Konwersja:** Free → Paid
- **Engagement:** worksheety/nauczyciel/miesiąc
- **Revenue:** MRR + one-time payments
- **Retencja:** aktywni użytkownicy

## ⚠️ Przesunięte na Etap 3+
- Weryfikacja e-mail
- Role zespołowe
- Edycja preferencji nauczyciela
- Szczegółowe dane ucznia
- Notatki i postępy
- Quick templates
- AI recommendations

## 🔄 Aktualizacje Planu
*Ten dokument będzie aktualizowany w trakcie implementacji*

---
*Ostatnia aktualizacja: 2025-01-15*