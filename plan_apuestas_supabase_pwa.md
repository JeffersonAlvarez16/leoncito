
# Planificación — Plataforma PWA de **Gestión de Apuestas** con **Supabase**

> **Objetivo**: Construir una plataforma con dos caras:  
> 1) **Panel Tipster/Admin** (web) para subir fotos de tickets/apuestas, extraer datos automáticamente (OCR), validar y publicar (gratis o **fijas**).  
> 2) **App PWA móvil** (usuarios) para recibir **notificaciones push**, ver el feed en tiempo real y **comprar fijas** o apuestas específicas.

Basado en las imágenes de tickets que me compartiste (slips con **equipos, mercado, línea, cuota, stake, fecha/hora, casa**), el sistema hará **OCR + parsing** para poblar los campos y minimizar trabajo manual.

---

## 1) Alcance y Objetivos Clave

- **Subir imagen → OCR → Registro automático** de la apuesta y sus selecciones.
- **Publicación** (gratis o premium/fija) con **notificación push automática** a usuarios segmentados.
- **Venta de fijas**: por apuesta individual, paquete o suscripción mensual.
- **PWA sólo móviles** (Android/iOS vía navegador), con **push**, offline básico y rendimiento alto.
- **Métricas de rendimiento** (win/lose/push, ROI, yield, strike rate) y panel de historial.
- **Moderación/Anti-leaks**: marca de agua, previsualizaciones con blur para no compradores, links con expiración.
- **Pagos locales** (Kushki, PayPhone, Mercado Pago) y **opcional** Lightning con BTCPay Server.
- **Seguridad** con Supabase **RLS** y buenas prácticas de auth/roles.

---

## 2) Perfiles y Roles

- **Admin/Tipster**: crea, sube imagen, valida/edita OCR, publica, marca resultado, gestiona productos/ventas.
- **Usuario**: recibe notificaciones, explora feed, compra fijas/paquetes/suscripción, accede a contenido premium.
- **Invitado**: visualiza un feed limitado (teaser/previews) y flujo de registro/compra.

---

## 3) Historias de Usuario (resumen)

- Como **Tipster**, subo una foto del ticket y el sistema llena automáticamente: **deporte, liga, equipos, mercado, línea, cuota, stake, casa, fecha/hora**.
- Como **Tipster**, publico el pick como **gratis o fija** y el sistema **notifica** a mis seguidores/interesados en esa liga.
- Como **Usuario**, recibo **push** cuando sale un pick que sigo y veo el detalle completo si tengo **acceso** (comprado o gratis).
- Como **Usuario**, puedo **comprar** una fija, un **paquete** de fijas o una **suscripción**; el **acceso** se concede automáticamente.
- Como **Tipster**, cierro apuestas con **resultado** (win/lose/push) y veo **ROI / yield** en el panel.

---

## 4) Arquitectura (alto nivel)

- **Frontend**: Next.js 15 (App Router) + React 19 + Tailwind + shadcn/ui + TanStack Query + Zustand (UI).
- **PWA**: manifest.json, service worker (Workbox opcional), push (FCM Web Push c/ VAPID), modos **mobile-only**.
- **BaaS/Datos**: **Supabase** (Auth, Postgres, Storage, Realtime, Edge Functions, RLS).
- **OCR**: Edge Function invoca **Google Cloud Vision** (o **AWS Textract**). Alternativa económica: **Tesseract**.
- **Notificaciones**: **Firebase Cloud Messaging (FCM)** para Web Push (mejor entrega y tooling).  
- **Pagos**: **Kushki** / **PayPhone** / **Mercado Pago** (web checkout), **BTCPay/Lightning** opcional.
- **Analítica**: **PostHog** (eventos, funnels) u **opcional** Plausible (simple).

**Flujo clave**:  
1) Upload imagen → Storage (Supabase) → registro `bet_images` (status=queued).  
2) Edge Function (**OCR**) procesa, normaliza y crea **borrador** en `bets` + `bet_selections`.  
3) Tipster valida/corrige → **Publica** → Edge Function **Notifica** según segmentación.  
4) Usuarios abren PWA (contenido completo si tienen acceso; si no, preview + CTA).  
5) Compras → Webhook de pago → **access_grants** → Notificación de acceso concedido.

---

## 5) Stack Técnico y Herramientas

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind, shadcn/ui, TanStack Query, Zustand.
- **PWA**: Workbox (estrategias de caché), manifest + service worker, FCM Web Push.
- **BaaS**: Supabase (Auth + Postgres + Storage + Realtime + Edge Functions + RLS).
- **OCR**: Google Vision / AWS Textract **(recomendado)**; Tesseract (opción económica con tuning).
- **Pagos**: Kushki, PayPhone o Mercado Pago (según acuerdo y comisiones). BTCPay (Lightning) opcional.
- **Analítica/Logs**: PostHog (eventos), Supabase logs, Sentry (frontend).

---

## 6) Esquema de Base de Datos (Supabase / Postgres)

> Nombres en `snake_case`. Ajustar según necesidades. **RLS obligatorio**.

```sql
-- Perfiles (vinculados a auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique,
  role text not null default 'user', -- user | admin | tipster
  created_at timestamptz default now()
);

-- Seguir tipsters/deportes/ligas (para segmentar notificaciones)
create table public.follows (
  id bigserial primary key,
  follower_id uuid references public.profiles(id) on delete cascade,
  target_type text not null, -- 'tipster' | 'sport' | 'league'
  target_id text not null,
  created_at timestamptz default now(),
  unique(follower_id, target_type, target_id)
);

-- Imágenes subidas (tickets/fotos)
create table public.bet_images (
  id bigserial primary key,
  uploader_id uuid references public.profiles(id) on delete set null,
  storage_path text not null,
  status text not null default 'queued', -- queued|processing|failed|parsed
  ocr_confidence numeric,
  ocr_json jsonb,
  created_at timestamptz default now()
);

-- Apuestas (cabecera)
create table public.bets (
  id bigserial primary key,
  tipster_id uuid references public.profiles(id) on delete set null,
  title text,
  sport text not null,
  league text,
  starts_at timestamptz,
  is_premium boolean default false,
  price_cents int default 0,
  status text not null default 'draft', -- draft|published|settled|void
  outcome text,                         -- win|lose|push|null
  yield_pct numeric,
  cover_image_path text,
  created_at timestamptz default now(),
  published_at timestamptz
);

-- Selecciones (cada pick dentro de la apuesta)
create table public.bet_selections (
  id bigserial primary key,
  bet_id bigint references public.bets(id) on delete cascade,
  match_id text,
  home_team text,
  away_team text,
  market text,   -- ML, AH, O/U, BTTS, etc.
  line text,     -- e.g. -1.5, 2.5
  odds numeric,
  stake numeric, -- unidades o %
  bookie text,
  result text,   -- win|lose|push|null
  created_at timestamptz default now()
);

-- Productos para vender: fija individual, paquete, suscripción
create table public.products (
  id bigserial primary key,
  type text not null, -- 'single_pick' | 'package' | 'subscription'
  name text not null,
  description text,
  price_cents int not null,
  currency text default 'USD',
  duration_days int,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Qué apuesta(s) incluye un producto (si aplica)
create table public.product_items (
  id bigserial primary key,
  product_id bigint references public.products(id) on delete cascade,
  bet_id bigint references public.bets(id) on delete cascade
);

-- Compras
create table public.purchases (
  id bigserial primary key,
  buyer_id uuid references public.profiles(id) on delete set null,
  product_id bigint references public.products(id) on delete set null,
  provider text,       -- 'kushki'|'payphone'|'mp'|'ln'
  provider_tx_id text,
  amount_cents int,
  status text not null default 'pending', -- pending|paid|failed|refunded
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Accesos concedidos (por compra)
create table public.access_grants (
  id bigserial primary key,
  buyer_id uuid references public.profiles(id) on delete cascade,
  bet_id bigint references public.bets(id) on delete cascade,
  expires_at timestamptz,
  created_at timestamptz default now(),
  unique (buyer_id, bet_id)
);

-- Tokens push (FCM/OneSignal para Web)
create table public.push_tokens (
  id bigserial primary key,
  user_id uuid references public.profiles(id) on delete cascade,
  provider text not null, -- 'fcm'|'onesignal'
  token text not null,
  device_info jsonb,
  created_at timestamptz default now(),
  unique (provider, token)
);

-- Historial de notificaciones
create table public.notifications (
  id bigserial primary key,
  type text not null,    -- 'new_bet'|'reminder'|...
  payload jsonb not null,
  sent_at timestamptz,
  created_at timestamptz default now()
);
```

### RLS (políticas base — ejemplo)

```sql
-- Activar RLS
alter table public.profiles enable row level security;
alter table public.bets enable row level security;
alter table public.bet_selections enable row level security;
alter table public.bet_images enable row level security;
alter table public.products enable row level security;
alter table public.product_items enable row level security;
alter table public.purchases enable row level security;
alter table public.access_grants enable row level security;
alter table public.push_tokens enable row level security;
alter table public.notifications enable row level security;

-- profiles: cada usuario ve/edita su perfil
create policy "profiles-self" on public.profiles
for select using (id = auth.uid())
with check (id = auth.uid());

-- bets: publicadas visibles para todos; borradores solo del tipster
create policy "bets-public" on public.bets
for select using (
  status = 'published' or tipster_id = auth.uid()
);

create policy "bets-owner-write" on public.bets
for insert with check (tipster_id = auth.uid());
create policy "bets-owner-update" on public.bets
for update using (tipster_id = auth.uid());

-- bet_selections: visibles si la bet es visible al usuario
-- (simplificado: reutiliza visibilidad de bets vía join en la app)

-- purchases: ve sus compras
create policy "purchases-self" on public.purchases
for select using (buyer_id = auth.uid());

-- access_grants: ve accesos propios
create policy "access-self" on public.access_grants
for select using (buyer_id = auth.uid());
```

---

## 7) Edge Functions (Supabase)

1. **`ocr-parse`**  
   - Input: `bet_images.id`.  
   - Llama **GCP Vision**/**Textract** → parsea campos clave → normaliza nombres (equipos/liga) → crea **borrador** en `bets` y `bet_selections` (status=`draft`) o marca `bet_images.status='failed'` si baja confianza.
2. **`publish-bet`**  
   - Valida campos requeridos, marca `bets.status='published'`, setea `published_at`, aplica **marca de agua** a la imagen pública si procede.
3. **`send-push`**  
   - Segmenta por `follows` (tipster/deporte/liga). Envía **FCM Web Push**. Inserta en `notifications`.
4. **`payment-webhook`**  
   - Recibe webhooks de **Kushki/PayPhone/MP/LN** → valida firma → `purchases.status='paid'` → crea **`access_grants`** (y expiración si suscripción/paquete).
5. **`settle-bet`**  
   - Permite cerrar apuestas con **outcome** (win/lose/push) y recalcular **yield/ROI**.
6. **`watermark-image`** *(opcional si no en `publish-bet`)*  
   - Genera imagen con **marca de agua**/blur para previews públicas.

---

## 8) PWA (sólo móviles)

- **Manifest** con orientación `portrait`, íconos, nombre corto/largo, `display: standalone`.
- **Service Worker** (Workbox):  
  - **Cache-first** para assets estáticos.  
  - **Network-first** para feed (Revalidate con SWR).  
  - **Background sync** (opcional) para reintentos de subida/compra.  
- **Push Web (FCM)** con **VAPID** y topic/segmentación por follows.
- **Instalación**: banner A2HS, check de compatibilidad en iOS Safari.
- **Guardado de estado** (Zustand) + sincronización de server-state (TanStack Query).

**Snippet de `manifest.json` (mínimo):**
```json
{
  "name": "Apuestas Pro",
  "short_name": "ApuestasPro",
  "display": "standalone",
  "start_url": "/",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

---

## 9) Pagos y Accesos

- **Proveedores**: **Kushki** / **PayPhone** / **Mercado Pago**. Seleccionar según comisiones/SLAs.  
- **Flujo**: Checkout → pago aprobado → **webhook** → `purchases.status='paid'` → crear `access_grants`.  
- **Productos**:  
  - `single_pick` (fija individual) → concede acceso a 1 `bet`.  
  - `package` (N fijas) → `product_items` enlaza varias `bets`.  
  - `subscription` (mensual) → **expiro** acceso con `duration_days` o bandera de membresía.  
- **Lightning opcional** (BTCPay Server) para compras rápidas con **tickets** de bajo costo.

---

## 10) Métricas & Analítica

- **Producto**: MAU/DAU, suscripciones activas, tasa de conversión (preview → compra), retención cohortes.
- **Apuestas**: win rate, **yield**, **ROI**, closing line value (**CLV**), tiempo de publicación vs cierre.
- **Notificaciones**: entregas, CTR, desuscripciones por canal/segmento.
- **Calidad OCR**: % auto-parseadas vs. manuales, confianza media, bookies con más errores.

---

## 11) Seguridad, Cumplimiento y Anti-leaks

- **RLS** estricto; JWT corto; rotación de claves; **auditoría** de cambios críticos.
- **Previews** con **blur** y **marca de agua** con ID/fecha para desalentar filtraciones.
- **Links** firmados con expiración (Storage) y **expiración de accesos** en suscripciones.
- **Política de reembolsos** clara para eventos `void`/cancelados.  
- **Aviso legal** y **uso responsable** (cumplir normativa local sobre apuestas/información).

---

## 12) Roadmap por Sprints (2 semanas por sprint, flexible)

**Sprint 0 — Base (3–4 días)**  
- Supabase: proyecto, Auth, Storage, DB con migraciones + RLS base.  
- Next.js + Tailwind + shadcn/ui + PWA scaffold (manifest/SW) + layout móvil.

**Sprint 1 — Upload & OCR (1–2 sem)**  
- Subida de imágenes (Storage) + barra de progreso.  
- Edge `ocr-parse` (GCP Vision/Textract) + normalización + creación de `bets`/`bet_selections` (borrador).  
- Pantalla Admin: **borradores** con edición/validación.

**Sprint 2 — Publicación & Notificaciones (1 sem)**  
- `publish-bet` + marca de agua/blur.  
- Push FCM Web + segmentación por `follows` (tipster/deporte/liga).  
- Feed PWA con **Realtime** y filtros.

**Sprint 3 — Pagos & Accesos (1–2 sem)**  
- Checkout (Kushki/PayPhone/MP) + `payment-webhook` + `access_grants`.  
- Productos: fija individual, paquete y suscripción.  
- Paywalls (preview/CTA).

**Sprint 4 — Resultados & Métricas (1 sem)**  
- `settle-bet` + panel de rendimiento (ROI/yield/win rate).  
- PostHog (eventos, funnels), dashboards básicos.

**Sprint 5 — Endurecimiento (1 sem)**  
- Pruebas E2E, hardening RLS, protección anti-screenshots (limitada), políticas de reembolso, Términos/Privacidad.  
- Preparar **TWA** (Android) opcional o guía de instalación PWA en iOS/Android.

---

## 13) Estimación de Costos (mensual, aproximado)

- **Supabase**: $0–25 (Starter) → $25–99 (Pro) según uso.  
- **OCR**: GCP Vision/Textract: $1.5–$2 por 1K páginas aprox. (varía). Tesseract: $0 (tu hosting).  
- **FCM**: $0.  
- **PostHog Cloud**: $0–$$$ (según eventos) u on-prem.  
- **Pasarela de pago**: comisión por transacción (1.9–4.9% + fijo, depende del proveedor).  
- **Dominio/CDN**: $0–10 + (opcional Vercel/Cloudflare).

---

## 14) Backlog Priorizado (MVP → V1)

- **MVP**  
  - [ ] Auth + perfiles + RLS.  
  - [ ] Upload imagen + `bet_images`.  
  - [ ] `ocr-parse` (bookie principal).  
  - [ ] Editor de borradores + publicación + notificación push.  
  - [ ] Feed PWA + preview/CTA.

- **V1**  
  - [ ] Pagos + `payment-webhook` + `access_grants`.  
  - [ ] Productos (fija/paquete/suscripción).  
  - [ ] Resultados (settled) + métricas.  
  - [ ] Analítica (PostHog) + panel básico.  
  - [ ] Watermark/anti-leaks.

- **Posterior**  
  - [ ] Multi-bookie OCR + entrenamientos.  
  - [ ] Integración datos deportivos (API) para autoverificación de resultados.  
  - [ ] TWA (Android) y shortcuts PWA.  
  - [ ] Programa de referidos y afiliados.  

---

## 15) Definición de Hecho (DoD) — claves

- Migraciones reproducibles + RLS revisada.  
- Edge Functions con pruebas unitarias y logs.  
- PWA con Lighthouse ≥ 90 en Performance/Best Practices/SEO/PWA.  
- Check de accesibilidad (a11y) básico (contrast, roles, focus).  
- Webhooks de pagos con validación de firma y reintentos.  
- Documentación `.env` y rotación de claves.

---

## 16) Variables de Entorno (ejemplo)

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GCP_VISION_KEY=           # o AWS_TEXTRACT_KEY/SECRET/REGION
FCM_VAPID_PUBLIC_KEY=
FCM_VAPID_PRIVATE_KEY=
PAY_PROVIDER=KUSHKI|PAYPHONE|MP|LN
PAY_* (claves del proveedor elegido)
POSTHOG_KEY= (opcional)
TZ=America/Guayaquil
```

---

## 17) Riesgos & Mitigación

- **OCR inexacto**: empezar con 1–2 bookies principales, plantillas/regex por formato, correcciones guiadas.  
- **Entrega push en iOS**: usar FCM Web + guías de instalación PWA; fallback a email/WhatsApp (manual) si crítico.  
- **Fraude/chargebacks**: limitar reembolsos y verificar webhooks firmados; auditoría de compras.  
- **Filtraciones**: watermark/blur/time-limited URLs; detección de abuso (tokens por usuario).  
- **Regulatorio**: disclaimers, +18, políticas de uso responsable y cumplimiento local.

---

## 18) Entregables

- Repos (frontend Next.js + supabase/migraciones + edge functions).  
- Infra PWA (manifest/SW) + push FCM.  
- Migraciones SQL + políticas RLS.  
- Edge Functions (`ocr-parse`, `publish-bet`, `send-push`, `payment-webhook`, `settle-bet`).  
- Documentación de despliegue y `.env`.  
- Dashboard admin + PWA móvil de usuarios (feed, compra, acceso).

---

**Siguiente paso sugerido**: arrancar con **Sprint 0** (creación proyecto Supabase + scaffold Next.js + PWA + RLS base) y elegir **proveedor de OCR** y **pasarela de pagos** a usar en el MVP.
