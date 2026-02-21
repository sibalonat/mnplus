Today challenges are not easier, but require more of a creative mindset. While I have loved to deploy things in all sorted ways, using WordPress site for creating pages, different type of hosting, VPS, shared, docker and you name it. In the beginning of my career and maybe sometimes also now, I have an hesitation, or fear that I will be judged by the result of my work when it ends up in deployment. While gathering my thoughts about this article, that is related to tunnels, I remember at that time, my assumption is that this looked as burrower attitude - excavating a space where we could take refuge.

I'll start with a statement. I love Docker, I believe its awesome for some type of applications, and specifically for the ones I create in daily basis. I haven't always used it, but its usage peaked specifically during Covid pandemic. At that time, since developers and managers were burrowing at their own spaces, without to much commuting, it made it possible to think creatively about deployment solutions. At that time, I remember I was trying to create an application as most people about Video Conversations. And there, perfectly honest I first tried ngrok. Everybody was talking about this type of solutions and not much was available about the type of implementation for big applications. I couldn't do it at that time, and it left me with an impression of worthlessness.

When I start creating applications today, I for sure chose between Django and Laravel. And when its Laravel there is this cool package you can install and use it with docker called sail. Its pretty amazing as a tool and as far I remember whenever I have used sail, I might have tried to share the site as Laravel recommends in the documentation. Its not that it doesn't work, is just that I want things to live reload every time I make a change to the website. otherwise it never seemed to have any value if this couldn't be done. And at the same time was also the issue that it was another container, not image, a completely separate container.

Therefore I decided to try trycloudflare image, and integrating it with an application that I share with my brother without taking to much of my time to check environments align.

---

## 🎮 The Tunnel Connection Game

Before we dive into the technical details, here's a little game inspired by the burrowing metaphor. Cloudflare tunnels pop up randomly — use arrow keys to move and SPACE to connect before they disappear! Miss 5 tunnels and it's game over.

<div style="max-width: min(300px, 90vw); margin: 30px auto;">
  <canvas id="burrowGame" width="300" height="400" style="border: 2px solid #3498db; border-radius: 8px; display: block; background: #1a1a1a;"></canvas>
  <div style="margin-top: 15px; text-align: center;">
    <button id="startBurrowGame" style="background: #3498db; color: white; border: none; padding: 10px 24px; border-radius: 4px; font-size: 16px; cursor: pointer; font-weight: bold;">
      Start Game
    </button>
    <p id="burrowScore" style="margin-top: 10px; font-weight: bold; color: #2ecc71;">Score: 0</p>
  </div>
</div>

<script src="posts/burrow-game.js"></script>

---

# Laravel Sail + Cloudflare Tunnel: A Production-Grade Development Setup

A complete guide to running Laravel 12 with Sail behind a Cloudflare Quick Tunnel — with Vite HMR, queue workers, scheduler, and Laravel Reverb WebSockets all working through a single public URL.

---

## Table of Contents

- [Why Cloudflare Tunnel?](#why-cloudflare-tunnel)
- [Architecture Overview](#architecture-overview)
- [Step 1: The Dockerfile](#step-1-the-dockerfile)
- [Step 2: Supervisord — Process Manager](#step-2-supervisord--process-manager)
- [Step 3: The Start Script](#step-3-the-start-script)
- [Step 4: Nginx Configuration](#step-4-nginx-configuration)
- [Step 5: Vite Configuration](#step-5-vite-configuration)
- [Step 6: Docker Compose](#step-6-docker-compose)
- [Step 7: Laravel Reverb (WebSockets)](#step-7-laravel-reverb-websockets)
- [Step 8: Session & CSRF Configuration](#step-8-session--csrf-configuration)
- [Step 9: Environment Variables](#step-9-environment-variables)
- [Running It](#running-it)
- [Verifying Everything Works](#verifying-everything-works)
- [Pitfalls & Troubleshooting](#pitfalls--troubleshooting)
- [Moving Toward Production](#moving-toward-production)

---

## Why Cloudflare Tunnel?

| Feature           | Cloudflare Tunnel                                | ngrok                                    |
| ----------------- | ------------------------------------------------ | ---------------------------------------- |
| Cost              | Free (Quick Tunnels)                             | Free tier with limits, paid plans        |
| Auth              | No account needed for quick tunnels              | Requires account + auth token            |
| URL               | Random `*.trycloudflare.com` subdomain           | Random `*.ngrok-free.app` subdomain      |
| Speed             | Uses Cloudflare's edge network (very fast)       | Good, but Cloudflare's network is larger |
| Custom domains    | Yes (with Cloudflare account)                    | Yes (paid)                               |
| Install           | Single binary (`cloudflared`)                    | Single binary (`ngrok`)                  |
| WebSocket support | Full, including WSS                              | Full                                     |
| Interstitial page | None                                             | Free tier shows a warning page           |
| Best for          | Production-grade tunnels, Cloudflare integration | Quick dev/demos, webhook testing         |

The main practical difference: Cloudflare Tunnel is fully free with no rate limits or interstitial pages, while ngrok's free tier has connection limits and a nag page that can break API callbacks and webhooks.

Quick Tunnels generate a new random URL on every restart. For stable URLs, use a [Named Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps) with a Cloudflare account (still free).

---

## Architecture Overview

Everything runs inside a single Docker container managed by Supervisord:

```
Browser → *.trycloudflare.com → cloudflared → nginx:80
    ├── PHP requests (/, *.php)      → php-fpm:9000 (Laravel)
    ├── Vite requests (/@vite/, etc.) → vite:5173 (HMR + assets)
    └── WebSocket (/app/*)           → reverb:8085 (Laravel Reverb)

Supervisord also manages:
    ├── queue-worker  (php artisan queue:work)
    ├── scheduler     (php artisan schedule:run every 60s)
    └── cloudflared   (the tunnel itself)
```

The key insight: nginx on port 80 acts as the single entry point. It routes requests by URL path — PHP to php-fpm, Vite dev paths to the Vite server, and WebSocket upgrades on `/app` to Reverb. Since cloudflared only tunnels one port (80), this multiplexing is essential.

---

## Step 1: The Dockerfile

Start from the default Sail Dockerfile and add three things: nginx, php-fpm configuration, and cloudflared.

```dockerfile
# docker/8.4/Dockerfile
FROM ubuntu:24.04

LABEL maintainer="Taylor Otwell"

ARG WWWGROUP
ARG NODE_VERSION=22
ARG MYSQL_CLIENT="mysql-client"
ARG POSTGRES_VERSION=17

WORKDIR /var/www/html

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC
ENV SUPERVISOR_PHP_USER="sail"

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Standard Sail packages + nginx
RUN apt-get update && apt-get upgrade -y \
    && mkdir -p /etc/apt/keyrings \
    && apt-get install -y gnupg gosu curl ca-certificates zip unzip git \
       supervisor sqlite3 libcap2-bin libpng-dev python3 dnsutils \
       librsvg2-bin fswatch ffmpeg nano \
       nginx \  # <-- Added: we replace artisan serve with nginx + php-fpm
    && curl -sS 'https://keyserver.ubuntu.com/pks/lookup?op=get&search=0xb8dc7e53946656efbce4c1dd71daeaab4ad4cab6' \
       | gpg --dearmor | tee /etc/apt/keyrings/ppa_ondrej_php.gpg > /dev/null \
    && echo "deb [signed-by=/etc/apt/keyrings/ppa_ondrej_php.gpg] https://ppa.launchpadcontent.net/ondrej/php/ubuntu noble main" \
       > /etc/apt/sources.list.d/ppa_ondrej_php.list \
    && apt-get update \
    && apt-get install -y \
       php8.4-cli php8.4-fpm php8.4-dev \  # <-- php-fpm added
       php8.4-pgsql php8.4-sqlite3 php8.4-gd \
       php8.4-curl php8.4-mbstring php8.4-xml php8.4-zip \
       php8.4-bcmath php8.4-soap php8.4-intl php8.4-readline \
       php8.4-redis php8.4-igbinary php8.4-msgpack \
       php8.4-swoole php8.4-memcached php8.4-pcov php8.4-imagick php8.4-xdebug \
    # ... Node, Composer, Postgres client, Yarn — same as stock Sail ...
    && apt-get -y autoremove && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

# --- Cloudflared binary ---
RUN curl -sL https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 \
    -o /usr/local/bin/cloudflared \
    && chmod +x /usr/local/bin/cloudflared

RUN setcap "cap_net_bind_service=+ep" /usr/bin/php8.4

# --- Configure PHP-FPM ---
# Switch from Unix socket to TCP port 9000, run as the sail user
RUN sed -i 's|listen = /run/php/php8.4-fpm.sock|listen = 9000|g' /etc/php/8.4/fpm/pool.d/www.conf \
    && sed -i 's|;clear_env = no|clear_env = no|g' /etc/php/8.4/fpm/pool.d/www.conf \
    && sed -i 's|user = www-data|user = sail|g' /etc/php/8.4/fpm/pool.d/www.conf \
    && sed -i 's|group = www-data|group = sail|g' /etc/php/8.4/fpm/pool.d/www.conf \
    && mkdir -p /run/php

# Create the sail user
RUN userdel -r ubuntu 2>/dev/null || true
RUN groupadd --force -g $WWWGROUP sail
RUN useradd -ms /bin/bash --no-user-group -g $WWWGROUP -u 1337 sail

# Copy config files
COPY start-container /usr/local/bin/start-container
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY php.ini /etc/php/8.4/cli/conf.d/99-sail.ini
COPY nginx.conf /etc/nginx/sites-available/default
RUN chmod +x /usr/local/bin/start-container \
    && rm -f /etc/nginx/sites-enabled/default \
    && ln -s /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default

EXPOSE 80/tcp
EXPOSE 8085/tcp

ENTRYPOINT ["start-container"]
```

**What changed from stock Sail:**

- Added `nginx` to apt-get packages
- Installed `php8.4-fpm` alongside `php8.4-cli`
- Configured php-fpm to listen on TCP port 9000 (not a Unix socket)
- Downloaded the `cloudflared` binary
- Removed `ENV SUPERVISOR_PHP_COMMAND` — we no longer use `artisan serve`
- Exposed port 8085 for Reverb (direct access, optional)

---

## Step 2: Supervisord — Process Manager

Supervisord replaces the default single-process `artisan serve` with six managed processes:

```ini
; docker/8.4/supervisord.conf
[supervisord]
nodaemon=true
user=root
logfile=/var/log/supervisor/supervisord.log
pidfile=/var/run/supervisord.pid

; --- PHP-FPM (replaces artisan serve) ---
[program:php-fpm]
command=/usr/sbin/php-fpm8.4 --nodaemonize
user=root
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

; --- Nginx (reverse proxy) ---
[program:nginx]
command=/usr/sbin/nginx -g "daemon off;"
user=root
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

; --- Queue Worker ---
[program:queue-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work database --sleep=3 --tries=3 --max-time=3600
user=%(ENV_SUPERVISOR_PHP_USER)s
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
numprocs=1
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

; --- Cloudflare Tunnel ---
[program:cloudflared]
process_name=%(program_name)s
command=/usr/local/bin/cloudflared tunnel --url http://127.0.0.1:80 --no-autoupdate
user=root
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

; --- Laravel Reverb (WebSocket server) ---
[program:reverb]
process_name=%(program_name)s
command=php /var/www/html/artisan reverb:start --host=0.0.0.0 --port=8085
user=%(ENV_SUPERVISOR_PHP_USER)s
autostart=true
autorestart=true
stopasgroup=true
killasgroup=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0

; --- Task Scheduler ---
[program:scheduler]
process_name=%(program_name)s
command=/bin/sh -c "while true; do php /var/www/html/artisan schedule:run --no-interaction; sleep 60; done"
user=%(ENV_SUPERVISOR_PHP_USER)s
autostart=true
autorestart=true
stdout_logfile=/dev/stdout
stdout_logfile_maxbytes=0
stderr_logfile=/dev/stderr
stderr_logfile_maxbytes=0
```

**Notes:**

- `numprocs=1` for the queue worker — increase for heavier workloads. In production you'd run 3–8 workers depending on your job volume.
- `--max-time=3600` restarts the queue worker hourly to prevent memory leaks.
- The scheduler uses a shell loop because `schedule:work` (the daemon alternative) has had historical issues with timezone handling in containers.
- `cloudflared` runs as root because it needs to bind ICMP for diagnostics. The tunnel itself forwards to `127.0.0.1:80`.
- `stopasgroup=true` / `killasgroup=true` on long-running PHP processes ensures child processes get cleaned up on restart.

---

## Step 3: The Start Script

```bash
#!/usr/bin/env bash
# docker/8.4/start-container

if [ "$SUPERVISOR_PHP_USER" != "root" ] && [ "$SUPERVISOR_PHP_USER" != "sail" ]; then
    echo "You should set SUPERVISOR_PHP_USER to either 'sail' or 'root'."
    exit 1
fi

if [ ! -z "$WWWUSER" ]; then
    usermod -u $WWWUSER sail
fi

if [ ! -d /.composer ]; then
    mkdir /.composer
fi

chmod -R ugo+rw /.composer

if [ $# -gt 0 ]; then
    if [ "$SUPERVISOR_PHP_USER" = "root" ]; then
        exec "$@"
    else
        exec gosu $WWWUSER "$@"
    fi
else
    exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
fi
```

This is the standard Sail entry point. When no arguments are passed (the normal case), it launches supervisord. When you run `sail shell` or `sail artisan`, the `$@` branch executes your command directly.

---

## Step 4: Nginx Configuration

Nginx is the routing brain of the whole setup. It sits on port 80 and directs traffic to three backends:

```nginx
# docker/8.4/nginx.conf
server {
    listen 80;
    server_name _;
    root /var/www/html/public;
    index index.php index.html;

    client_max_body_size 100M;

    # ==========================================
    # Vite dev server proxy
    # ==========================================
    # When `npm run dev` is running, Vite serves on port 5173.
    # These rules proxy all Vite-specific paths through nginx.
    # Origin header is stripped so Vite doesn't reject tunnel requests.

    location /@vite/ {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header Origin "";
    }

    location /@id/ {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Origin "";
    }

    location /@fs/ {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Origin "";
    }

    location = /@react-refresh {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Origin "";
    }

    location /resources/ {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Origin "";
    }

    # ^~ prevents the dotfile deny rule from blocking /node_modules/.vite/
    location ^~ /node_modules/ {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header Origin "";
    }

    # Vite HMR WebSocket
    location /__vite_hmr {
        proxy_pass http://127.0.0.1:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header Origin "";
    }

    # ==========================================
    # Reverb WebSocket proxy
    # ==========================================
    # Routes WebSocket connections through port 80 so they work
    # through the Cloudflare tunnel (which only proxies port 80).
    location /app {
        proxy_pass http://127.0.0.1:8085;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
        proxy_send_timeout 60s;
    }

    # ==========================================
    # Laravel (default)
    # ==========================================
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        fastcgi_pass 127.0.0.1:9000;
        fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_buffering off;

        # Forward proxy headers so Laravel sees the real scheme/host
        fastcgi_param HTTP_X_FORWARDED_FOR $proxy_add_x_forwarded_for;
        fastcgi_param HTTP_X_FORWARDED_PROTO $http_x_forwarded_proto if_not_empty;
        fastcgi_param HTTP_X_FORWARDED_PORT $http_x_forwarded_port if_not_empty;
    }

    location ~ /\.(?!well-known).* {
        deny all;
    }
}
```

**Why each section matters:**

- **Vite proxy blocks**: When the browser loads the tunnel URL, asset paths like `/@vite/client` need to reach the Vite dev server. Without these rules, they'd hit Laravel and return 404. The `Origin ""` header strip is critical — Vite rejects requests where the Origin doesn't match its configured host.
- **Reverb proxy (`/app`)**: Pusher-compatible clients connect to `/app/{key}`. By proxying this path to Reverb on port 8085, WebSocket connections work through the tunnel without needing a separate port or tunnel.
- **`X-Forwarded-Proto` forwarding**: Cloudflare terminates TLS. Without this header, Laravel would generate `http://` URLs even though the browser is on `https://`.

---

## Step 5: Vite Configuration

Two changes make Vite work behind the tunnel:

```typescript
// vite.config.ts
import { defineConfig, type Plugin } from "vite";
import laravel from "laravel-vite-plugin";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import fs from "fs";
import path from "path";

/**
 * Rewrites the hot file so asset URLs are relative.
 *
 * laravel-vite-plugin writes "http://localhost:5173" into public/hot.
 * Laravel reads this file to generate asset URLs. By blanking it,
 * Laravel generates relative URLs (e.g., "/@vite/client") that resolve
 * against whatever origin the browser is on — localhost OR the tunnel.
 */
function cloudflaredTunnel(): Plugin {
  return {
    name: "cloudflared-tunnel",
    enforce: "post",
    configureServer(server) {
      server.httpServer?.once("listening", () => {
        const hotFile = path.resolve(__dirname, "public/hot");
        const rewrite = () => {
          if (fs.existsSync(hotFile)) {
            fs.writeFileSync(hotFile, "");
          } else {
            setTimeout(rewrite, 50);
          }
        };
        setTimeout(rewrite, 100);
      });
    },
  };
}

export default defineConfig({
  plugins: [
    laravel({
      input: ["resources/css/app.css", "resources/js/app.tsx"],
      refresh: true,
    }),
    react(),
    tailwindcss(),
    cloudflaredTunnel(),
  ],
  server: {
    host: "0.0.0.0", // Listen on all interfaces (nginx connects via 127.0.0.1)
    allowedHosts: true, // Accept requests from any hostname (tunnel domain)
    cors: true,
    hmr: {
      path: "__vite_hmr", // Custom path that nginx proxies with WebSocket upgrade
    },
  },
});
```

**How the hot file trick works:**

1. `npm run dev` starts → Vite calls `laravel-vite-plugin` → plugin writes `http://[::1]:5173` to `public/hot`
2. Our `cloudflaredTunnel()` plugin fires 100ms later → empties the file
3. Laravel's `Vite::asset()` sees an empty hot file → generates relative URLs like `/@vite/client`
4. Browser requests `https://abc-xyz.trycloudflare.com/@vite/client` → cloudflared → nginx → Vite

Without this plugin, assets would point to `http://localhost:5173`, which isn't reachable from the tunnel.

---

## Step 6: Docker Compose

```yaml
# compose.yaml
services:
  laravel.test:
    build:
      context: "./docker/8.4"
      dockerfile: Dockerfile
      args:
        WWWGROUP: "${WWWGROUP}"
    image: "sail-8.4/app"
    extra_hosts:
      - "host.docker.internal:host-gateway"
    ports:
      - "${APP_PORT:-80}:80"
      - "${VITE_PORT:-5173}:${VITE_PORT:-5173}"
      - "${REVERB_PORT:-8085}:8085"
    environment:
      WWWUSER: "${WWWUSER}"
      LARAVEL_SAIL: 1
      XDEBUG_MODE: "${SAIL_XDEBUG_MODE:-off}"
      XDEBUG_CONFIG: "${SAIL_XDEBUG_CONFIG:-client_host=host.docker.internal}"
      IGNITION_LOCAL_SITES_PATH: "${PWD}"
    volumes:
      - ".:/var/www/html"
      - "./docker/8.4/nginx.conf:/etc/nginx/sites-enabled/default:ro"
    networks:
      - sail
    depends_on:
      - pgsql
      - redis
      - meilisearch
      - mailpit

  pgsql:
    image: "postgres:17-alpine"
    ports:
      - "${FORWARD_DB_PORT:-5432}:5432"
    environment:
      PGPASSWORD: "${DB_PASSWORD:-secret}"
      POSTGRES_DB: "${DB_DATABASE}"
      POSTGRES_USER: "${DB_USERNAME}"
      POSTGRES_PASSWORD: "${DB_PASSWORD:-secret}"
    volumes:
      - "sail-pgsql:/var/lib/postgresql/data"
      - "./docker/pgsql/create-testing-database.sql:/docker-entrypoint-initdb.d/10-create-testing-database.sql"
    networks:
      - sail
    healthcheck:
      test:
        [
          "CMD",
          "pg_isready",
          "-q",
          "-d",
          "${DB_DATABASE}",
          "-U",
          "${DB_USERNAME}",
        ]
      retries: 3
      timeout: 5s

  redis:
    image: "redis:alpine"
    ports:
      - "${FORWARD_REDIS_PORT:-6379}:6379"
    volumes:
      - "sail-redis:/data"
    networks:
      - sail
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      retries: 3
      timeout: 5s

  meilisearch:
    image: "getmeili/meilisearch:latest"
    ports:
      - "${FORWARD_MEILISEARCH_PORT:-7700}:7700"
    environment:
      MEILI_NO_ANALYTICS: "${MEILISEARCH_NO_ANALYTICS:-false}"
    volumes:
      - "sail-meilisearch:/meili_data"
    networks:
      - sail
    healthcheck:
      test:
        [
          "CMD",
          "wget",
          "--no-verbose",
          "--spider",
          "http://127.0.0.1:7700/health",
        ]
      retries: 3
      timeout: 5s

  mailpit:
    image: "axllent/mailpit:latest"
    ports:
      - "${FORWARD_MAILPIT_PORT:-1025}:1025"
      - "${FORWARD_MAILPIT_DASHBOARD_PORT:-8025}:8025"
    networks:
      - sail

networks:
  sail:
    driver: bridge
volumes:
  sail-pgsql:
    driver: local
  sail-redis:
    driver: local
  sail-meilisearch:
    driver: local
```

**Key detail — the nginx bind mount:**

```yaml
- "./docker/8.4/nginx.conf:/etc/nginx/sites-enabled/default:ro"
```

This mounts the nginx config from your project into the container as read-only. You can edit it on the host and reload nginx inside the container without rebuilding the image. However, on WSL2, bind mount changes sometimes aren't visible until the container is recreated (`docker compose up -d --force-recreate`).

---

## Step 7: Laravel Reverb (WebSockets)

Getting Reverb to work through the tunnel requires changes at three levels.

### 7a. Reverb Config (`config/reverb.php`)

The important settings:

```php
'servers' => [
    'reverb' => [
        'host' => env('REVERB_SERVER_HOST', '0.0.0.0'),  // Listen on all interfaces
        'port' => env('REVERB_SERVER_PORT', 8080),
        'hostname' => env('REVERB_HOST'),
        // ...
        'allowed_origins' => ['*'],  // Accept connections from any origin
    ],
],
```

Setting `allowed_origins` to `['*']` is required because the tunnel domain changes on every restart.

### 7b. Echo Client Configuration (`resources/js/echo.ts`)

The default Echo config hardcodes `localhost` and a specific port. For tunnel compatibility, detect the protocol dynamically:

```typescript
import Echo from "laravel-echo";
import Pusher from "pusher-js";

window.Pusher = Pusher;

const isSecure = window.location.protocol === "https:";

const echo = new Echo({
  broadcaster: "reverb",
  key: import.meta.env.VITE_REVERB_APP_KEY,
  wsHost: window.location.hostname, // Use the current page's hostname
  wsPort: isSecure ? 443 : 80, // Through nginx, not direct to 8085
  wssPort: 443,
  forceTLS: isSecure,
  enabledTransports: isSecure ? ["wss"] : ["ws"],
});

export default echo;
```

**Why this works for both local and tunnel access:**

| Access method                   | `window.location`                 | WebSocket connects to                       |
| ------------------------------- | --------------------------------- | ------------------------------------------- |
| `http://localhost`              | `localhost`, `http:`              | `ws://localhost:80/app/{key}`               |
| `https://abc.trycloudflare.com` | `abc.trycloudflare.com`, `https:` | `wss://abc.trycloudflare.com:443/app/{key}` |

Both paths hit nginx on port 80, which proxies `/app` to Reverb on 8085 internally. The browser never connects to port 8085 directly.

### 7c. The Nginx Proxy (already covered in Step 4)

The `/app` location block in nginx is what makes this work:

```nginx
location /app {
    proxy_pass http://127.0.0.1:8085;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    # ...
}
```

Without this, WebSocket connections through the tunnel would fail because cloudflared only tunnels port 80, and Reverb listens on 8085.

### 7d. Verifying WebSocket Connectivity

We verified the setup in three stages:

**Direct to Reverb (inside container):**

```bash
docker exec laravel.test-1 curl -v \
    -H "Upgrade: websocket" -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    "http://127.0.0.1:8085/app/YOUR_KEY?protocol=7&client=js&version=8.4.0&flash=false"
# Expected: HTTP/1.1 101 Switching Protocols
```

**Through nginx (inside container):**

```bash
docker exec laravel.test-1 curl -v \
    -H "Upgrade: websocket" -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    "http://127.0.0.1:80/app/YOUR_KEY?protocol=7&client=js&version=8.4.0&flash=false"
# Expected: HTTP/1.1 101 Switching Protocols (via nginx)
```

**Through the tunnel (from your machine):**

Open the browser console on the tunnel URL and check the Network tab for a WebSocket connection to `/app/...` with status 101.

> **Note:** Testing WebSocket upgrades through Cloudflare with `curl` returns a 500 because Cloudflare uses HTTP/2 and curl doesn't handle the upgrade correctly. Browsers handle this properly.

---

## Step 8: Session & CSRF Configuration

When accessing through the tunnel (`https://abc.trycloudflare.com`), you may get 419 (CSRF token mismatch) errors on POST requests. This happens because:

1. The session cookie was set for `localhost`
2. The browser is now on `abc.trycloudflare.com`
3. Laravel's CSRF verification fails because the cookie doesn't match

**Fix — set `SESSION_DOMAIN` to null and trust proxies:**

```env
# .env
SESSION_DOMAIN=null
SESSION_SECURE_COOKIE=false
```

In `bootstrap/app.php`, trust all proxies (cloudflared runs locally, so this is safe):

```php
$middleware->trustProxies(at: '*');
```

This tells Laravel to trust the `X-Forwarded-*` headers that cloudflared and nginx set. With `SESSION_DOMAIN=null`, the cookie is scoped to whichever hostname the browser is on.

> **Production note:** In production, set `SESSION_DOMAIN` to your actual domain and `SESSION_SECURE_COOKIE=true`.

---

## Step 9: Environment Variables

Key `.env` settings for this setup:

```env
# App
APP_URL=http://localhost

# Session — null domain works for both localhost and tunnel
SESSION_DRIVER=database
SESSION_DOMAIN=null

# Queue
QUEUE_CONNECTION=database

# Broadcasting
BROADCAST_CONNECTION=reverb

# Reverb
REVERB_APP_ID=777574
REVERB_APP_KEY=your-app-key
REVERB_APP_SECRET=your-app-secret
REVERB_HOST="localhost"
REVERB_PORT=8085
REVERB_SCHEME=http

# Vite reads these, but our echo.ts overrides host/port dynamically
VITE_REVERB_APP_KEY="${REVERB_APP_KEY}"
VITE_REVERB_HOST="${REVERB_HOST}"
VITE_REVERB_PORT="${REVERB_PORT}"
VITE_REVERB_SCHEME="${REVERB_SCHEME}"
```

Note that `VITE_REVERB_HOST` and `VITE_REVERB_PORT` are still set but our `echo.ts` ignores them in favor of `window.location.hostname`. They're kept for documentation and in case you want to revert to direct-connection mode.

---

## Running It

```bash
# Build the image (first time or after Dockerfile changes)
sail build --no-cache

# Start all services
sail up -d

# Start Vite dev server (in a separate terminal)
sail npm run dev

# Find your tunnel URL
docker logs cares-laravel.test-1 2>&1 | grep trycloudflare.com
```

The tunnel URL appears in the logs within a few seconds:

```
Your quick Tunnel has been created! Visit it at:
https://random-words-here.trycloudflare.com
```

---

## Verifying Everything Works

Run these checks to confirm all processes are healthy:

```bash
# 1. All supervisor processes running
docker exec cares-laravel.test-1 ps aux | grep -E "php-fpm|nginx|cloudflared|queue|reverb|schedule"

# 2. Nginx responding
curl -s -o /dev/null -w "%{http_code}" http://localhost
# Expected: 200 or 302

# 3. Tunnel reachable
curl -s -o /dev/null -w "%{http_code}" https://YOUR-URL.trycloudflare.com
# Expected: 200 or 302

# 4. Reverb WebSocket (direct)
docker exec cares-laravel.test-1 curl -s -o /dev/null -w "%{http_code}" \
    -H "Upgrade: websocket" -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    "http://127.0.0.1:8085/app/YOUR_KEY?protocol=7"
# Expected: 101

# 5. Reverb through nginx
docker exec cares-laravel.test-1 curl -s -o /dev/null -w "%{http_code}" \
    -H "Upgrade: websocket" -H "Connection: Upgrade" \
    -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
    "http://127.0.0.1:80/app/YOUR_KEY?protocol=7"
# Expected: 101

# 6. Queue worker processing
sail artisan queue:work --once
# Should process a job or report "No jobs"

# 7. Vite HMR (when npm run dev is running)
curl -s -o /dev/null -w "%{http_code}" http://localhost/@vite/client
# Expected: 200
```

---

## Pitfalls & Troubleshooting

### Tunnel URL changes on every restart

Quick tunnels are ephemeral. Every time cloudflared restarts, you get a new URL. This is by design.

**Mitigations:**

- The `echo.ts` config uses `window.location.hostname`, so WebSockets auto-adapt to any URL
- The Vite `cloudflaredTunnel()` plugin generates relative URLs, so assets work on any domain
- For stable URLs, use a [Named Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps) (free with a Cloudflare account)

### DNS_PROBE_FINISHED_NXDOMAIN

If you see this error for a tunnel URL that was previously working, the tunnel has restarted and generated a new URL. Check the logs:

```bash
docker logs cares-laravel.test-1 2>&1 | grep trycloudflare.com | tail -1
```

### 419 CSRF Token Mismatch

This happens when `SESSION_DOMAIN` is set to a specific domain that doesn't match the tunnel URL. Set it to `null`:

```env
SESSION_DOMAIN=null
```

Also ensure `trustProxies(at: '*')` is set in your middleware.

### WebSocket connection failed

If you see `WebSocket connection to 'wss://localhost:8085/...' failed`:

1. Check that `echo.ts` uses `window.location.hostname` instead of hardcoded `localhost`
2. Verify the nginx `/app` proxy block exists
3. Confirm Reverb is running: `docker exec cares-laravel.test-1 ps aux | grep reverb`

### Vite HMR not working through tunnel

If live reload works on `localhost` but not through the tunnel:

1. Verify `proxy_set_header Origin ""` is set on all Vite proxy locations
2. Check that `allowedHosts: true` is set in `vite.config.ts`
3. Confirm the `cloudflaredTunnel()` plugin is active (the `public/hot` file should be empty)

### WSL2 bind mount not updating

On WSL2, Docker bind mounts can cache file contents. If you edit `nginx.conf` on the host and nginx doesn't see the changes:

```bash
# Recreate the container (not just restart)
docker compose up -d --force-recreate laravel.test
```

A simple `docker compose restart` may not pick up the changes.

### QUIC buffer size warning

You may see:

```
failed to sufficiently increase receive buffer size (was: 208 kiB, wanted: 7168 kiB, got: 416 kiB)
```

This is cloudflared requesting larger UDP buffers for QUIC. On WSL2, you can't increase `net.core.rmem_max` via Docker's `sysctls`. The tunnel still works — it's a performance warning, not an error. On a native Linux host, add to `compose.yaml`:

```yaml
sysctls:
  - net.core.rmem_max=7340032
  - net.core.wmem_max=7340032
```

---

## Moving Toward Production

This development setup is closer to production than the default `artisan serve` because it uses nginx + php-fpm, a queue worker, and a process manager. Here's what to change for actual production:

### Replace Quick Tunnel with Named Tunnel

```bash
# Authenticate with Cloudflare
cloudflared tunnel login

# Create a named tunnel
cloudflared tunnel create my-app

# Configure in ~/.cloudflared/config.yml
tunnel: my-app-id
credentials-file: /root/.cloudflared/my-app-id.json
ingress:
    - hostname: app.yourdomain.com
      service: http://127.0.0.1:80
    - service: http_status:404
```

Named tunnels give you a stable hostname, custom domains, and access policies.

### Production Supervisord Changes

```ini
; Increase queue workers
[program:queue-worker]
numprocs=4                              ; 4 parallel workers
command=php artisan queue:work redis \   ; Use Redis, not database
    --sleep=3 --tries=3 --max-time=3600 \
    --max-jobs=500                       ; Restart after 500 jobs

; Remove cloudflared if using a sidecar/separate service
; Remove Vite (assets are pre-built with npm run build)
```

### Production Nginx Changes

```nginx
# Add gzip compression
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml;

# Add security headers
add_header X-Frame-Options "SAMEORIGIN";
add_header X-Content-Type-Options "nosniff";
add_header X-XSS-Protection "1; mode=block";

# Remove Vite proxy blocks (no dev server in production)
# Keep the /app Reverb proxy block

# Add static asset caching
location ~* \.(css|js|jpg|jpeg|png|gif|ico|svg|woff2?)$ {
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### Production Environment

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://app.yourdomain.com

SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=.yourdomain.com

QUEUE_CONNECTION=redis
CACHE_STORE=redis

REVERB_SCHEME=https
```

### What This Setup Already Gets Right

- **nginx + php-fpm** instead of the single-threaded `artisan serve`
- **Queue workers** managed by supervisord with auto-restart
- **Task scheduler** running without cron (works in containers)
- **WebSocket server** (Reverb) with proper proxy configuration
- **TLS termination** handled by Cloudflare's edge (free SSL)
- **Process supervision** — crashed processes restart automatically
- **Proxy header forwarding** — Laravel sees the correct scheme and IP

The main gaps for production are: proper logging (ship to a log aggregator instead of stdout), health checks (add `/up` endpoint monitoring), horizontal scaling (multiple containers behind a load balancer), and secrets management (don't commit `.env`).

---

## File Reference

| File                          | Purpose                                       |
| ----------------------------- | --------------------------------------------- |
| `docker/8.4/Dockerfile`       | Image definition: PHP-FPM, nginx, cloudflared |
| `docker/8.4/supervisord.conf` | Process manager: 6 managed processes          |
| `docker/8.4/start-container`  | Entry point script                            |
| `docker/8.4/nginx.conf`       | Reverse proxy: PHP, Vite, Reverb              |
| `docker/8.4/php.ini`          | PHP settings (upload size, etc.)              |
| `compose.yaml`                | Docker Compose service definitions            |
| `vite.config.ts`              | Vite + cloudflaredTunnel() plugin             |
| `resources/js/echo.ts`        | Laravel Echo / Reverb client config           |
| `config/reverb.php`           | Reverb server configuration                   |
| `.env`                        | Environment variables                         |
| `bootstrap/app.php`           | Trusted proxies configuration                 |
