# BlueLine Express — Online Bus Ticket Reservation System

> **Tagline:** *"Your Journey, Our Priority."*
> B.Tech Information Technology Academic Project · React 19 + TypeScript + Tailwind CSS + Java 17 Spring Boot + Persistent Database

---

## Project Architecture

1. **Frontend (`/src`)**: React 19, TypeScript, Tailwind CSS v4, React Router v7, Axios, Lucide React icons — implementing all **28 pages & modules** across Public, Passenger, Booking/Payment, Cancellation/History, and Admin portals.
2. **Java Spring Boot Backend (`/backend`)**: Java 17, Spring Web, Spring Data JPA, Hibernate, Spring Security (BCrypt + JWT), and **file-based persistent H2 Database** (`./data/blueline_db`) configured for Windows (`http://localhost:8080`).
3. **Integrated AI Studio Preview Runtime (`/server.ts` + `/server/*`)**: Full-stack Express + Node `node:sqlite` (`blueline_express.db`) API mirroring the exact Spring Boot endpoints and DTO contracts so the application runs live on port `3000` inside AI Studio without requiring a local JDK installation in the cloud container.

---

## Java OOP Concepts Demonstrated in `/backend/src/main/java/com/blueline/express/`

| OOP Concept | Actual Implementation |
| --- | --- |
| **Encapsulation** | Private fields with getters/setters and Jakarta validation across `entity/*` (`User`, `Passenger`, `Admin`, `Bus`, `Route`, `Seat`, `Booking`, `PassengerDetail`, `Payment`, `Cancellation`). |
| **Inheritance** | `@Inheritance(strategy = InheritanceType.JOINED)` with abstract base class `User.java` extended by `Passenger.java` and `Admin.java`. |
| **Abstraction** | Abstract `User` entity (`getAccountSummary()`), abstract `AbstractPaymentService` (`buildGatewayNote()`), and service interfaces `PaymentService`, `BookingOperations`, `ReportOperations`. |
| **Polymorphism** | Method overriding across `UpiPaymentServiceImpl`, `CardPaymentServiceImpl`, `NetBankingPaymentServiceImpl` resolved dynamically via `PaymentServiceFactory`; method overloading via `BookingOperations.calculateRefund(LocalDate, double)` and `calculateRefund(double, int)`. |
| **Association** | `Passenger` ↔ `Booking`, `Booking` ↔ `Bus`, `Bus` ↔ `Route`. |
| **Composition** | `Booking` owns `List<PassengerDetail>`, `Payment`, and `Cancellation` with `CascadeType.ALL, orphanRemoval = true`. |
| **Collections** | `List`, `ArrayList`, `Map`, `HashMap`, `LinkedHashMap`, `Set`, `HashSet` used in `BookingServiceImpl`, `PaymentServiceFactory`, `ReportServiceImpl`, `DataInitializer`. |
| **Exception Handling** | Custom exceptions (`UserAlreadyExistsException`, `InvalidBookingException`, `SeatUnavailableException`, `BookingNotFoundException`, `UnauthorizedAccessException`, `PaymentFailedException`) handled centrally by `GlobalExceptionHandler`. |

---

## Running on Windows (Standalone React + Java Spring Boot + H2)

### 1. Start the Java Spring Boot Backend (`http://localhost:8080`)
Prerequisites: **Java 17+** and **Maven 3.9+** installed on Windows.
```powershell
cd backend
mvn spring-boot:run
```
- H2 Console: `http://localhost:8080/h2-console` (JDBC URL: `jdbc:h2:file:./data/blueline_db`, Username: `sa`, Password: empty).

### 2. Start the React Frontend (`http://localhost:5173`)
```powershell
npm install
$env:VITE_API_BASE_URL="http://localhost:8080/api"
npx vite --port 5173
```

### 3. Running Integrated Full-Stack Mode (AI Studio / Single Server on Port 3000)
```powershell
npm install
npm run dev
```

---

## Demo & First-Run Credentials Guide

- **Passenger Account**: Register any account at `/register`, or click **"Sign In as Sample Passenger"** on `/login` to enter an isolated evaluation passenger session with pre-seeded upcoming, completed, and cancelled bookings.
- **Administrator Account**: Navigate to `/admin/login`. On first run (when `ADMIN_PASSCODE` is unset), the portal presents a secure one-time **"Initialize Administrator Account"** form to claim your admin credentials (`BCrypt`/`scrypt` hashed in the database).
